# CodeGuardian AI - Backend Implementation Guide

## 🎯 Give This to Your Backend Developer

---

## Project Overview

Build the complete backend for **CodeGuardian AI** - an autonomous code security platform that:
- Monitors GitHub repositories in real-time via webhooks
- Detects vulnerabilities using AWS Bedrock LLMs (Claude/Nova)
- Automatically generates and submits fix pull requests
- Provides real-time security dashboards via WebSocket

---

## 🏗️ Architecture Requirements

### **Tech Stack to Use**

```
- Backend: Node.js + Express OR Python FastAPI
- Database: PostgreSQL (main data) + Redis (caching/sessions)
- AI/ML: AWS Bedrock (Claude Sonnet for code analysis)
- Storage: Amazon S3 (scan results, code snapshots)
- Compute: AWS Lambda (GitHub webhooks) + ECS Fargate (API server)
- Queue: Amazon SQS (scan jobs) + EventBridge (scheduling)
- Real-time: WebSocket via AWS API Gateway
- Auth: JWT tokens + GitHub OAuth2
```

### **AWS Services Integration**

1. **Amazon Bedrock**: LLM for vulnerability analysis and fix generation
2. **Amazon CodeGuru**: Additional static analysis layer
3. **AWS Lambda**: Handle GitHub webhook events (commits, PRs)
4. **S3**: Store scan reports, code diffs, vulnerability snapshots
5. **SQS**: Queue scanning jobs (prevents overwhelming the system)
6. **EventBridge**: Schedule periodic scans for all repos
7. **API Gateway WebSocket**: Push real-time updates to frontend

---

## 📊 Database Design

### **Core Tables Needed**

**Users Table:**
- Store: id, email, username, github_id, github_access_token (encrypted), subscription_tier (free/pro/enterprise), created_at
- Relationships: One user has many repositories

**Repositories Table:**
- Store: id, user_id, github_repo_id, name, owner, default_branch, language
- Metrics: total_files, total_lines_of_code, total_vulnerabilities, critical_count, high_count, medium_count, low_count, security_score (0-100)
- Status: scan_status (pending/scanning/completed/failed), scan_progress (0-100), last_scan_at
- Settings: auto_scan_enabled, auto_fix_enabled, webhook_configured
- Relationships: One repository has many vulnerabilities

**Vulnerabilities Table:**
- Store: id, repository_id, type (SQL Injection, XSS, etc.), severity (critical/high/medium/low), status (open/fixed/false_positive)
- Location: file_path, line_number, code_snippet
- Analysis: description, explanation (LLM-generated), impact, recommendation
- Standards: cwe_id, owasp_category, cvss_score
- Fix Info: auto_fix_available, fix_confidence (0-1), fix_code, fix_description
- Relationships: One vulnerability can have many scans, one fix_pr

**Scans Table:**
- Store: id, repository_id, trigger_type (webhook/manual/scheduled), status, started_at, completed_at, duration_ms
- Results: files_scanned, lines_scanned, vulnerabilities_found, new_vulnerabilities, fixed_vulnerabilities
- Store S3 path to full scan report

**Fix Pull Requests Table:**
- Store: id, vulnerability_id, repository_id, pr_number, pr_url, status (created/merged/closed/rejected)
- Details: branch_name, commit_sha, files_changed, lines_added, lines_removed
- Track: created_at, merged_at, ai_confidence_score

**Activity Timeline Table:**
- Store: id, user_id, repository_id, event_type (scan_started, vulnerability_detected, fix_applied, pr_merged)
- Details: event_data (JSON), severity, created_at
- Use for dashboard activity feed

---

## 🔌 API Endpoints to Implement

### **Authentication Endpoints**

```
POST   /api/auth/register          - User registration with email/password
POST   /api/auth/login             - Login, return JWT token
POST   /api/auth/github/callback   - GitHub OAuth callback, exchange code for token
POST   /api/auth/logout            - Invalidate JWT token
GET    /api/auth/me                - Get current user profile
```

