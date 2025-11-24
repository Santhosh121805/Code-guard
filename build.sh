#!/bin/bash
echo "Starting deployment preparation..."

# Install dependencies for frontend
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

echo "Frontend build completed successfully!"