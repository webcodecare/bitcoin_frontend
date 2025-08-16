# Frontend Deployment Guide

## Problem Analysis

The 404 errors you're experiencing occur because:

1. **Separated Frontend/Backend**: Your `frontend_new` and `backend_new` are separate projects
2. **Missing API Configuration**: When deployed to Vercel, the frontend can't find the backend API endpoints
3. **Direct API Calls**: Chart components make direct fetch calls without using configured API base URLs

## Solution: Proper API Configuration

### 1. Local Development Setup

For local development where both frontend and backend run together:

```bash
cd frontend_new
npm install
npm run dev  # Runs on port 3000, proxies API calls to backend on port 5000
```

### 2. Deployment Setup

#### Option A: Deploy Both Frontend & Backend Together (Recommended)

Use the main project (not frontend_new/backend_new folders):

```bash
# Deploy the main project which includes both frontend and backend
cd your-main-project
# Deploy to Vercel/Railway/Render - this includes both parts
```

#### Option B: Deploy Frontend & Backend Separately

If you want to deploy frontend_new separately:

1. **Deploy Backend First:**
   ```bash
   cd backend_new
   # Deploy to Vercel/Railway/Render
   # Note your deployment URL: https://your-backend-url.vercel.app
   ```

2. **Configure Frontend:**
   ```bash
   cd frontend_new
   # Update .env with your backend URL:
   echo "VITE_API_BASE_URL=https://your-backend-url.vercel.app" > .env
   
   # Update vercel.json:
   # Change "https://crypto-backend-api.vercel.app" to your actual backend URL
   ```

3. **Deploy Frontend:**
   ```bash
   npm run build
   # Deploy to Vercel
   ```

### 3. Environment Variables

Create these files in `frontend_new/`:

**.env.local** (for local development):
```
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

**.env.production** (for deployment):
```
VITE_API_BASE_URL=https://your-backend-deployment-url.vercel.app
VITE_WS_URL=wss://your-backend-deployment-url.vercel.app
```

### 4. Fixed Issues

✅ **API Configuration**: Fixed inconsistent API base URLs
✅ **Chart Components**: Updated to use centralized API configuration
✅ **Environment Setup**: Created proper .env files
✅ **Deployment Config**: Updated vercel.json with proper backend URL

## Current Status

### Local Development
- ✅ Frontend runs on port 3000
- ✅ Backend runs on port 5000
- ✅ API calls are properly proxied
- ✅ Real-time data loading works

### Deployment Ready
- ✅ Environment variables configured
- ✅ API endpoints use buildApiUrl helper
- ✅ Vercel.json configured for API rewrites
- ✅ All fetch calls updated to use configured URLs

## Next Steps

1. **For Local Development**: Use the main project (not frontend_new/backend_new)
2. **For Deployment**: 
   - Option A: Deploy main project (includes both)
   - Option B: Deploy backend first, then update frontend config with backend URL

## Troubleshooting

### 404 Errors on Deployed Frontend
- Ensure backend is deployed and accessible
- Update VITE_API_BASE_URL to point to your deployed backend
- Check vercel.json rewrites point to correct backend URL

### Local Development Issues
- Use main project for local development
- Ensure backend is running on port 5000
- Frontend should proxy API calls automatically

### API Connection Issues
- Verify backend deployment is accessible
- Check CORS configuration in backend
- Ensure all environment variables are set correctly