### **Repository Endpoints**

```
GET    /api/repositories                    - List all user's repositories (with pagination)
POST   /api/repositories/connect            - Connect new GitHub repo (setup webhook)
GET    /api/repositories/:id                - Get single repository details
DELETE /api/repositories/:id                - Disconnect repository (remove webhook)
PATCH  /api/repositories/:id/settings       - Update auto-scan, auto-fix settings
POST   /api/repositories/:id/scan           - Trigger manual scan
GET    /api/repositories/:id/statistics     - Get detailed security metrics
```

### **Vulnerability Endpoints**

```
GET    /api/vulnerabilities                    - List all vulnerabilities (filterable by severity, status, repo)
GET    /api/vulnerabilities/:id                - Get vulnerability details
PATCH  /api/vulnerabilities/:id/status         - Mark as fixed, false_positive, ignored
POST   /api/vulnerabilities/:id/fix            - Trigger AI auto-fix (create PR)
GET    /api/vulnerabilities/:id/explanation    - Get detailed LLM explanation
```

### **Scan Endpoints**

```
GET    /api/scans                   - List all scans with status
GET    /api/scans/:id               - Get scan details and results
GET    /api/scans/:id/report        - Download full scan report (PDF/JSON)
POST   /api/scans/bulk              - Trigger scans for multiple repos
```

### **Dashboard Endpoints**

```
GET    /api/dashboard/stats              - Overall statistics (total vulns, repos, fixes)
GET    /api/dashboard/activity           - Recent activity timeline (last 50 events)
GET    /api/dashboard/trends             - Vulnerability trends over time (for charts)
GET    /api/dashboard/risk-score         - Calculate overall risk score (0-1)
```

### **AI Assistant Endpoints**

```
POST   /api/ai/chat                  - Send message to AI assistant, get response
GET    /api/ai/suggestions           - Get AI-powered security recommendations
POST   /api/ai/explain-vulnerability - Get detailed explanation of vulnerability
```

### **Webhook Endpoints** (AWS Lambda)

```
POST   /api/webhooks/github          - Receive GitHub push events
POST   /api/webhooks/github/pr       - Receive PR events (merged, closed)
```

### **WebSocket Events** (for real-time updates)

```
EMIT   scan:started          - Notify when scan begins
EMIT   scan:progress         - Send progress updates (0-100%)
EMIT   scan:completed        - Notify when scan finishes
EMIT   vulnerability:found   - Push new vulnerability to dashboard
EMIT   fix:applied           - Notify when auto-fix PR is created
EMIT   pr:merged             - Notify when fix PR is merged
```

---

## 🤖 Core Backend Logic to Implement

### **1. GitHub Integration Flow**

```
Step 1: User clicks "Connect Repository" on frontend
Step 2: Backend initiates GitHub OAuth flow
Step 3: User authorizes, GitHub redirects with code
Step 4: Backend exchanges code for access token
Step 5: Backend fetches user's repositories from GitHub API
Step 6: User selects repo to monitor
Step 7: Backend creates webhook on that repo (listen for push events)
Step 8: Store repo details in database
```

### **2. Vulnerability Scanning Flow**

```
TRIGGER: GitHub webhook receives push event OR user clicks "Scan Now"

Step 1: Lambda function receives webhook, pushes job to SQS queue
Step 2: Worker picks up job from queue
Step 3: Clone repository code to temporary location
Step 4: Run initial static analysis (CodeGuru or custom rules)
Step 5: For each file, send code to AWS Bedrock with prompt:
        "Analyze this code for security vulnerabilities. Return JSON with:
         - vulnerability type, severity, line number, description, fix recommendation"
Step 6: Parse LLM response, extract vulnerabilities
Step 7: Save all vulnerabilities to database
Step 8: Update repository metrics (total_vulnerabilities, security_score)
Step 9: Send WebSocket event to frontend with results
Step 10: Save full report to S3
```

### **3. Auto-Fix Generation Flow**

