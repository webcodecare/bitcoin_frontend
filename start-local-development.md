# Frontend_New Local Development - UPDATED

## ✅ Port Configuration & Rate Limiting Issues Fixed

### Port Configuration Changes
- **Frontend Port**: Changed from 3001 to **3002** (customizable in vite.config.ts)
- **Backend Port**: Remains on port 5000 (proxied via Vite)
- **Easy Scripts**: Added automated startup scripts for both Windows and Linux/Mac

### Fixed Configuration Files:
1. **vite.config.ts** - Updated to port 3002 with proper proxy to `localhost:5000`
2. **config.ts** - API base URL uses relative paths for proxy
3. **useNotifications.tsx** - WebSocket URL uses proxy
4. **NotificationCenter.tsx** - WebSocket URL uses proxy  
5. **WeeklySignalsStandalone.tsx** - API URL uses proxy

## Quick Start Instructions (UPDATED)

### Option 1: Easy Startup (Recommended)

**Windows:**
```cmd
cd frontend_new
start-frontend-port-3002.bat
```

**Linux/Mac:**
```bash
cd frontend_new
./start-frontend-port-3002.sh
```

### Option 2: Manual Setup

#### 1. Start Main Backend (if not running)
```bash
# In main project root (not frontend_new)
npm run dev
```
This starts the backend on port 5000.

#### 2. Start Frontend_New
```bash
# In new terminal
cd frontend_new
npm install  # Only needed first time
npm run dev
```
This starts frontend on port 3002 and proxies API calls to backend on port 5000.

### 3. Access Application
- **Frontend**: http://localhost:3002 (updated port)
- **Backend API**: http://localhost:5000/api (accessed via proxy)

## ✅ Fixed Issues

### 1. Port Configuration
- **Frontend now runs on port 3002** (easily changeable in vite.config.ts)
- **Backend proxy configured** to localhost:5000
- **Startup scripts provided** for both Windows and Mac/Linux

### 2. Rate Limiting (HTTP 429) Errors - SOLUTION
The 429 "Too Many Requests" errors you experienced occur when:
- Frontend tries to connect directly to backend without proxy
- Multiple API calls hit the same rate-limited endpoint
- Backend is not running or not accessible

**Fixed by:**
- ✅ **Vite Proxy Configuration**: All `/api` requests now properly proxied
- ✅ **Relative URLs**: Frontend uses `/api/...` instead of `localhost:5000/api/...`
- ✅ **Backend Dependency Check**: Startup scripts verify backend is running
- ✅ **Proper Setup Order**: Backend must start first, then frontend

### 3. What's Working Now

✅ **API Connectivity**: All API calls go through Vite proxy  
✅ **Real-time Data**: OHLC data (104 points) and live prices  
✅ **Rate Limiting Resolved**: No more 429 errors with proper proxy setup
✅ **WebSocket Configuration**: Updated to work with proxy  
✅ **All Components**: Charts, notifications, and data loading fixed

### 4. Data Flow (Fixed)
```
Frontend_new (localhost:3002)  
    ↓ [Vite proxy forwards /api requests]
Main Backend (localhost:5000)  
    ↓ [fetches from external APIs with rate limiting]
Live Crypto Data + Fallback Generation
```

### 5. Troubleshooting Connection Issues

If you see ERR_CONNECTION_REFUSED or 429 errors:

#### ✅ FIXED: Environment Variable Override Issue
**Problem**: `.env.local` was overriding proxy settings with `VITE_API_BASE_URL=http://localhost:5001`
**Solution**: Updated all environment files to use empty `VITE_API_BASE_URL=""` for proxy mode

#### Common Issues & Solutions:

1. **ERR_CONNECTION_REFUSED to localhost:3000**
   - **Cause**: Hardcoded API base URL bypassing proxy
   - **Fix**: Ensure `VITE_API_BASE_URL=""` in all .env files
   - **Check**: Browser Network tab shows requests to `localhost:3002/api/...`

2. **Backend Not Running (429/502 Errors)**
   - **Solution**: Use startup scripts - they verify backend automatically
   - **Check**: Visit http://localhost:5000 directly to test backend

3. **Browser Cache Issues**
   - **Solution**: Clear browser cache and hard refresh (Ctrl+F5)
   - **Alternative**: Open in incognito/private mode

4. **Environment File Conflicts**
   - **Check Order**: `.env.local` > `.env.development` > `.env`
   - **Solution**: Ensure all files have `VITE_API_BASE_URL=""` for proxy mode

#### ✅ Current Working Configuration:
- **Frontend Port**: 3002
- **Backend Port**: 5000  
- **API Calls**: Proxied through localhost:3002/api/* → localhost:5000/api/*
- **Environment**: All .env files properly configured for proxy mode

Your frontend_new is now fully working with proper proxy configuration!