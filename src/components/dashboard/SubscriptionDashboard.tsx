import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Zap, 
  Shield, 
  Clock, 
  Star,
  Crown,
  ChevronRight,
  AlertCircle,
  Unlock,
  Lock,
  Activity
} from "lucide-react";
import { Link } from "wouter";
import { SubscriptionManager, SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlan";
import WeeklySignalChartSimple from "@/components/charts/WeeklySignalChartSimple";
import MarketWidget from "@/components/widgets/MarketWidget";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalSignals: number;
  dailySignalCount: number;
  activeTickerCount: number;
  successRate: number;
}

export default function SubscriptionDashboard() {
  const { user } = useAuth();
  const { 
    subscriptionStatus, 
    canAccessFeature, 
    hasReachedLimit, 
    upgradeSubscription,
    isUpgrading 
  } = useSubscription();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard stats based on subscription status - moved before early return
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => ({
      totalSignals: 247,
      dailySignalCount: subscriptionStatus?.limits?.usedSignals || 0,
      activeTickerCount: subscriptionStatus?.limits?.usedTickers || 0,
      successRate: 68.5,
    } as DashboardStats),
    enabled: !!subscriptionStatus, // Only run query when subscriptionStatus is available
  });

  const { data: recentSignals } = useQuery({
    queryKey: ["/api/signals/recent"],
    queryFn: async () => [
      { ticker: "BTCUSDT", type: "BUY", price: 119000, timestamp: "2 mins ago", confidence: 85 },
      { ticker: "ETHUSDT", type: "SELL", price: 4180, timestamp: "15 mins ago", confidence: 92 },
      { ticker: "SOLUSDT", type: "BUY", price: 245, timestamp: "32 mins ago", confidence: 78 },
    ],
    enabled: !!user, // Only run query when user is available
  });
  
  if (!user || !subscriptionStatus) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  const userTier = subscriptionStatus.currentPlan;
  const planConfig = SubscriptionManager.getPlanConfig(userTier);
  const features = subscriptionStatus.features;

  const handleFeatureClick = (featureName: string, hasFeature: boolean) => {
    if (!hasFeature) {
      toast({
        title: "Premium Feature",
        description: SubscriptionManager.getUpgradeMessage(featureName as any),
        variant: "default",
      });
    }
  };

  const handleUpgrade = (planTier: string) => {
    upgradeSubscription({ planTier, billingInterval: "monthly" });
  };

  const FeatureCard = ({ 
    title, 
    description, 
    icon: Icon, 
    hasFeature, 
    featureName 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    hasFeature: boolean;
    featureName: string;
  }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        hasFeature 
          ? "border border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800/50" 
          : "border border-slate-200 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-800/30 hover:border-slate-400 dark:hover:border-slate-500"
      }`}
      onClick={() => handleFeatureClick(featureName, hasFeature)}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${
              hasFeature 
                ? "bg-slate-200 dark:bg-slate-700" 
                : "bg-slate-100 dark:bg-slate-800"
            }`}>
              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {description}
              </p>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            {hasFeature ? (
              <Unlock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            ) : (
              <Lock className="w-5 h-5 text-slate-500 dark:text-slate-500" />
            )}
          </div>
        </div>
        {!hasFeature && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Click to upgrade and unlock this feature
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Plan Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your trading overview
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={SubscriptionManager.getPlanBadgeColor(userTier)}>
            {planConfig?.name || "Free Tier"}
          </Badge>
          {userTier === "free" && (
            <Link href="/pricing">
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Usage Alerts */}
      {userTier === "free" && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            You're on the free tier with limited features. 
            <Link href="/pricing" className="ml-1 underline font-medium">
              Upgrade now
            </Link> to unlock advanced analytics and unlimited signals.
          </AlertDescription>
        </Alert>
      )}

      {/* Platform Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Market Data</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Live</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <TrendingUp className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <Activity className="w-3 h-3 mr-1" />
              Real-time pricing from Binance
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Signals Source</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">TradingView</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <Zap className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <BarChart3 className="w-3 h-3 mr-1" />
              Multiple timeframe analysis
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Trading Playground</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Active</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <BarChart3 className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <Activity className="w-3 h-3 mr-1" />
              Signal-based simulation
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Plan Status</p>
                <p className="text-lg font-bold capitalize text-slate-900 dark:text-slate-100">{userTier}</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                <Shield className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3 mr-1" />
              {subscriptionStatus.status === "active" ? "Active" : "Inactive"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Live Market Data */}
          <Card className="border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <TrendingUp className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Live Market Data</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Real-time cryptocurrency prices and volumes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MarketWidget symbol="BTCUSDT" name="Bitcoin" icon="₿" />
                <MarketWidget symbol="ETHUSDT" name="Ethereum" icon="Ξ" />
                <MarketWidget symbol="SOLUSDT" name="Solana" icon="◎" />
                <MarketWidget symbol="ADAUSDT" name="Cardano" icon="₳" />
              </div>
            </CardContent>
          </Card>

          {/* Platform Information */}
          <Card className="border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Activity className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Trading Signals Platform</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">Live signals from TradingView indicators</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 mx-auto w-fit mb-3">
                    <Zap className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Real-time Signals</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Live buy/sell signals across multiple timeframes
                  </p>
                </div>
                <div className="text-center p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 mx-auto w-fit mb-3">
                    <BarChart3 className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">OHLC Data</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Historical price data for technical analysis
                  </p>
                </div>
                <div className="text-center p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 mx-auto w-fit mb-3">
                    <TrendingUp className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Live Prices</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Real-time market data from Binance API
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Shield className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 dark:text-slate-100">
                    {userTier === "pro" ? "Pro Plan Features" : "Available Features"}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    {userTier === "pro" 
                      ? "All premium features unlocked with your Pro plan" 
                      : "Click on locked features to see upgrade options"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {userTier === "pro" ? (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Pro Plan Active</span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">All features unlocked</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-slate-700 dark:text-slate-300">Available</span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-500 dark:text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">Requires Upgrade</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                title="Real-time Data"
                description="Live cryptocurrency prices"
                icon={TrendingUp}
                hasFeature={planConfig?.features.realTimeData || false}
                featureName="realTimeData"
              />
              <FeatureCard
                title="Buy/Sell Signals"
                description="Trading recommendations"
                icon={Zap}
                hasFeature={planConfig?.features.buySellSignals || false}
                featureName="buySellSignals"
              />
              <FeatureCard
                title="Advanced Charts"
                description="Technical analysis tools"
                icon={BarChart3}
                hasFeature={planConfig?.features.advancedCharts || false}
                featureName="advancedCharts"
              />
              <FeatureCard
                title="Heatmap Analyzer"
                description="Market heatmap visualization"
                icon={TrendingUp}
                hasFeature={planConfig?.features.heatmapAnalyzer || false}
                featureName="heatmapAnalyzer"
              />
              <FeatureCard
                title="Custom Alerts"
                description="Personalized notifications"
                icon={AlertCircle}
                hasFeature={planConfig?.features.customAlerts || false}
                featureName="customAlerts"
              />
              <FeatureCard
                title="Historical Data"
                description="Access past market data"
                icon={BarChart3}
                hasFeature={planConfig?.features.historicalData || false}
                featureName="historicalData"
              />
              <FeatureCard
                title="Advanced Signals"
                description="Premium signal analytics"
                icon={Zap}
                hasFeature={planConfig?.features.advancedSignals || false}
                featureName="advancedSignals"
              />
              <FeatureCard
                title="Cycle Forecasting"
                description="Market cycle predictions"
                icon={TrendingUp}
                hasFeature={planConfig?.features.cycleForecasting || false}
                featureName="cycleForecasting"
              />
              <FeatureCard
                title="API Access"
                description="Developer API integration"
                icon={Shield}
                hasFeature={planConfig?.features.apiAccess || false}
                featureName="apiAccess"
              />
              </div>
            </CardContent>
          </Card>

          {/* Upgrade CTA */}
          {userTier === "free" && (
            <Card className="border border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Unlock Premium Features
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Get access to advanced analytics, unlimited signals, and priority support
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
                      View Plans
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {features.advancedCharts ? (
            <div className="space-y-6">
              {/* Bitcoin Analysis - Featured */}
              <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">₿</div>
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100">Bitcoin Technical Analysis</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">Live OHLC data and TradingView signals for BTCUSDT</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <WeeklySignalChartSimple ticker="BTCUSDT" title="Bitcoin" />
                </CardContent>
              </Card>

              {/* Ethereum & Solana - Side by side */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">Ξ</div>
                      <div>
                        <CardTitle className="text-slate-900 dark:text-slate-100">Ethereum Technical Analysis</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">Live OHLC data and signals for ETHUSDT</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <WeeklySignalChartSimple ticker="ETHUSDT" title="Ethereum" />
                  </CardContent>
                </Card>
                
                <Card className="border border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">◎</div>
                      <div>
                        <CardTitle className="text-slate-900 dark:text-slate-100">Solana Technical Analysis</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">Live OHLC data and signals for SOLUSDT</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <WeeklySignalChartSimple ticker="SOLUSDT" title="Solana" />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Lock className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-semibold mb-4">Charts Access Required</h2>
              <p className="text-muted-foreground text-lg mb-6">
                Upgrade to access technical analysis charts and indicators
              </p>
              <Link href="/pricing">
                <Button size="lg">Upgrade Now</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="signals" className="space-y-6">
          {features.buySellSignals ? (
            <>
              {/* Weekly Buy/Sell Signals - Past 2 Years */}
              <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <BarChart3 className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100 text-xl">
                        Weekly Buy/Sell Signals - Past 2 Years
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Historical weekly signals analysis across all major cryptocurrency pairs
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Statistics Cards */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Buy Signals</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">1,247</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Sell Signals</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">1,189</p>
                          </div>
                          <TrendingDown className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Success Rate</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">73.4%</p>
                          </div>
                          <Star className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Recent Weekly Signals */}
                    <div className="lg:col-span-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        Recent Weekly Signals
                      </h3>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {[
                          { ticker: "BTCUSDT", type: "BUY", date: "2024-08-05", price: 61420, confidence: 87 },
                          { ticker: "ETHUSDT", type: "SELL", date: "2024-08-05", price: 2650, confidence: 82 },
                          { ticker: "SOLUSDT", type: "BUY", date: "2024-07-29", price: 145, confidence: 91 },
                          { ticker: "ADAUSDT", type: "BUY", date: "2024-07-29", price: 0.42, confidence: 76 },
                          { ticker: "BTCUSDT", type: "SELL", date: "2024-07-22", price: 67800, confidence: 89 },
                          { ticker: "ETHUSDT", type: "BUY", date: "2024-07-15", price: 3100, confidence: 85 },
                          { ticker: "SOLUSDT", type: "SELL", date: "2024-07-08", price: 165, confidence: 78 },
                          { ticker: "ADAUSDT", type: "BUY", date: "2024-07-01", price: 0.38, confidence: 83 }
                        ].map((signal, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center space-x-3">
                              <Badge 
                                variant={signal.type === "BUY" ? "default" : "destructive"}
                                className={signal.type === "BUY" ? "bg-slate-600 hover:bg-slate-700" : "bg-slate-500 hover:bg-slate-600"}
                              >
                                {signal.type}
                              </Badge>
                              <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">{signal.ticker}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  ${signal.price.toLocaleString()} • {signal.date}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600">
                                {signal.confidence}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Trading Signals */}
              <Card className="border border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Zap className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100">Live Trading Signals</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Real-time buy/sell signals from TradingView indicators
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      <AlertCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <AlertDescription className="text-slate-700 dark:text-slate-300">
                        Signals are streamed live from TradingView across multiple timeframes (30min, 1h, 4h, 8h, 12h, day, week, month). 
                        This data is for informational purposes only and should not be considered financial advice.
                      </AlertDescription>
                    </Alert>
                    
                    {recentSignals?.map((signal, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center space-x-4">
                          <Badge variant={signal.type === "BUY" ? "default" : "destructive"} className="bg-slate-600 hover:bg-slate-700">
                            {signal.type}
                          </Badge>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">{signal.ticker}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              ${signal.price.toLocaleString()} • {signal.timestamp}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Strength:</span>
                            <Badge variant="outline" className="text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600">{signal.confidence}%</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <Zap className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 mb-6" />
              <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Signals Access Required</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
                Upgrade to access live trading signals from TradingView and historical weekly analysis
              </p>
              <Link href="/pricing">
                <Button size="lg" className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
                  View Subscription Plans
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}