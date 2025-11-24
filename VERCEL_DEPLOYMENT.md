# CodeGuardian AI - Vercel Deployment

This project is configured for deployment on Vercel with separate frontend and backend deployments.

## Architecture
- **Frontend**: Next.js app deployed to Vercel
- **Backend**: Node.js API deployed to Vercel (or separate service)
- **Database**: PostgreSQL (Vercel Postgres or external)
- **Cache**: Redis (Upstash or external)

## Quick Deploy

### Frontend Deployment

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Vercel deployment config"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub: `Santhosh121805/Code-guard`
   - Vercel will auto-detect Next.js configuration
   - Click "Deploy"

### Backend Deployment Options

#### Option A: Vercel Serverless (Recommended for MVP)
Deploy backend as serverless functions on Vercel:

1. Create new Vercel project for backend
2. Import backend folder as separate project
3. Use Vercel Postgres and Upstash Redis

#### Option B: Railway/Render for Backend
Keep backend as traditional Node.js server:

1. Deploy backend to Railway or Render
2. Update frontend API URL

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.vercel.app
```

### Backend (.env)
```bash
DATABASE_URL=postgres://username:password@host:port/database
REDIS_URL=redis://username:password@host:port
JWT_SECRET=your-jwt-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

## Database Setup

### Vercel Postgres (Recommended)
1. Go to Vercel Dashboard → Storage → Create Database
2. Select PostgreSQL
3. Copy connection string to environment variables
4. Run migrations in Vercel Functions

### Alternative: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy database URL
4. Use Supabase dashboard for data management

## Cache Setup

### Upstash Redis (Recommended for Vercel)
1. Go to [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy connection URL
4. Add to environment variables

## Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Vercel deployment setup"
git push origin main
```

### 2. Deploy Frontend
1. Visit [vercel.com/new](https://vercel.com/new)
2. Import `Santhosh121805/Code-guard`
3. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`
4. Deploy

### 3. Deploy Backend (Option A - Vercel)
1. Create new Vercel project
2. Import backend folder
3. Set build command: `npm install && npx prisma generate`
4. Set environment variables
5. Deploy

### 4. Set Up Database
1. Create Vercel Postgres or Supabase database
2. Update DATABASE_URL in backend
3. Run migrations

### 5. Configure Services
1. Update CORS origins
2. Set up GitHub OAuth
3. Configure AWS Bedrock

## Expected URLs
After deployment, you'll have:
- **Frontend**: `https://code-guard-frontend.vercel.app`
- **Backend**: `https://code-guard-backend.vercel.app`

## Testing Deployment
1. Visit frontend URL
2. Test API endpoints: `/api/health`
3. Verify database connection
4. Test GitHub integration

## Troubleshooting

### Build Errors
- Check Node.js version (18+)
- Verify all dependencies in package.json
- Check TypeScript errors

### API Connection Issues
- Verify NEXT_PUBLIC_API_BASE_URL
- Check CORS configuration
- Verify environment variables

### Database Issues
- Check DATABASE_URL format
- Verify network access
- Run migrations

## Scaling Considerations
- **Free Tier**: 100GB bandwidth, 6,000 serverless function invocations
- **Pro Tier**: Unlimited bandwidth, faster builds
- **Database**: Start with shared, upgrade to dedicated

## Security Notes
- All environment variables are encrypted
- API routes are serverless (automatic scaling)
- Database connections are pooled
- HTTPS by default