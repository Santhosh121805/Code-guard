# CodeGuardian AI - Backend Requirements Documentation

## Project Overview

**CodeGuardian AI** is an autonomous code security platform that provides AI-powered vulnerability detection, analysis, and remediation for code repositories. The frontend is built with Next.js 15, TypeScript, and Tailwind CSS, requiring a comprehensive backend system to support its security features.

## Tech Stack Analysis

### Frontend Stack
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9 with custom design system
- **UI Components**: Radix UI primitives with custom implementations
- **State Management**: React hooks (useState, useEffect)
- **Charts**: Recharts for data visualization
- **Authentication**: Not implemented (needs backend integration)
- **Analytics**: Vercel Analytics integrated

## Required API Endpoints

### 1. Authentication & User Management

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/auth/me
PUT    /api/auth/profile
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### 2. Repository Management

```
GET    /api/repositories
POST   /api/repositories
GET    /api/repositories/{id}
PUT    /api/repositories/{id}
DELETE /api/repositories/{id}
POST   /api/repositories/{id}/scan
GET    /api/repositories/{id}/activity
GET    /api/repositories/{id}/stats
```

### 3. Vulnerability Management

```
GET    /api/vulnerabilities
GET    /api/vulnerabilities/{id}
PUT    /api/vulnerabilities/{id}
DELETE /api/vulnerabilities/{id}
POST   /api/vulnerabilities/{id}/fix
GET    /api/vulnerabilities/{id}/suggestions
GET    /api/vulnerabilities/stats
GET    /api/vulnerabilities/export
```

### 4. Dashboard & Analytics

```
GET    /api/dashboard/stats
GET    /api/dashboard/recent-vulnerabilities
GET    /api/dashboard/activity-timeline
GET    /api/dashboard/charts/vulnerability-trends
GET    /api/dashboard/charts/severity-breakdown
```

### 5. AI Assistant

```
POST   /api/ai/chat
GET    /api/ai/suggestions/{repoId}
POST   /api/ai/analyze
POST   /api/ai/remediate
```

### 6. Notifications

```
GET    /api/notifications
POST   /api/notifications/mark-read/{id}
PUT    /api/notifications/settings
```

## Data Models

### User Model
```typescript
interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'user' | 'viewer'
  settings: UserSettings
  createdAt: Date
  updatedAt: Date
}

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    criticalOnly: boolean
  }
  theme: 'light' | 'dark' | 'system'
}
```

### Repository Model
```typescript
interface Repository {
  id: string
  name: string
  url: string
  provider: 'github' | 'gitlab' | 'bitbucket'
  isActive: boolean
  lastScanned: Date
  vulnerabilityCount: number
  criticalIssues: number
  securityScore: number
  branch: string
  language: string[]
  owner: string
  createdAt: Date
  updatedAt: Date
}
```

### Vulnerability Model
```typescript
interface Vulnerability {
  id: string
  repositoryId: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in-progress' | 'resolved' | 'false-positive'
  type: 'sql-injection' | 'xss' | 'csrf' | 'security-misconfiguration' | 'other'
  file: string
  line: number
  code: string
  cwe?: string
  cvss?: number
  exploitability: 'high' | 'medium' | 'low'
  remediation?: string
  aiSuggestion?: string
  detectedAt: Date
  resolvedAt?: Date
  assignedTo?: string
}
```

### Activity Model
```typescript
interface Activity {
  id: string
  repositoryId: string
  type: 'scan' | 'vulnerability-detected' | 'vulnerability-fixed' | 'repository-added'
  title: string
  description: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
  metadata: Record<string, any>
  createdAt: Date
}
```

### Notification Model
```typescript
interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'vulnerability' | 'scan-complete' | 'system' | 'security-alert'
  severity: 'critical' | 'high' | 'medium' | 'low'
  isRead: boolean
  actionUrl?: string
  createdAt: Date
}
```

## Dashboard Data Requirements

### Stats Grid Component
The frontend expects these stats to be returned from `/api/dashboard/stats`:

```typescript
interface DashboardStats {
  criticalIssues: {
    value: number
    change: string // e.g., "+2 this week"
    trend: 'up' | 'down' | 'stable'
  }
  totalVulnerabilities: {
    value: number
    change: string
    trend: 'up' | 'down' | 'stable'
  }
  fixedIssues: {
    value: number
    change: string
    trend: 'up' | 'down' | 'stable'
  }
  avgFixTime: {
    value: string // e.g., "2.4h"
    change: string
    trend: 'up' | 'down' | 'stable'
  }
}
```

