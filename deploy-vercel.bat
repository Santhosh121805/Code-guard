@echo off
echo 🚀 Deploying CodeGuardian AI to Vercel...

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Install Vercel CLI if not installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Login to Vercel
echo 🔐 Checking Vercel authentication...
vercel whoami || vercel login

REM Deploy frontend to Vercel
echo 🌐 Deploying frontend...
vercel --prod

echo ✅ Frontend deployed successfully!
echo 🔗 Check your Vercel dashboard for the deployment URL

echo 📝 Next steps:
echo 1. Set up your database (Vercel Postgres or Supabase)
echo 2. Configure environment variables in Vercel dashboard
echo 3. Deploy backend separately or use serverless functions
echo 4. Update API URLs in environment variables

echo 🎉 Deployment script completed!
pause