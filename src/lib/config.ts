// API Configuration - Centralized environment variable management
export const config = {
  // API Base URL - for backend API endpoints
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // WebSocket URL - for real-time features
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
  
  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // App configuration
  appName: 'Crypto Trading Platform',
  version: '1.0.0',
};

// API endpoint builder
export const buildApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${config.apiBaseUrl}${cleanEndpoint}`;
};

// WebSocket URL builder
export const buildWsUrl = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.wsUrl}${cleanPath}`;
};

// Environment variable validation
export const validateConfig = () => {
  const missing = [];
  
  if (!config.apiBaseUrl) missing.push('VITE_API_BASE_URL');
  if (!config.wsUrl) missing.push('VITE_WS_URL');
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    console.warn('Using default localhost URLs');
  }
  
  console.log('API Configuration:', {
    apiBaseUrl: config.apiBaseUrl,
    wsUrl: config.wsUrl,
    environment: config.isDevelopment ? 'development' : 'production'
  });
};

// Initialize configuration validation on load
validateConfig();