### Repository List Component
Requires repository data with vulnerability counts and scan status:

```typescript
interface RepositoryListItem {
  id: number | string
  name: string
  url: string
  vulnerabilities: number
  lastScanned: string // human-readable format
  status: 'active' | 'inactive' | 'scanning'
}
```

### Vulnerability Table Component
Current frontend implementation expects:

```typescript
interface VulnerabilityTableItem {
  id: number
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in-progress' | 'resolved'
  repository: string
  date: string // human-readable format
}
```

## Authentication Requirements

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string // user ID
  email: string
  name: string
  role: string
  iat: number
  exp: number
}
```

### Session Management
- Access tokens should expire in 15 minutes
- Refresh tokens should expire in 7 days
- Implement token rotation on refresh
- Support for logout (token blacklisting)

## Integration Requirements

### Git Provider Integration
Support for major Git providers:
- **GitHub**: OAuth Apps, GitHub Apps, Webhooks
- **GitLab**: OAuth, Project Access Tokens, Webhooks  
- **Bitbucket**: OAuth, App Passwords, Webhooks

### Webhook Endpoints
```
POST /api/webhooks/github
POST /api/webhooks/gitlab
POST /api/webhooks/bitbucket
```

### AI/ML Integration
- Integration with AI services for vulnerability detection
- Natural language processing for AI assistant chat
- Code analysis and remediation suggestions
- Pattern recognition for custom vulnerability detection

## Security Considerations

### API Security
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers
- CSRF protection
- Proper CORS configuration

### Data Protection
- Encryption at rest for sensitive data
- Encryption in transit (TLS 1.2+)
- Secure handling of Git provider tokens
- PII data handling compliance
- Audit logging for security events

### Access Control
- Role-based access control (RBAC)
- Repository-level permissions
- API key management for integrations
- Secure storage of credentials

## Real-time Features

### WebSocket Events
The frontend may need real-time updates for:
- Scan progress notifications
- New vulnerability alerts
- Chat messages with AI assistant
- Repository status changes

```typescript
interface WebSocketMessage {
  type: 'scan-progress' | 'vulnerability-alert' | 'ai-response' | 'repository-update'
  payload: any
  timestamp: Date
}
```

## File Upload & Processing

### Repository Analysis
- Support for uploading repository archives
- Asynchronous processing of large codebases
- Progress tracking for analysis jobs
- Storage and retrieval of scan results

### Report Generation
- PDF export of vulnerability reports
- CSV export of vulnerability data
- Scheduled report generation
- Custom report templates

## Caching Strategy

### Redis Integration
Recommended caching for:
- Dashboard statistics (5-minute cache)
- Repository metadata (15-minute cache)
- User sessions and permissions
- Rate limiting counters
- AI assistant conversation context

## Database Schema Recommendations

### Primary Tables
1. `users` - User accounts and profiles
2. `repositories` - Connected code repositories
3. `vulnerabilities` - Detected security issues
4. `scans` - Scan history and results
5. `activities` - Activity timeline events
6. `notifications` - User notifications
7. `settings` - Application and user settings
8. `tokens` - OAuth and API tokens

### Relationships
- Users can have multiple repositories (many-to-many)
- Repositories have many vulnerabilities (one-to-many)
- Repositories have many scans (one-to-many)
- Vulnerabilities belong to scans (many-to-one)
- Users receive notifications (one-to-many)

## API Response Formats

### Standard Response Structure
```typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### Error Handling
Consistent error codes and messages:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

## Deployment Considerations

### Environment Variables
```bash
# Database
DATABASE_URL=
REDIS_URL=

# Authentication
JWT_SECRET=
JWT_REFRESH_SECRET=

# Git Providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=

# AI Services
OPENAI_API_KEY=
AI_SERVICE_URL=

# Email
SMTP_HOST=
SMTP_USER=
SMTP_PASS=

# Storage
AWS_S3_BUCKET=
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
```

### Health Checks
```
GET /health
GET /health/db
GET /health/redis
GET /health/ai-service
```

## Monitoring & Logging

### Metrics to Track
- API response times
- Error rates by endpoint
- Authentication success/failure rates
- Vulnerability detection rates
- User activity patterns
- System resource usage

### Audit Logging
- User authentication events
- Repository access and modifications
- Vulnerability status changes
- Admin actions
- API key usage

This comprehensive documentation should provide your backend developer with all the necessary information to build a robust API that supports the CodeGuardian AI frontend application.