import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSupabaseRealtime, type RealtimeAlert } from "@/hooks/useSupabaseRealtime";
import Sidebar from "@/components/layout/Sidebar";
import SubscriptionGuard, { useFeatureAccess } from "@/components/auth/SubscriptionGuard";

// Lazy load heavy components
const TradingViewRealWidget = lazy(() => import("@/components/charts/TradingViewRealWidget"));
const HeatmapChart = lazy(() => import("@/components/charts/HeatmapChart"));
const CycleChart = lazy(() => import("@/components/charts/CycleChart"));
const AdvancedForecastChart = lazy(() => import("@/components/charts/AdvancedForecastChart"));
const TickerSelector = lazy(() => import("@/components/ui/ticker-selector"));
const CategoryFilter = lazy(() => import("@/components/ui/category-filter"));
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Bell,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Clock
} from "lucide-react";

interface AlertSignal {
  id: string;
  ticker: string;
  signalType: "buy" | "sell";
  price: string;
  timestamp: string;
  source: string;
  note?: string;
}

export default function MultiTickerDashboard() {
  const { user } = useAuth();
  const [recentSignals, setRecentSignals] = useState<AlertSignal[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>(["BTCUSDT", "ETHUSDT"]);
  const [selectedChart, setSelectedChart] = useState<string>("BTCUSDT");

  // Handle ticker selection
  const handleTickerToggle = (symbol: string) => {
    setSelectedTickers(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Fetch user's recent signals
  const { data: userSignals, isLoading: isLoadingSignals } = useQuery({
    queryKey: ["/api/user/signals"],
    queryFn: async () => {
      const response = await fetch("/api/user/signals?limit=20", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch signals");
      }
      return await response.json();
    },
  });

  // Supabase Realtime for real-time updates
  const { realtimeAlerts, isConnected, connectionError } = useSupabaseRealtime();
  
  // Legacy WebSocket for fallback (when Supabase is not configured)
  useWebSocket((message) => {
    if (message.type === "new_signal" && message.signal) {
      setRecentSignals(prev => [message.signal, ...prev.slice(0, 19)]);
    }
  });

  // Update signals from both API and Supabase Realtime
  useEffect(() => {
    if (userSignals) {
      setRecentSignals(userSignals);
    }
  }, [userSignals]);

  // Merge Supabase Realtime alerts with existing signals
  useEffect(() => {
    if (realtimeAlerts.length > 0) {
      // Transform RealtimeAlert to AlertSignal format
      const transformedAlerts = realtimeAlerts.map((alert: RealtimeAlert) => ({
        id: alert.id,
        ticker: alert.ticker,
        signalType: alert.signalType,
        price: alert.price.toString(),
        timestamp: alert.timestamp,
        source: alert.source,
        note: alert.strategy || alert.note
      }));
      
      // Add new alerts to the front of the list, avoiding duplicates
      setRecentSignals(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newAlerts = transformedAlerts.filter(alert => !existingIds.has(alert.id));
        return [...newAlerts, ...prev].slice(0, 20); // Keep last 20 signals
      });
    }
  }, [realtimeAlerts]);

  const quickStats = [
    {
      title: "Signal Accuracy",
      value: "87.5%",
      icon: Target,
      color: "text-emerald-400",
    },
    {
      title: "Last Signal",
      value: "2h ago",
      icon: Clock,
      color: "text-foreground",
    },
    {
      title: "Portfolio",
      value: "+24.5%",
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      title: "Active Alerts",
      value: selectedTickers.length.toString(),
      icon: Bell,
      color: "text-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        {/* Main Content */}
        <div className="ml-64 flex-1">
          {/* Top Bar */}
          <header className="bg-card border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Multi-Ticker Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Tracking {selectedTickers.length} cryptocurrencies - Welcome {user?.firstName || user?.email}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="px-3 py-1">
                  <Activity className="mr-2 h-4 w-4" />
                  Live Data
                </Badge>
                <Button variant="outline">
                  <Bell className="mr-2 h-4 w-4" />
                  Alerts ({recentSignals.length})
                </Button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-6 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center space-x-2">
                  <LineChart className="h-4 w-4" />
                  <span>Charts</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Categories</span>
                </TabsTrigger>
                <TabsTrigger value="signals" className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span>Signals</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quickStats.map((stat, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              {stat.title}
                            </p>
                            <p className={`text-2xl font-bold ${stat.color}`}>
                              {stat.value}
                            </p>
                          </div>
                          <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Ticker Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Cryptocurrency Watchlist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                      <TickerSelector
                        selectedTickers={selectedTickers}
                        onTickerToggle={handleTickerToggle}
                        maxTickers={10}
                      />
                    </Suspense>
                  </CardContent>
                </Card>

                {/* Recent Signals Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {isLoadingSignals ? (
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : recentSignals.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No signals yet. Your trading signals will appear here.
                        </p>
                      ) : (
                        recentSignals.slice(0, 5).map((signal) => (
                          <div key={signal.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge variant={signal.signalType === "buy" ? "default" : "destructive"}>
                                {signal.signalType.toUpperCase()}
                              </Badge>
                              <div>
                                <p className="font-medium">{signal.ticker}</p>
                                <p className="text-sm text-muted-foreground">
                                  ${signal.price} • {new Date(signal.timestamp).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{signal.source}</p>
                              {signal.note && (
                                <p className="text-xs text-muted-foreground">{signal.note}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                {/* Enhanced Multi-Ticker Category Management */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Cryptocurrency Categories</h2>
                    <p className="text-muted-foreground">
                      Explore beyond Bitcoin with 25+ cryptocurrencies organized by category
                    </p>
                  </div>

                  {/* Available Tickers Query */}
                  {(() => {
                    const { data: availableTickers = [], isLoading: isLoadingTickers } = useQuery({
                      queryKey: ["/api/tickers/enabled"],
                    });

                    if (isLoadingTickers) {
                      return (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                      );
                    }

                    return (
                      <CategoryFilter
                        tickers={availableTickers}
                        selectedTickers={selectedTickers}
                        onTickerToggle={handleTickerToggle}
                        maxTickers={10}
                      />
                    );
                  })()}

                  {/* Current Selection Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Current Watchlist ({selectedTickers.length}/10)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedTickers.map((ticker) => (
                            <Badge 
                              key={ticker} 
                              variant="default" 
                              className="flex items-center gap-2 px-3 py-1"
                            >
                              <span>{ticker.replace('USDT', '')}</span>
                              <button
                                onClick={() => handleTickerToggle(ticker)}
                                className="hover:bg-white/20 rounded-full p-0.5"
                              >
                                ✕
                              </button>
                            </Badge>
                          ))}
                        </div>
                        
                        {selectedTickers.length === 0 && (
                          <p className="text-muted-foreground text-center py-8">
                            Select cryptocurrencies from the categories above to start tracking
                          </p>
                        )}
                        
                        {selectedTickers.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            {/* Mock market data display for selected tickers */}
                            {selectedTickers.slice(0, 6).map((ticker, index) => (
                              <Card key={ticker} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold">{ticker.replace('USDT', '')}</span>
                                  <Badge variant={index % 2 === 0 ? "default" : "destructive"}>
                                    {index % 2 === 0 ? '+' : '-'}{(Math.random() * 10).toFixed(2)}%
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ${(Math.random() * 100000).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Vol: ${(Math.random() * 1000000000).toLocaleString(undefined, {notation: 'compact'})}
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                {/* Chart Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Chart to Display</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedTickers.map((ticker) => (
                        <Button
                          key={ticker}
                          variant={selectedChart === ticker ? "default" : "outline"}
                          onClick={() => setSelectedChart(ticker)}
                        >
                          {ticker.replace('USDT', '')}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* TradingView Professional Chart */}
                {selectedChart && (
                  <TradingViewRealWidget 
                    ticker={selectedChart}
                    onTrade={(action, price) => {
                      console.log(`Multi-ticker ${action} order at ${price} for ${selectedChart}`);
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="space-y-6">
                  {/* Advanced Cycle Forecasting */}
                  <SubscriptionGuard feature="cycleForecasting">
                    {selectedChart && (
                      <AdvancedForecastChart ticker={selectedChart} />
                    )}
                  </SubscriptionGuard>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Heatmap */}
                    <SubscriptionGuard feature="heatmapAnalysis">
                      <Card>
                        <CardHeader>
                          <CardTitle>200-Week SMA Heatmap</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <HeatmapChart />
                        </CardContent>
                      </Card>
                    </SubscriptionGuard>

                    {/* Cycle Analysis */}
                    <SubscriptionGuard feature="advancedAnalytics">
                      <Card>
                        <CardHeader>
                          <CardTitle>Cycle Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CycleChart />
                        </CardContent>
                      </Card>
                    </SubscriptionGuard>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signals" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Trading Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {isLoadingSignals ? (
                        <div className="space-y-2">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : recentSignals.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No signals yet. Your trading signals will appear here.
                        </p>
                      ) : (
                        recentSignals.map((signal) => (
                          <div key={signal.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <Badge variant={signal.signalType === "buy" ? "default" : "destructive"}>
                                {signal.signalType.toUpperCase()}
                              </Badge>
                              <div>
                                <p className="font-medium text-lg">{signal.ticker}</p>
                                <p className="text-sm text-muted-foreground">
                                  Price: ${signal.price}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{signal.source}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(signal.timestamp).toLocaleString()}
                              </p>
                              {signal.note && (
                                <p className="text-xs text-muted-foreground mt-1">{signal.note}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}