```
TRIGGER: User clicks "Apply Auto-Fix" OR auto_fix_enabled = true

Step 1: Load vulnerability details from database
Step 2: Fetch code context (surrounding lines)
Step 3: Send to AWS Bedrock with prompt:
        "Generate a secure code fix for this vulnerability.
         Return: fixed_code, explanation, test_cases"
Step 4: Parse LLM response
Step 5: Create new branch in GitHub: "codeguardian-fix-{vuln_id}"
Step 6: Commit fixed code to branch
Step 7: Create pull request with:
        - Title: "🔒 Security Fix: {vulnerability_type}"
        - Body: Explanation + Before/After code
Step 8: Store PR details in database
Step 9: Send WebSocket notification to frontend
```

### **4. Real-Time Dashboard Updates**

```
Use WebSocket connection to push updates:

When scan starts:
  → EMIT scan:started { repoId, startTime }

Every 5 seconds during scan:
  → EMIT scan:progress { repoId, progress: 45 }

When vulnerability found:
  → EMIT vulnerability:found { repoId, severity, type }

When scan completes:
  → EMIT scan:completed { repoId, totalVulns, duration }

When auto-fix applied:
  → EMIT fix:applied { vulnId, prUrl, confidence }
```

---

## 🔐 Security & Authentication

### **JWT Token Structure**

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "subscription": "pro",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Expiry:** 7 days  
**Refresh Token:** Store in Redis, 30 days expiry  
**Headers Required:** `Authorization: Bearer {token}`

### **GitHub OAuth Flow**

```
1. Frontend redirects to: https://github.com/login/oauth/authorize?client_id={YOUR_CLIENT_ID}&scope=repo,read:user
2. User authorizes
3. GitHub redirects to: YOUR_BACKEND/api/auth/github/callback?code={AUTH_CODE}
4. Backend exchanges code for access_token
5. Backend fetches user info: GET https://api.github.com/user
6. Create/update user in database
7. Generate JWT token
8. Return JWT to frontend
```

### **Rate Limiting**

- Public endpoints: 100 requests per 15 minutes per IP
- Authenticated endpoints: 1000 requests per hour per user
- Scan endpoints: 10 scans per day (free tier), unlimited (pro)

---

## 📦 AWS Bedrock Integration

### **Prompt Templates for LLM**

**Vulnerability Detection Prompt:**
```
You are a security expert analyzing code for vulnerabilities.

CODE:
{code_snippet}

FILE: {file_path}
LANGUAGE: {language}

Analyze this code and identify ALL security vulnerabilities.
Return JSON array with this exact structure:
[
  {
    "type": "SQL Injection",
    "severity": "critical",
    "line_number": 45,
    "description": "User input directly concatenated into SQL query",
    "impact": "Attacker can read/modify database",
    "cwe_id": "CWE-89",
    "recommendation": "Use parameterized queries"
  }
]

Be thorough but avoid false positives.
```

**Auto-Fix Generation Prompt:**
```
You are a security expert fixing code vulnerabilities.

VULNERABLE CODE:
{vulnerable_code}

VULNERABILITY: {type}
FILE: {file_path}
LINE: {line_number}

Generate a SECURE version of this code.
Return JSON:
{
  "fixed_code": "corrected code here",
  "explanation": "why this fix works",
  "confidence": 0.95,
  "test_cases": ["test case 1", "test case 2"]
}

Ensure the fix:
1. Eliminates the vulnerability
2. Maintains original functionality
3. Follows best practices
4. Is production-ready
```

**Explanation Generation Prompt:**
```
Explain this security vulnerability in simple terms:

TYPE: {vulnerability_type}
CODE: {code_snippet}
LOCATION: {file_path}:{line_number}

Provide:
1. What is the vulnerability?
2. How can it be exploited?
3. What's the potential impact?
4. How to fix it properly?
5. How to prevent it in the future?

Write for developers who may not be security experts.
```

### **Bedrock API Call Example**

