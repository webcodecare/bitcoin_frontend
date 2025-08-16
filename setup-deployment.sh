#!/bin/bash

# Crypto Trading Platform - Deployment Setup Script

echo "🚀 Setting up deployment configuration..."

# Check if backend URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your backend deployment URL"
    echo "Usage: ./setup-deployment.sh https://your-backend-url.vercel.app"
    exit 1
fi

BACKEND_URL=$1

echo "🔧 Configuring for backend URL: $BACKEND_URL"

# Update .env.production with the provided backend URL
cat > .env.production << EOF
# Production Environment Variables
VITE_API_BASE_URL=$BACKEND_URL
VITE_WS_URL=${BACKEND_URL/https:/wss:}
NODE_ENV=production
EOF

# Update vercel.json with the backend URL
sed -i.bak "s|https://crypto-backend-api.vercel.app|$BACKEND_URL|g" vercel.json

echo "✅ Updated .env.production"
echo "✅ Updated vercel.json"

echo ""
echo "📋 Configuration Summary:"
echo "  API Base URL: $BACKEND_URL"
echo "  WebSocket URL: ${BACKEND_URL/https:/wss:}"
echo ""
echo "🎯 Next steps:"
echo "  1. Deploy your backend first and get the URL"
echo "  2. Run this script with your backend URL"
echo "  3. Build and deploy frontend: npm run build && vercel --prod"
echo ""
echo "✨ Frontend is now configured for production deployment!"