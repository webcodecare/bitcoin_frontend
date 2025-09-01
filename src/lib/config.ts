// API Configuration - Centralized environment variable management
export const config = {
  // API Base URL - Use external API as primary backend
  apiBaseUrl: 'https://bitcoin-api.solvemeet.com',
  
  // WebSocket URL - Force empty string to use relative URLs
  wsUrl: '',
  
  // Environment detection
  isDevelopment: (import.meta as any).env?.DEV || false,
  isProduction: (import.meta as any).env?.PROD || false,
  
  // App configuration
  appName: 'Proud Profits',
  version: '1.0.0',
};

// API endpoint builder
export const buildApiUrl = (endpoint: string) => {
  // Ensure endpoint is a string before calling string methods
  if (typeof endpoint !== 'string') {
    console.warn('buildApiUrl: endpoint is not a string', endpoint);
    return '/api/fallback';
  }
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${config.apiBaseUrl}${cleanEndpoint}`;
};

// WebSocket URL builder - Use current host for WebSocket connections
export const buildWsUrl = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }
  return `ws://localhost:3000${cleanPath}`;
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