```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

response = bedrock.invoke_model(
    modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
    contentType='application/json',
    accept='application/json',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4000,
        "messages": [
            {
                "role": "user",
                "content": VULNERABILITY_DETECTION_PROMPT
            }
        ]
    })
)

result = json.loads(response['body'].read())
vulnerabilities = json.loads(result['content'][0]['text'])
```

---

## 🔄 Background Jobs & Scheduling

### **SQS Queue Workers**

**Queue 1: scan-jobs-queue**
- Purpose: Process repository scans
- Concurrency: 5 workers
- Timeout: 15 minutes per job
- Retry: 3 attempts with exponential backoff

**Queue 2: fix-generation-queue**
- Purpose: Generate auto-fix PRs
- Concurrency: 3 workers
- Timeout: 5 minutes per job

**Queue 3: notification-queue**
- Purpose: Send emails, Slack messages
- Concurrency: 10 workers

### **EventBridge Scheduled Tasks**

```
Daily at 2 AM UTC:
  - Scan all repositories with auto_scan_enabled = true
  - Cleanup old scan reports from S3 (>90 days)
  
Every 6 hours:
  - Update GitHub repository metadata
  - Recalculate security scores
  
Weekly on Monday:
  - Generate weekly security report emails
  - Update compliance tracking data
```

---

## 📊 Response Formats

### **Repository List Response**

```json
{
  "repositories": [
    {
      "id": "uuid",
      "name": "my-app",
      "fullName": "username/my-app",
      "owner": "username",
      "private": false,
      "language": "JavaScript",
      "totalVulnerabilities": 23,
      "criticalCount": 3,
      "highCount": 7,
      "mediumCount": 10,
      "lowCount": 3,
      "securityScore": 67,
      "scanStatus": "completed",
      "lastScanAt": "2024-01-15T10:30:00Z",
      "autoScanEnabled": true,
      "autoFixEnabled": false
    }
  ],
  "total": 15,
  "page": 1,
  "perPage": 20
}
```

### **Dashboard Stats Response**

```json
{
  "totalRepositories": 15,
  "totalVulnerabilities": 234,
  "criticalIssues": 12,
  "autoFixedThisWeek": 47,
  "overallSecurityScore": 72,
  "riskScore": 0.35,
  "scanningNow": 2,
  "trends": {
    "lastWeek": -15,
    "lastMonth": -42
  }
}
```

### **Vulnerability Detail Response**

```json
{
  "id": "uuid",
  "repositoryId": "uuid",
  "type": "SQL Injection",
  "severity": "critical",
  "status": "open",
  "filePath": "src/controllers/user.js",
  "lineNumber": 45,
  "codeSnippet": "const query = 'SELECT * FROM users WHERE id=' + userId;",
  "description": "User input directly concatenated into SQL query without sanitization",
  "explanation": "This vulnerability allows attackers to inject malicious SQL code...",
  "impact": "Full database access, data theft, data modification",
  "recommendation": "Use parameterized queries or prepared statements",
  "cweId": "CWE-89",
  "owasp": "A03:2021 - Injection",
  "cvssScore": 9.8,
  "autoFixAvailable": true,
  "fixConfidence": 0.95,
  "fixPullRequest": {
    "prNumber": 123,
    "prUrl": "https://github.com/user/repo/pull/123",
    "status": "created",
    "createdAt": "2024-01-15T11:00:00Z"
  },
  "detectedAt": "2024-01-15T10:30:00Z"
}
```

### **WebSocket Event Format**

```json
{
  "event": "vulnerability:found",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "repositoryId": "uuid",
    "vulnerability": {
      "id": "uuid",
      "type": "XSS",
      "severity": "high",
      "file": "src/views/profile.html",
      "line": 23
    }
  }
}
```

---

## 🚀 Deployment Requirements

### **Environment Variables**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/codeguardian
REDIS_URL=redis://host:6379

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET_NAME=codeguardian-scans
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# GitHub
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_WEBHOOK_SECRET=xxx

# JWT
JWT_SECRET=xxx
JWT_EXPIRY=7d

