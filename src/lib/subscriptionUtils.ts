export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: "free" | "basic" | "premium" | "pro";
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
  maxSignals: number;
  maxTickers: number;
  isActive: boolean;
}

export interface FeatureAccess {
  // Core Features
  basicSignals: boolean;
  premiumSignals: boolean;
  realTimeAlerts: boolean;
  
  // Dashboard Features
  trading_dashboard: boolean;
  
  // Chart Features
  basicCharts: boolean;
  advancedCharts: boolean;
  heatmapAnalysis: boolean;
  cycleForecasting: boolean;
  tradingPlayground: boolean;
  
  // Alert Features
  emailAlerts: boolean;
  smsAlerts: boolean;
  telegramAlerts: boolean;
  pushNotifications: boolean;
  advancedAlerts: boolean;
  multiChannelAlerts: boolean;
  
  // Ticker Limits
  maxTickers: number;
  maxSignalsPerMonth: number;
  
  // Analytics Features
  advancedAnalytics: boolean;
  historicalData: boolean;
  liveStreaming: boolean;
  
  // Admin Features
  adminAccess: boolean;
  
  // Premium Features
  apiAccess: boolean;
  prioritySupport: boolean;
  customIndicators: boolean;
  whiteLabel: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<string, FeatureAccess> = {
  free: {
    // Core Features - NO ACCESS FOR FREE USERS
    basicSignals: false,
    premiumSignals: false,
    realTimeAlerts: false,
    
    // Dashboard Features - NO ACCESS FOR FREE USERS
    trading_dashboard: false,
    
    // Chart Features - NO ACCESS FOR FREE USERS
    basicCharts: false,
    advancedCharts: false,
    heatmapAnalysis: false,
    cycleForecasting: false,
    tradingPlayground: false,
    
    // Alert Features - NO ACCESS FOR FREE USERS
    emailAlerts: false,
    smsAlerts: false,
    telegramAlerts: false,
    pushNotifications: false,
    advancedAlerts: false,
    multiChannelAlerts: false,
    
    // Ticker Limits - NO ACCESS FOR FREE USERS
    maxTickers: 0,
    maxSignalsPerMonth: 0,
    
    // Analytics Features - NO ACCESS FOR FREE USERS
    advancedAnalytics: false,
    historicalData: false,
    liveStreaming: false,
    
    // Admin Features
    adminAccess: false,
    
    // Premium Features - NO ACCESS FOR FREE USERS
    apiAccess: false,
    prioritySupport: false,
    customIndicators: false,
    whiteLabel: false,
  },
  
  basic: {
    // Core Features - BASIC ACCESS
    basicSignals: true,
    premiumSignals: false,
    realTimeAlerts: false, // Basic users cannot access main alerts page
    
    // Dashboard Features - BASIC ACCESS
    trading_dashboard: true,
    
    // Chart Features - BASIC ACCESS ONLY
    basicCharts: true,
    advancedCharts: false,
    heatmapAnalysis: false,
    cycleForecasting: false,
    tradingPlayground: true,
    
    // Alert Features - BASIC ALERTS ONLY
    emailAlerts: true,
    smsAlerts: false,
    telegramAlerts: false,
    pushNotifications: true,
    advancedAlerts: false,
    multiChannelAlerts: false,
    
    // Ticker Limits - LIMITED
    maxTickers: 5,
    maxSignalsPerMonth: 50,
    
    // Analytics Features - BASIC ONLY (no historical OHLC page access)
    advancedAnalytics: false,
    historicalData: false, // Basic users cannot access historical OHLC page
    liveStreaming: false,
    
    // Admin Features
    adminAccess: false,
    
    // Premium Features - NO ACCESS
    apiAccess: false,
    prioritySupport: false,
    customIndicators: false,
    whiteLabel: false,
  },
  
  premium: {
    // Core Features
    basicSignals: true,
    premiumSignals: true,
    realTimeAlerts: true,
    
    // Dashboard Features
    trading_dashboard: true,
    
    // Chart Features
    basicCharts: true,
    advancedCharts: true,
    heatmapAnalysis: true,
    cycleForecasting: true,
    tradingPlayground: true,
    
    // Alert Features - NO ADVANCED ALERTS FOR PREMIUM
    emailAlerts: true,
    smsAlerts: true,
    telegramAlerts: true,
    pushNotifications: true,
    advancedAlerts: false,
    multiChannelAlerts: true,
    
    // Ticker Limits
    maxTickers: 25,
    maxSignalsPerMonth: 500,
    
    // Analytics Features
    advancedAnalytics: true,
    historicalData: true,
    liveStreaming: true,
    
    // Admin Features
    adminAccess: false,
    
    // Premium Features
    apiAccess: true,
    prioritySupport: true,
    customIndicators: false,
    whiteLabel: false,
  },
  
  pro: {
    // Core Features
    basicSignals: true,
    premiumSignals: true,
    realTimeAlerts: true,
    
    // Dashboard Features
    trading_dashboard: true,
    
    // Chart Features
    basicCharts: true,
    advancedCharts: true,
    heatmapAnalysis: true,
    cycleForecasting: true,
    tradingPlayground: true,
    
    // Alert Features
    emailAlerts: true,
    smsAlerts: true,
    telegramAlerts: true,
    pushNotifications: true,
    advancedAlerts: true,
    multiChannelAlerts: true,
    
    // Ticker Limits
    maxTickers: -1, // Unlimited
    maxSignalsPerMonth: -1, // Unlimited
    
    // Analytics Features

    advancedAnalytics: true,
    historicalData: true,
    liveStreaming: true,
    
    // Admin Features
    adminAccess: false,
    
    // Premium Features
    apiAccess: true,
    prioritySupport: true,
    customIndicators: true,
    whiteLabel: true,
  },
};

export function getFeatureAccess(subscriptionTier: string = "free"): FeatureAccess {
  return SUBSCRIPTION_FEATURES[subscriptionTier] || SUBSCRIPTION_FEATURES.free;
}

export function hasAccess(
  userTier: string = "free", 
  requiredFeature: keyof FeatureAccess
): boolean {
  const access = getFeatureAccess(userTier);
  const hasFeature = Boolean(access[requiredFeature]);
  
  // Debug logging
  console.log(`hasAccess DEBUG: userTier=${userTier}, feature=${requiredFeature}, hasFeature=${hasFeature}`, access);
  
  return hasFeature;
}

export function getUpgradeMessage(feature: string): string {
  const upgradeMessages: Record<string, string> = {
    premiumSignals: "Upgrade to Basic plan to access premium trading signals",
    advancedCharts: "Upgrade to Basic plan to unlock advanced chart features",
    heatmapAnalysis: "Upgrade to Basic plan to view 200-week heatmap analysis",
    cycleForecasting: "Upgrade to Premium plan to access cycle forecasting",
    smsAlerts: "Upgrade to Basic plan to enable SMS alerts",
    telegramAlerts: "Upgrade to Premium plan to enable Telegram notifications",
    advancedAlerts: "Upgrade to Premium plan to create advanced alert conditions",
    advancedAnalytics: "Upgrade to Premium plan to unlock advanced analytics",
    apiAccess: "Upgrade to Premium plan to access API features",
    customIndicators: "Upgrade to Pro plan to create custom indicators",
    whiteLabel: "Contact us about Pro plan for white-label solutions",
  };
  
  return upgradeMessages[feature] || "Upgrade your plan to access this feature";
}

export function getPlanBadgeColor(tier: string): string {
  const colors: Record<string, string> = {
    free: "bg-gray-500 text-white",
    basic: "bg-blue-500 text-white",
    premium: "bg-purple-500 text-white",
    pro: "bg-gold-500 text-black bg-gradient-to-r from-yellow-400 to-yellow-600",
  };
  
  return colors[tier] || colors.free;
}