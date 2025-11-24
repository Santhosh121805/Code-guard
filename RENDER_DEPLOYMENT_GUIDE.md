# CodeGuardian AI - Render Deployment Guide

This repository is configured for deployment on Render with a full-stack architecture.

## Architecture

- **Frontend**: Next.js application (port 3000)
- **Backend**: Node.js/Express API (port 8000)
- **Database**: PostgreSQL
- **Cache**: Redis

## Deployment Steps

### Option 1: Using Render Blueprint (Recommended)

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Select this repository and the `render.yaml` file will be automatically detected
6. Click "Apply" to deploy all services

### Option 2: Manual Deployment

#### 1. Deploy Database Services

**PostgreSQL Database:**
1. Go to Render Dashboard → New → PostgreSQL
2. Name: `codeguardian-db`
3. Database: `codeguardian`
4. User: `codeguardian`
5. Region: Oregon (recommended)
6. Plan: Starter (free tier available)

**Redis Cache:**
1. Go to Render Dashboard → New → Redis
2. Name: `codeguardian-redis`
3. Region: Oregon (recommended)
4. Plan: Starter (free tier available)

#### 2. Deploy Backend Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `codeguardian-backend`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install && npx prisma generate`
   - **Start Command**: `cd backend && npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=8000
     DATABASE_URL=[Copy from PostgreSQL service]
     REDIS_URL=[Copy from Redis service]
     JWT_SECRET=[Generate a secure random string]
     JWT_REFRESH_SECRET=[Generate a secure random string]
     GITHUB_CLIENT_ID=[Your GitHub OAuth App Client ID]
     GITHUB_CLIENT_SECRET=[Your GitHub OAuth App Client Secret]
     AWS_ACCESS_KEY_ID=[Your AWS Access Key]
     AWS_SECRET_ACCESS_KEY=[Your AWS Secret Key]
     AWS_REGION=us-east-1
     BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
     ```

#### 3. Deploy Frontend Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `codeguardian-frontend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=3000
     NEXT_PUBLIC_API_BASE_URL=https://[your-backend-service-url].onrender.com
     ```

## Environment Variables

### Required Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Cache
REDIS_URL=redis://host:port

# GitHub Integration
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GITHUB_WEBHOOK_SECRET=your-github-webhook-secret

# AWS Bedrock AI
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com
```

## Pre-requisites Setup

### 1. GitHub OAuth Application

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App:
   - **Application name**: CodeGuardian AI
   - **Homepage URL**: `https://your-frontend-url.onrender.com`
   - **Authorization callback URL**: `https://your-frontend-url.onrender.com/auth/callback`
3. Copy the Client ID and Client Secret

### 2. AWS Bedrock Setup

1. Create an AWS account if you don't have one
2. Enable Amazon Bedrock service
3. Request access to Claude 3.5 Sonnet model
4. Create IAM user with Bedrock permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel",
           "bedrock:InvokeModelWithResponseStream"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

## Database Migration

After deploying the backend service:

1. Go to your backend service on Render
2. Open the Shell tab
3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Post-Deployment Configuration

### 1. Update CORS Origins

Update the backend environment variable:
```bash
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

### 2. Configure GitHub Webhooks

1. Go to your GitHub repository → Settings → Webhooks
2. Add webhook:
   - **Payload URL**: `https://your-backend-url.onrender.com/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Your webhook secret
   - **Events**: Choose individual events → Pull requests, Pushes

## Monitoring and Logs

- **Logs**: Available in Render Dashboard for each service
- **Health Checks**: Backend includes `/api/health` endpoint
- **Database Monitoring**: Available in PostgreSQL service dashboard

## Scaling

- **Free Tier**: Suitable for development and light usage
- **Production**: Upgrade to paid plans for:
  - Faster builds
  - No sleep mode
  - Custom domains
  - More resources

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check if migrations have been run

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

3. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names for typos

4. **CORS Issues**
   - Update CORS_ORIGIN in backend
   - Verify frontend API URL

### Support

- Check Render documentation: https://render.com/docs
- Review application logs in Render dashboard
- Verify environment variable configuration

## Security Notes

- Keep all secrets and API keys secure
- Use strong, unique passwords for database
- Regularly rotate API keys and tokens
- Enable GitHub security features (2FA, dependency scanning)