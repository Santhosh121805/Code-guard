# Deployment checklist for CodeGuardian AI on Render

## Pre-deployment Setup

### 1. GitHub OAuth Application Setup ⚠️ REQUIRED
- [ ] Create GitHub OAuth App at: https://github.com/settings/developers
- [ ] Set Homepage URL to your future Render frontend URL
- [ ] Set Authorization callback URL to: `https://your-frontend-url.onrender.com/auth/callback`
- [ ] Copy Client ID and Client Secret

### 2. AWS Bedrock Setup ⚠️ REQUIRED  
- [ ] AWS Account created
- [ ] Amazon Bedrock service enabled
- [ ] Request access to Claude 3.5 Sonnet model
- [ ] Create IAM user with Bedrock permissions
- [ ] Generate access keys

## Deployment Process

### Option 1: One-Click Blueprint Deployment (Recommended)
1. [ ] Fork this repository to your GitHub
2. [ ] Go to [Render Dashboard](https://dashboard.render.com)
3. [ ] Click "New" → "Blueprint"
4. [ ] Connect GitHub and select this repository
5. [ ] The `render.yaml` will auto-configure everything
6. [ ] Set environment variables (see list below)
7. [ ] Click "Apply"

### Option 2: Manual Service Deployment
1. [ ] Deploy PostgreSQL database service
2. [ ] Deploy Redis cache service  
3. [ ] Deploy backend web service
4. [ ] Deploy frontend web service
5. [ ] Configure environment variables
6. [ ] Run database migrations

## Required Environment Variables

### Backend Service
```bash
NODE_ENV=production
PORT=8000
DATABASE_URL=[Auto-filled from PostgreSQL service]
REDIS_URL=[Auto-filled from Redis service]
JWT_SECRET=[Generate 32+ character random string]
JWT_REFRESH_SECRET=[Generate 32+ character random string]
GITHUB_CLIENT_ID=[From GitHub OAuth app]
GITHUB_CLIENT_SECRET=[From GitHub OAuth app]
GITHUB_WEBHOOK_SECRET=[Generate random string for webhook security]
AWS_ACCESS_KEY_ID=[From AWS IAM user]
AWS_SECRET_ACCESS_KEY=[From AWS IAM user]
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
CORS_ORIGIN=[Will be frontend URL after deployment]
```

### Frontend Service
```bash
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_BASE_URL=[Will be backend URL after deployment]
```

## Post-Deployment Tasks

### 1. Database Setup
- [ ] Open backend service shell in Render
- [ ] Run: `npx prisma migrate deploy`
- [ ] Verify tables are created

### 2. Update Cross-Service URLs
- [ ] Update backend `CORS_ORIGIN` with frontend URL
- [ ] Update frontend `NEXT_PUBLIC_API_BASE_URL` with backend URL
- [ ] Restart both services

### 3. GitHub Webhook Configuration
- [ ] Go to repository Settings → Webhooks
- [ ] Add webhook URL: `https://[backend-url]/api/webhooks/github`
- [ ] Set content type: `application/json`
- [ ] Add your webhook secret
- [ ] Select events: Pull requests, Pushes

### 4. Test Application
- [ ] Visit frontend URL
- [ ] Test user registration/login
- [ ] Connect GitHub account
- [ ] Add a repository
- [ ] Verify scan functionality

## Service URLs (Fill after deployment)
- Frontend: https://________________.onrender.com
- Backend: https://________________.onrender.com
- Database: ________________.onrender.com:5432

## Helpful Commands

Generate secure secrets:
```bash
# For JWT secrets (run in terminal)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Test API health:
```bash
curl https://your-backend-url.onrender.com/api/health
```

Check database connection:
```bash
# In backend service shell
npx prisma db seed
```

## Common Issues & Solutions

❌ **"Cannot connect to database"**
✅ Verify DATABASE_URL format and run migrations

❌ **"CORS policy error"**  
✅ Update CORS_ORIGIN in backend with exact frontend URL

❌ **"GitHub OAuth fails"**
✅ Check callback URL matches exactly in GitHub app settings

❌ **"AWS Bedrock access denied"**
✅ Verify IAM permissions and model access request approval

❌ **"Build fails"**
✅ Check Node.js version (18+) and dependency conflicts

## Support Resources
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: Report bugs in this repository