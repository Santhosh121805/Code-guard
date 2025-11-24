#!/bin/bash

echo "🚀 Deploying CodeGuardian AI to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

# Deploy frontend to Vercel
echo "🌐 Deploying frontend..."
vercel --prod

# Get the deployment URL
FRONTEND_URL=$(vercel ls --scope=team | grep "codeguardian" | head -n1 | awk '{print $2}')

echo "✅ Frontend deployed successfully!"
echo "🔗 Frontend URL: https://$FRONTEND_URL"

echo "📝 Next steps:"
echo "1. Set up your database (Vercel Postgres or Supabase)"
echo "2. Configure environment variables in Vercel dashboard"
echo "3. Deploy backend separately or use serverless functions"
echo "4. Update API URLs in environment variables"

echo "🎉 Deployment script completed!"