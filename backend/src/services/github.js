import axios from 'axios';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { retry } from '../utils/helpers.js';

export class GitHubService {
  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID;
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
    this.redirectUri = `${process.env.API_BASE_URL}/api/auth/github/callback`;
    this.baseURL = 'https://api.github.com';
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }
  }

  // Generate GitHub OAuth URL
  getAuthUrl(state = null) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'repo,read:user,user:email,admin:repo_hook',
      ...(state && { state }),
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const { access_token, error, error_description } = response.data;

      if (error) {
        throw new AppError(`GitHub OAuth error: ${error_description || error}`, 400, 'GITHUB_OAUTH_ERROR');
      }

      // Get user info with the access token
      const user = await this.getUser(access_token);

      return {
        accessToken: access_token,
        user,
      };

    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('GitHub token exchange failed:', error);
      throw new AppError('Failed to authenticate with GitHub', 500, 'GITHUB_AUTH_FAILED');
    }
  }

  // Get user information
  async getUser(accessToken) {
    try {
      const response = await this.makeRequest(accessToken, '/user');
      const user = response.data;

      // Get user's primary email if not public
      if (!user.email) {
        const emailResponse = await this.makeRequest(accessToken, '/user/emails');
        const primaryEmail = emailResponse.data.find(email => email.primary);
        user.email = primaryEmail?.email;
      }

      return user;
    } catch (error) {
      logger.error('Failed to get GitHub user:', error);
      throw new AppError('Failed to get user information from GitHub', 500, 'GITHUB_USER_FETCH_FAILED');
    }
  }

  // Get user's repositories
  async getRepositories(accessToken, page = 1, perPage = 30) {
    try {
      const response = await this.makeRequest(accessToken, '/user/repos', {
        params: {
          page,
          per_page: perPage,
          sort: 'updated',
          affiliation: 'owner,collaborator',
        },
      });

      return {
        repositories: response.data,
        hasMore: response.data.length === perPage,
        page,
        perPage,
      };
    } catch (error) {
      logger.error('Failed to get repositories:', error);
      throw new AppError('Failed to get repositories from GitHub', 500, 'GITHUB_REPOS_FETCH_FAILED');
    }
  }

  // Get specific repository
  async getRepository(accessToken, owner, repo) {
    try {
      const response = await this.makeRequest(accessToken, `/repos/${owner}/${repo}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new AppError('Repository not found', 404, 'REPOSITORY_NOT_FOUND');
      }
      
      logger.error('Failed to get repository:', error);
      throw new AppError('Failed to get repository from GitHub', 500, 'GITHUB_REPO_FETCH_FAILED');
    }
  }

  // Create webhook for repository
  async createWebhook(accessToken, owner, repo, webhookUrl) {
    try {
      const response = await this.makeRequest(accessToken, `/repos/${owner}/${repo}/hooks`, {
        method: 'POST',
        data: {
          name: 'web',
          active: true,
          events: ['push', 'pull_request'],
          config: {
            url: webhookUrl,
            content_type: 'json',
            secret: process.env.GITHUB_WEBHOOK_SECRET,
            insecure_ssl: '0',
          },
        },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 422) {
        // Webhook might already exist
        const existingHooks = await this.getWebhooks(accessToken, owner, repo);
        const existingHook = existingHooks.find(hook => 
          hook.config.url === webhookUrl && hook.name === 'web'
        );
        
        if (existingHook) {
          return existingHook;
        }
      }

      logger.error('Failed to create webhook:', error);
      throw new AppError('Failed to create webhook', 500, 'WEBHOOK_CREATE_FAILED');
    }
  }

  // Get webhooks for repository
  async getWebhooks(accessToken, owner, repo) {
    try {
      const response = await this.makeRequest(accessToken, `/repos/${owner}/${repo}/hooks`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get webhooks:', error);
      throw new AppError('Failed to get webhooks', 500, 'WEBHOOK_GET_FAILED');
    }
  }

  // Delete webhook
  async deleteWebhook(accessToken, owner, repo, webhookId) {
    try {
      await this.makeRequest(accessToken, `/repos/${owner}/${repo}/hooks/${webhookId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      if (error.response?.status === 404) {
        return true; // Already deleted
      }
      
      logger.error('Failed to delete webhook:', error);
      throw new AppError('Failed to delete webhook', 500, 'WEBHOOK_DELETE_FAILED');
    }
  }

  // Get repository contents
  async getContents(accessToken, owner, repo, path = '', ref = null) {
    try {
      const params = ref ? { ref } : {};
      const response = await this.makeRequest(accessToken, `/repos/${owner}/${repo}/contents/${path}`, {
        params,
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new AppError('File or directory not found', 404, 'FILE_NOT_FOUND');
      }
      
      logger.error('Failed to get contents:', error);
      throw new AppError('Failed to get repository contents', 500, 'GITHUB_CONTENTS_FAILED');
    }
  }

  // Create or update file
  async createOrUpdateFile(accessToken, owner, repo, path, content, message, sha = null, branch = null) {
    try {
      const data = {
        message,
        content: Buffer.from(content).toString('base64'),
        ...(sha && { sha }),
        ...(branch && { branch }),
      };

      const response = await this.makeRequest(accessToken, `/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        data,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create/update file:', error);
      throw new AppError('Failed to create or update file', 500, 'GITHUB_FILE_UPDATE_FAILED');
    }
  }

  // Create branch
  async createBranch(accessToken, owner, repo, branchName, fromBranch = 'main') {
    try {
      // Get the SHA of the base branch
      const refResponse = await this.makeRequest(accessToken, `/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`);
      const baseSha = refResponse.data.object.sha;

      // Create new branch
      const response = await this.makeRequest(accessToken, `/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        data: {
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create branch:', error);
      throw new AppError('Failed to create branch', 500, 'GITHUB_BRANCH_CREATE_FAILED');
    }
  }

  // Create pull request
  async createPullRequest(accessToken, owner, repo, title, body, head, base = 'main') {
    try {
      const response = await this.makeRequest(accessToken, `/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        data: {
          title,
          body,
          head,
          base,
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create pull request:', error);
      throw new AppError('Failed to create pull request', 500, 'GITHUB_PR_CREATE_FAILED');
    }
  }

  // Get pull request
  async getPullRequest(accessToken, owner, repo, prNumber) {
    try {
      const response = await this.makeRequest(accessToken, `/repos/${owner}/${repo}/pulls/${prNumber}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get pull request:', error);
      throw new AppError('Failed to get pull request', 500, 'GITHUB_PR_GET_FAILED');
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }

  // Make authenticated request to GitHub API
  async makeRequest(accessToken, endpoint, options = {}) {
    const config = {
      method: 'GET',
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeGuardian-AI/1.0',
      },
      ...options,
    };

    return await retry(async () => {
      try {
        return await axios(config);
      } catch (error) {
        if (error.response) {
          // Handle specific GitHub API errors
          const { status, data } = error.response;
          
          if (status === 403 && data.message?.includes('rate limit')) {
            throw new AppError('GitHub API rate limit exceeded', 429, 'GITHUB_RATE_LIMIT');
          }
          
          if (status === 401) {
            throw new AppError('Invalid GitHub token', 401, 'INVALID_GITHUB_TOKEN');
          }
          
          if (status === 404) {
            throw new AppError('GitHub resource not found', 404, 'GITHUB_NOT_FOUND');
          }
        }
        
        throw error;
      }
    }, 3, 1000);
  }
}

// Export singleton instance
export const github = new GitHubService();