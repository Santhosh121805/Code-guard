// API Configuration and utilities for CodeGuardian AI Frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// API Client class for handling all backend communication
class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Generic request method
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as unknown as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (userData: { name: string; email: string; password: string }) =>
      this.request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    githubAuth: () => 
      `${this.baseURL}/auth/github`,

    logout: () =>
      this.request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      }),

    me: () =>
      this.request<{ user: any }>('/auth/me'),
  };

  // Repository methods
  repositories = {
    list: () =>
      this.request<{ repositories: any[] }>('/repositories'),

    get: (id: string) =>
      this.request<{ repository: any }>(`/repositories/${id}`),

    connect: (repoData: { url: string; name: string }) =>
      this.request<{ success: boolean; repository: any; message?: string; scanning?: boolean }>('/repositories', {
        method: 'POST',
        body: JSON.stringify(repoData),
      }),

    scan: (id: string) =>
      this.request<{ scan: any }>(`/repositories/${id}/scan`, {
        method: 'POST',
      }),

    delete: (id: string) =>
      this.request<{ success: boolean }>(`/repositories/${id}`, {
        method: 'DELETE',
      }),
  };

  // Vulnerability methods
  vulnerabilities = {
    list: (filters?: { severity?: string; status?: string; repositoryId?: string }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      const queryString = params.toString();
      return this.request<{ vulnerabilities: any[] }>(`/vulnerabilities${queryString ? `?${queryString}` : ''}`);
    },

    get: (id: string) =>
      this.request<{ vulnerability: any }>(`/vulnerabilities/${id}`),

    update: (id: string, updates: { status?: string; notes?: string }) =>
      this.request<{ vulnerability: any }>(`/vulnerabilities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    fix: (id: string) =>
      this.request<{ fix: any }>(`/vulnerabilities/${id}/fix`, {
        method: 'POST',
      }),
  };

  // Dashboard methods
  dashboard = {
    stats: () =>
      this.request<{
        totalRepositories: number;
        totalVulnerabilities: number;
        criticalIssues: number;
        resolvedIssues: number;
        weeklyTrends: any;
      }>('/dashboard/stats'),

    activity: () =>
      this.request<{ activities: any[] }>('/dashboard/activity'),

    insights: () =>
      this.request<{ insights: any[] }>('/dashboard/insights'),
  };

  // Health check
  health = () =>
    this.request<{ status: string; timestamp: string }>('/health', {
      method: 'GET',
    });
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for TypeScript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  githubId?: string;
  avatar?: string;
  createdAt: string;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  githubId?: string;
  vulnerabilities: number;
  lastScanned?: string;
  status: 'active' | 'inactive' | 'scanning';
  securityScore?: number;
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  file: string;
  line: number;
  status: 'open' | 'fixed' | 'dismissed' | 'in_progress';
  repositoryId: string;
  detectedAt: string;
  fixedAt?: string;
}

// Utility functions
export const formatApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isApiAvailable = async (): Promise<boolean> => {
  try {
    await apiClient.health();
    return true;
  } catch {
    return false;
  }
};

export default apiClient;