import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";

// Lazy load heavy components
const TradingViewWidget = lazy(() => import("@/components/charts/TradingViewWidget"));
const ProfessionalTradingInterface = lazy(() => import("@/components/trading/ProfessionalTradingInterface"));
const MoodBoardWidget = lazy(() => import("@/components/trading/MoodBoardWidget"));
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  Clock,
  Target,
  BarChart3,
  Loader2
} from "lucide-react";

export default function TradingPage() {
  const { user } = useAuth();
  const [selectedTicker, setSelectedTicker] = useState("BTCUSDT");
  const [orderType, setOrderType] = useState("limit");
  const [orderAmount, setOrderAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [priceAnimationKey, setPriceAnimationKey] = useState(0);

  // Fetch market data
  const { data: marketData } = useQuery({
    queryKey: [`/api/market/price/${selectedTicker}`],
    refetchInterval: 2000,
  });

  const currentPrice = (marketData as any)?.price || 65755.0;
  const priceChange = (marketData as any)?.change24h || 2.34;

  // Trigger price animation when price changes
  useEffect(() => {
    setPriceAnimationKey(prev => prev + 1);
  }, [currentPrice]);

  // Chart loading simulation
  useEffect(() => {
    const timer = setTimeout(() => setChartLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-fill current price when switching to limit orders
  useEffect(() => {
    if (orderType === 'limit' && !limitPrice) {
      setLimitPrice(currentPrice.toString());
    }
  }, [orderType, currentPrice, limitPrice]);

  // Quick amount buttons
  const setQuickAmount = (percentage: number) => {
    const maxAmount = 10000 / (parseFloat(limitPrice) || currentPrice);
    const amount = (maxAmount * percentage / 100).toFixed(6);
    setOrderAmount(amount);
  };

  // Market statistics for information display
  const marketStats = {
    volume24h: "$28.5B",
    marketCap: "$1.37T",
    circulatingSupply: "19.8M BTC",
    allTimeHigh: "$73,750",
    dominance: "54.3%"
  };

  const handleOrder = async (side: 'buy' | 'sell') => {
    if (!orderAmount || (!limitPrice && orderType === 'limit')) {
      alert('Please fill in all required fields');
      return;
    }

    setIsPlacingOrder(true);
    
    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Order placed:", {
        side,
        ticker: selectedTicker,
        type: orderType,
        amount: orderAmount,
        price: orderType === 'limit' ? limitPrice : currentPrice
      });
      
      setOrderSuccess(true);
      setOrderAmount("");
      setLimitPrice("");
      
      // Reset success state after 3 seconds
      setTimeout(() => setOrderSuccess(false), 3000);
      
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-0">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm p-2 lg:p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm lg:text-base">
                  B
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold">BTC-USDT</h1>
                  <p className="text-xs lg:text-sm text-muted-foreground">Bitcoin</p>
                </div>
              </div>
              
              <div className="hidden sm:flex items-center gap-3 lg:gap-6 overflow-x-auto">
                <div className="min-w-[100px]">
                  <p className="text-xs lg:text-sm text-muted-foreground">Last Price</p>
                  <motion.div
                    key={priceAnimationKey}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="text-lg lg:text-2xl font-bold"
                  >
                    ${currentPrice.toLocaleString()}
                  </motion.div>
                </div>
                <div className="min-w-[100px]">
                  <p className="text-xs lg:text-sm text-muted-foreground">24h Change</p>
                  <motion.div 
                    key={`change-${priceAnimationKey}`}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    <motion.div
                      animate={{ rotate: priceChange >= 0 ? 0 : 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      {priceChange >= 0 ? <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" /> : <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4" />}
                    </motion.div>
                    <span className="font-medium text-sm lg:text-base">{priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                  </motion.div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h High</p>
                  <p className="font-medium">${(currentPrice * 1.02).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h Low</p>
                  <p className="font-medium">${(currentPrice * 0.98).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <p className="font-medium">{Math.floor(Math.random() * 100000)}.{Math.floor(Math.random() * 1000)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Chart Area */}
          <div className="flex-1 p-2 lg:p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 relative overflow-hidden">
                <CardContent className="p-4 h-full relative">
                  <AnimatePresence>
                    {!chartLoaded && (
                      <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <div className="text-sm text-muted-foreground">Loading TradingView Chart...</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: chartLoaded ? 1 : 0.5 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full"
                  >
                    <Suspense fallback={<div className="h-[400px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center"><div className="text-muted-foreground">Loading Chart...</div></div>}>
                      <TradingViewWidget 
                        symbol={`BINANCE:${selectedTicker}`}
                        theme="dark"
                        height={600}
                        enableTrading={true}
                        showSignals={true}
                      />
                    </Suspense>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Trading Interface Grid */}
          <div className="p-4 grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Professional Trading Interface */}
            <div className="xl:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <Suspense fallback={<div className="h-64 w-full bg-muted animate-pulse rounded-lg" />}>
                  <ProfessionalTradingInterface 
                    symbol={selectedTicker}
                    currentPrice={currentPrice}
                  />
                </Suspense>
              </motion.div>
            </div>
            
            {/* Mood Board Widget */}
            <div className="xl:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              >
                <Suspense fallback={<div className="h-64 w-full bg-muted animate-pulse rounded-lg" />}>
                  <MoodBoardWidget />
                </Suspense>
              </motion.div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
