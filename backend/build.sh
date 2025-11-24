#!/bin/bash
echo "Starting backend deployment preparation..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations (if DATABASE_URL is available)
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy
else
    echo "DATABASE_URL not set, skipping migrations"
fi

echo "Backend build completed successfully!"