// API Configuration - Centralized environment variable management
export const config = {
  // API Base URL - Use local API as primary backend
  apiBaseUrl: (import.meta as any).env?.VITE_API_BASE_URL || '',
  
  // WebSocket URL - for real-time features
  wsUrl: (import.meta as any).env?.VITE_WS_URL || '',
  
  // Environment detection
  isDevelopment: (import.meta as any).env?.DEV || false,
  isProduction: (import.meta as any).env?.PROD || false,
  
  // App configuration
  appName: 'Proud Profits',
  version: '1.0.0',
};

// API endpoint builder - Use relative URLs for local development
export const buildApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Use relative URLs to hit the local server
  return config.apiBaseUrl ? `${config.apiBaseUrl}${cleanEndpoint}` : cleanEndpoint;
};

// WebSocket URL builder
export const buildWsUrl = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.wsUrl}${cleanPath}`;
};

// Environment variable validation
export const validateConfig = () => {
  const missing: string[] = [];
  
  if (!config.apiBaseUrl) {
    console.log('Using relative URLs for API calls (local server)');
  }
  if (!config.wsUrl) {
    console.log('No WebSocket URL configured');
  }
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    console.warn('Using default localhost URLs');
  }
  
  console.log('API Configuration:', {
    apiBaseUrl: config.apiBaseUrl || 'relative URLs',
    wsUrl: config.wsUrl || 'not configured',
    environment: config.isDevelopment ? 'development' : 'production'
  });
};

// Initialize configuration validation on load
validateConfig();