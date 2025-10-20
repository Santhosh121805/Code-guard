import { Router } from 'express';
import { validateGitHubWebhook } from '../middleware/validation.js';
import { scanner } from '../services/scanner.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const router = Router();

// GitHub webhook handler
router.post('/github', validateGitHubWebhook, async (req, res) => {
  try {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    logger.info(`Received GitHub webhook: ${event}`, {
      repository: payload.repository?.full_name,
      action: payload.action
    });

    // Handle push events (code changes)
    if (event === 'push') {
      await handlePushEvent(payload);
    }
    
    // Handle pull request events
    else if (event === 'pull_request') {
      await handlePullRequestEvent(payload);
    }
    
    // Handle repository events (settings changes)
    else if (event === 'repository') {
      await handleRepositoryEvent(payload);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
  } catch (error) {
    logger.error('Webhook processing failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Webhook processing failed' 
    });
  }
});

async function handlePushEvent(payload) {
  try {
    const { repository, ref, commits, pusher } = payload;
    
    // Only process pushes to main/master branches by default
    const branch = ref.replace('refs/heads/', '');
    
    // Find repository in our database
    const repo = await prisma.repository.findFirst({
      where: {
        githubId: repository.id.toString(),
        branch: branch
      },
      include: { user: true }
    });

    if (!repo || !repo.autoScan) {
      logger.info(`Skipping scan for repository ${repository.full_name} (not configured for auto-scan)`);
      return;
    }

    // Check if commits contain security-relevant changes
    const hasSecurityRelevantChanges = commits.some(commit => 
      commit.added.some(file => isSecurityRelevantFile(file)) ||
      commit.modified.some(file => isSecurityRelevantFile(file))
    );

    if (!hasSecurityRelevantChanges) {
      logger.info(`No security-relevant changes detected in push to ${repository.full_name}`);
      return;
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'WEBHOOK_PUSH_RECEIVED',
        description: `Code push detected in ${repository.full_name}. Auto-scan triggered.`,
        userId: repo.userId,
        repositoryId: repo.id
      }
    });

    // Trigger automatic scan with delay to allow GitHub to process the push
    setTimeout(async () => {
      try {
        await scanner.triggerScan(repo.id, repo.userId);
        logger.info(`Auto-scan triggered for ${repository.full_name} after push`);
      } catch (scanError) {
        logger.error(`Failed to trigger auto-scan for ${repository.full_name}:`, scanError);
      }
    }, 30000); // 30 second delay

  } catch (error) {
    logger.error('Failed to handle push event:', error);
  }
}

async function handlePullRequestEvent(payload) {
  try {
    const { action, pull_request, repository } = payload;

    // Only process opened and synchronized (updated) PRs
    if (!['opened', 'synchronize'].includes(action)) {
      return;
    }

    // Find repository in our database
    const repo = await prisma.repository.findFirst({
      where: {
        githubId: repository.id.toString()
      },
      include: { user: true }
    });

    if (!repo || !repo.autoScan) {
      return;
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'WEBHOOK_PR_RECEIVED',
        description: `Pull request ${action} in ${repository.full_name}: #${pull_request.number}`,
        userId: repo.userId,
        repositoryId: repo.id
      }
    });

    // For PRs, we could implement branch scanning in the future
    // For now, just log the event
    logger.info(`PR ${action} detected for ${repository.full_name} #${pull_request.number}`);

  } catch (error) {
    logger.error('Failed to handle pull request event:', error);
  }
}

async function handleRepositoryEvent(payload) {
  try {
    const { action, repository } = payload;

    // Handle repository settings changes
    if (action === 'edited') {
      const repo = await prisma.repository.findFirst({
        where: {
          githubId: repository.id.toString()
        }
      });

      if (repo) {
        // Update repository metadata
        await prisma.repository.update({
          where: { id: repo.id },
          data: {
            name: repository.name,
            fullName: repository.full_name,
            description: repository.description,
            language: repository.language,
            isPrivate: repository.private,
            updatedAt: new Date()
          }
        });

        logger.info(`Updated repository metadata for ${repository.full_name}`);
      }
    }

  } catch (error) {
    logger.error('Failed to handle repository event:', error);
  }
}

function isSecurityRelevantFile(filePath) {
  const securityRelevantExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
    '.py', '.rb', '.php', '.java', '.cs', '.cpp', '.c',
    '.go', '.rs', '.swift', '.kt', '.scala',
    '.sql', '.yaml', '.yml', '.json', '.xml',
    '.sh', '.bash', '.ps1'
  ];

  const securityRelevantFiles = [
    'package.json', 'package-lock.json', 'yarn.lock', 'pom.xml',
    'build.gradle', 'requirements.txt', 'composer.json', 'gemfile',
    'dockerfile', '.env', 'config.js', 'config.json', 'web.config'
  ];

  const fileName = filePath.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));

  return (
    securityRelevantExtensions.includes(extension) ||
    securityRelevantFiles.some(file => fileName.includes(file)) ||
    fileName.includes('config') ||
    fileName.includes('secret') ||
    fileName.includes('key') ||
    fileName.includes('auth')
  );
}

export default router;