# API
API_PORT=8000
API_BASE_URL=https://api.codeguardian.ai
FRONTEND_URL=https://codeguardian.ai

# Rate Limiting
RATE_LIMIT_FREE_TIER=10  # scans per day
RATE_LIMIT_PRO_TIER=unlimited

# WebSocket
WEBSOCKET_URL=wss://ws.codeguardian.ai
```

### **AWS Infrastructure Setup**

```
1. Create RDS PostgreSQL instance (db.t3.medium)
2. Create ElastiCache Redis cluster (cache.t3.small)
3. Create S3 bucket: codeguardian-scans
4. Create SQS queues: scan-jobs, fix-generation, notifications
5. Create Lambda functions: github-webhook-handler
6. Create ECS Fargate service for API (2 tasks min)
7. Create API Gateway with WebSocket support
8. Set up CloudWatch logs for monitoring
9. Configure IAM roles with minimal permissions
```

### **Docker Container**

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "src/server.js"]
```

---

## ✅ Testing Requirements

### **Unit Tests Needed**

- Vulnerability detection logic
- Fix generation logic
- GitHub API integration
- JWT token generation/validation
- Rate limiting logic

### **Integration Tests**

- Full scan workflow (webhook → scan → save → notify)
- Auto-fix PR creation workflow
- WebSocket event delivery
- Database transactions

### **Load Testing**

- 1000 concurrent webhook events
- 100 simultaneous scans
- WebSocket connections (1000+ clients)

---

## 📈 Monitoring & Logging

### **Metrics to Track**

- Scans completed per day
- Average scan duration
- Vulnerabilities detected per scan
- Auto-fix success rate (PRs merged / PRs created)
- API response times (p50, p95, p99)
- WebSocket connection count
- Database query performance
- SQS queue depths

### **Alerts to Configure**

- Scan failure rate > 10%
- API error rate > 5%
- Database connections > 80% pool
- SQS queue depth > 1000
- Bedrock API failures

---

## 🎯 MVP Features (Build These First)

**Phase 1: Core Functionality (Week 1-2)**
- User authentication (JWT + GitHub OAuth)
- Repository connection with webhooks
- Basic vulnerability scanning (using Bedrock)
- Display results on dashboard

**Phase 2: Auto-Fix (Week 3)**
- AI-powered fix generation
- PR creation on GitHub
- Fix tracking

**Phase 3: Real-Time Features (Week 4)**
- WebSocket implementation
- Live dashboard updates
- Activity timeline

**Phase 4: Advanced Features (Week 5+)**
- Compliance tracking
- AI assistant chat
- Scheduled scans
- Email notifications

---

## 📞 Frontend-Backend Communication Summary

**Frontend Expects:**
1. JWT token in localStorage after login
2. All API responses in JSON format
3. WebSocket connection at ws://your-domain/ws
4. Errors with this format: `{ "error": "message", "code": "ERROR_CODE" }`
5. Pagination via query params: `?page=1&limit=20`
6. Date formats in ISO 8601: `2024-01-15T10:30:00Z`

**Frontend Will Send:**
1. Authorization header: `Bearer {token}` on all protected routes
2. GitHub OAuth code after user authorization
3. Repository IDs for scan triggers
4. WebSocket messages for real-time features

---

## 🎉 Deliverables

Your backend should provide:

✅ **REST API** with all endpoints above  
✅ **WebSocket server** for real-time updates  
✅ **GitHub webhook handler** (Lambda)  
✅ **SQS worker services** for scan processing  
✅ **AWS Bedrock integration** for AI features  
✅ **PostgreSQL database** with schema  
✅ **API documentation** (Swagger/OpenAPI)  
✅ **Docker image** for deployment  
✅ **Environment setup guide**  

---

## 🚀 Start Building!

This document contains everything needed to build the backend. Focus on MVP features first, then iterate. The frontend is ready and waiting for your APIs!

**Questions? Review the API endpoint formats and response structures above - they match exactly what the frontend expects.**