import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  height?: number;
  enableTrading?: boolean;
  showSignals?: boolean;
}

interface Signal {
  id: string;
  ticker: string;
  type: 'buy' | 'sell';
  price: string;
  timestamp: string;
  notes?: string;
}

interface MarketData {
  symbol: string;
  price: number;
  change24h?: number;
  volume24h?: number;
  high24h?: number;
  low24h?: number;
}

export default function TradingViewWidget({ 
  symbol = 'BINANCE:BTCUSDT', 
  theme = 'dark',
  height = 600,
  enableTrading = true,
  showSignals = true
}: TradingViewWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeMode, setTradeMode] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'simple' | 'advanced' | 'professional'>('simple');
  const [timeInterval, setTimeInterval] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('5m');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get supported timeframes based on symbol
  const getSupportedTimeframes = () => {
    const ticker = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    if (ticker === 'BTCUSDT' || ticker === 'BTCUSD') {
      // Only show supported timeframes for BTCUSD
      return ['1M', '1W', '1D', '12H', '4H', '1H', '30M'];
    }
    // Default timeframes for other symbols
    return ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
  };

  const supportedTimeframes = getSupportedTimeframes();

  // Extract ticker from symbol (BINANCE:BTCUSDT -> BTCUSDT)
  const ticker = symbol.includes(':') ? symbol.split(':')[1] : symbol;

  // Fetch current market data
  const { data: marketData } = useQuery({
    queryKey: [`/api/market/price/${ticker}`],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Fetch signals for this ticker
  const { data: signals = [] } = useQuery({
    queryKey: [`/api/signals/${ticker}`],
  });

  // Trading mutations
  const buyMutation = useMutation({
    mutationFn: async (data: { amount: number; price?: number }) => {
      return apiRequest('POST', '/api/trading/buy', {
        ticker,
        amount: data.amount,
        type: tradeMode,
        price: data.price
      });
    },
    onSuccess: () => {
      toast({
        title: "Buy Order Placed",
        description: `Successfully placed ${tradeMode} buy order for ${ticker}`,
      });
      setTradeAmount('');
      setLimitPrice('');
    },
    onError: (error) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (data: { amount: number; price?: number }) => {
      return apiRequest('POST', '/api/trading/sell', {
        ticker,
        amount: data.amount,
        type: tradeMode,
        price: data.price
      });
    },
    onSuccess: () => {
      toast({
        title: "Sell Order Placed", 
        description: `Successfully placed ${tradeMode} sell order for ${ticker}`,
      });
      setTradeAmount('');
      setLimitPrice('');
    },
    onError: (error) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update price history and current price
  useEffect(() => {
    if (marketData?.price) {
      setCurrentPrice(marketData.price);
      setPriceHistory(prev => {
        const newHistory = [...prev, marketData.price];
        return newHistory.slice(-100); // Keep last 100 price points
      });
    }
  }, [marketData]);

  // Generate additional chart data based on view mode
  const getChartData = () => {
    const baseData = {
      volume: priceHistory.map(() => Math.random() * 1000000 + 500000),
      rsi: priceHistory.map((_, i) => 30 + Math.sin(i * 0.1) * 20 + Math.random() * 10),
      macd: priceHistory.map((_, i) => Math.sin(i * 0.05) * 500 + Math.random() * 200),
    };
    return baseData;
  };

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceHistory.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const chartHeight = isCompactMode ? height * 0.8 : height;

    // Clear canvas
    ctx.fillStyle = theme === 'dark' ? '#0a0a0a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate price range
    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const priceRange = maxPrice - minPrice || 1;

    // Get additional data for advanced modes
    const chartData = getChartData();

    // Draw grid lines based on view mode
    const gridIntensity = viewMode === 'simple' ? 0.3 : viewMode === 'advanced' ? 0.5 : 0.7;
    ctx.strokeStyle = theme === 'dark' ? `rgba(255,255,255,${gridIntensity * 0.2})` : `rgba(0,0,0,${gridIntensity * 0.2})`;
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const gridLines = viewMode === 'simple' ? 3 : viewMode === 'advanced' ? 5 : 8;
    for (let i = 0; i <= gridLines; i++) {
      const y = (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / gridLines) * i;
      ctx.fillStyle = theme === 'dark' ? '#888888' : '#666666';
      ctx.font = isCompactMode ? '10px Arial' : '12px Arial';
      ctx.fillText(`$${price.toFixed(viewMode === 'professional' ? 2 : 0)}`, 5, y - 5);
    }

    // Vertical grid lines
    const verticalLines = viewMode === 'simple' ? 6 : viewMode === 'advanced' ? 10 : 15;
    for (let i = 0; i <= verticalLines; i++) {
      const x = (width / verticalLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();

      // Time labels for professional mode
      if (viewMode === 'professional' && i % 3 === 0) {
        const timeAgo = Math.round((verticalLines - i) * (timeInterval === '1m' ? 1 : timeInterval === '5m' ? 5 : 15));
        ctx.fillStyle = theme === 'dark' ? '#666666' : '#888888';
        ctx.font = '10px Arial';
        ctx.fillText(`-${timeAgo}${timeInterval.slice(-1)}`, x + 2, chartHeight + 12);
      }
    }

    // Draw price line with different styles based on view mode
    const lineWidth = viewMode === 'simple' ? 2 : viewMode === 'advanced' ? 3 : 2;
    const lineColor = viewMode === 'simple' ? '#00d4aa' : viewMode === 'advanced' ? '#0ea5e9' : '#8b5cf6';
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    priceHistory.forEach((price, index) => {
      const x = (width / (priceHistory.length - 1)) * index;
      const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Add technical indicators for advanced and professional modes
    if (viewMode === 'advanced' || viewMode === 'professional') {
      // Moving Average (Simple)
      const ma20 = [];
      for (let i = 0; i < priceHistory.length; i++) {
        const start = Math.max(0, i - 19);
        const subset = priceHistory.slice(start, i + 1);
        ma20.push(subset.reduce((a, b) => a + b, 0) / subset.length);
      }

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ma20.forEach((price, index) => {
        const x = (width / (ma20.length - 1)) * index;
        const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Professional mode: Add volume bars at bottom
    if (viewMode === 'professional' && !isCompactMode) {
      const volumeHeight = height * 0.2;
      const volumeY = chartHeight + 20;
      const maxVolume = Math.max(...chartData.volume);

      ctx.fillStyle = theme === 'dark' ? 'rgba(100, 116, 139, 0.6)' : 'rgba(148, 163, 184, 0.6)';
      chartData.volume.forEach((vol, index) => {
        const x = (width / (chartData.volume.length - 1)) * index;
        const barHeight = (vol / maxVolume) * volumeHeight;
        ctx.fillRect(x - 1, volumeY + volumeHeight - barHeight, 2, barHeight);
      });

      // Volume label
      ctx.fillStyle = theme === 'dark' ? '#64748b' : '#475569';
      ctx.font = '10px Arial';
      ctx.fillText('Volume', 5, volumeY + 10);
    }

    // Draw current price indicator
    if (currentPrice > 0) {
      const currentY = chartHeight - ((currentPrice - minPrice) / priceRange) * chartHeight;
      
      // Price line
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = viewMode === 'professional' ? 2 : 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(width, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price label with background
      const fontSize = isCompactMode ? 12 : 14;
      ctx.font = `bold ${fontSize}px Arial`;
      const priceText = `$${currentPrice.toFixed(viewMode === 'professional' ? 2 : 0)}`;
      const textWidth = ctx.measureText(priceText).width;
      
      // Background for price label
      ctx.fillStyle = theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
      ctx.fillRect(width - textWidth - 10, currentY - fontSize - 2, textWidth + 8, fontSize + 4);
      
      // Price text
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(priceText, width - textWidth - 6, currentY - 2);

      // Professional mode: Add price change indicator
      if (viewMode === 'professional' && priceHistory.length > 1) {
        const previousPrice = priceHistory[priceHistory.length - 2];
        const change = currentPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;
        
        ctx.font = '10px Arial';
        const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
        ctx.fillStyle = change >= 0 ? '#22c55e' : '#ef4444';
        ctx.fillText(changeText, width - textWidth - 6, currentY + 12);
      }
    }

    // Draw buy/sell signals with enhanced styling
    if (showSignals && Array.isArray(signals) && signals.length > 0) {
      signals.forEach((signal: Signal, index: number) => {
        const signalPrice = parseFloat(signal.price);
        const signalY = chartHeight - ((signalPrice - minPrice) / priceRange) * chartHeight;
        const markerSize = viewMode === 'simple' ? 4 : viewMode === 'advanced' ? 6 : 8;
        const signalX = width - 30 - (index * 25);
        
        // Signal marker with glow effect for professional mode
        if (viewMode === 'professional') {
          // Glow effect
          ctx.shadowColor = signal.type === 'buy' ? '#22c55e' : '#ef4444';
          ctx.shadowBlur = 10;
        }
        
        ctx.fillStyle = signal.type === 'buy' ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(signalX, signalY, markerSize, 0, 2 * Math.PI);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;

        // Signal label with better positioning
        if (viewMode === 'advanced' || viewMode === 'professional') {
          ctx.fillStyle = signal.type === 'buy' ? '#22c55e' : '#ef4444';
          ctx.font = isCompactMode ? '10px Arial' : '12px Arial';
          const label = viewMode === 'professional' ? `${signal.type?.toUpperCase() || 'SIGNAL'} $${signalPrice.toFixed(0)}` : signal.type?.toUpperCase() || 'SIGNAL';
          const labelWidth = ctx.measureText(label).width;
          
          // Background for label
          ctx.fillStyle = theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)';
          ctx.fillRect(signalX - labelWidth/2 - 2, signalY - markerSize - 18, labelWidth + 4, 14);
          
          // Label text
          ctx.fillStyle = signal.type === 'buy' ? '#22c55e' : '#ef4444';
          ctx.fillText(label, signalX - labelWidth/2, signalY - markerSize - 8);
        }
      });
    }

  }, [priceHistory, currentPrice, theme, showSignals, signals, viewMode, timeInterval, isCompactMode]);

  const handleTrade = (action: 'buy' | 'sell') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to trade",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(tradeAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid trade amount",
        variant: "destructive",
      });
      return;
    }

    const tradeData: { amount: number; price?: number } = { amount };
    
    if (tradeMode === 'limit') {
      const price = parseFloat(limitPrice);
      if (!price || price <= 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid limit price",
          variant: "destructive",
        });
        return;
      }
      tradeData.price = price;
    }

    if (action === 'buy') {
      buyMutation.mutate(tradeData);
    } else {
      sellMutation.mutate(tradeData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{ticker} Trading Chart</h3>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Price: ${currentPrice.toFixed(2)}</span>
            {marketData?.change24h && (
              <span className={marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Live</Badge>
          <Badge variant={showSignals ? "default" : "secondary"}>
            Signals {showSignals ? 'On' : 'Off'}
          </Badge>
        </div>
      </div>

      {/* One-Click View Mode Switcher */}
      <Card className="bg-card border-border mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* View Mode Buttons */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium text-foreground">View Mode:</Label>
              <div className="flex space-x-1">
                <Button
                  variant={viewMode === 'simple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('simple')}
                >
                  Simple
                </Button>
                <Button
                  variant={viewMode === 'advanced' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('advanced')}
                >
                  Advanced
                </Button>
                <Button
                  variant={viewMode === 'professional' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('professional')}
                >
                  Pro
                </Button>
              </div>
            </div>

            {/* Time Interval Buttons */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium text-foreground">Interval:</Label>
              <div className="flex space-x-1">
                {['1m', '5m', '15m', '1h', '4h', '1d'].map((interval) => (
                  <Button
                    key={interval}
                    variant={timeInterval === interval ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeInterval(interval as any)}
                  >
                    {interval}
                  </Button>
                ))}
              </div>
            </div>

            {/* Compact Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Label className="text-sm font-medium text-foreground">Compact:</Label>
              <Button
                variant={isCompactMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsCompactMode(!isCompactMode)}
              >
                {isCompactMode ? 'On' : 'Off'}
              </Button>
            </div>
          </div>

          {/* View Mode Description */}
          <div className="mt-3 text-xs text-muted-foreground">
            {viewMode === 'simple' && "Basic price chart with essential trading tools"}
            {viewMode === 'advanced' && "Enhanced chart with technical indicators and volume"}
            {viewMode === 'professional' && "Full-featured chart with advanced analytics and order book"}
          </div>
        </CardContent>
      </Card>

      {/* Chart Canvas */}
      <div className="relative bg-card border border-border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: `${height}px` }}
        />
        
        {/* Loading overlay */}
        {priceHistory.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Signal Information Panel */}
      {enableTrading && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Signal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                This platform provides trading signals and market analysis. 
                Trading signals are for informational purposes only.
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Signal Features</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• TradingView webhook integration</li>
                  <li>• Real-time buy/sell signal alerts</li>
                  <li>• Multiple timeframe support for BTCUSD</li>
                  <li>• Historical signal tracking</li>
                  <li>• Email and SMS notifications</li>
                </ul>
              </div>
              
              <div className="text-xs text-muted-foreground p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <strong>Disclaimer:</strong> This platform does not facilitate actual trading. 
                All signals are for educational and informational purposes only. 
                Users must execute trades on their own trading platforms.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Signals */}
      {showSignals && signals.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {signals.slice(0, 3).map((signal: Signal) => (
                <div key={signal.id} className="flex items-center justify-between p-2 border border-border rounded">
                  <div className="flex items-center space-x-2">
                    <Badge variant={signal.signalType === 'buy' ? 'default' : 'destructive'}>
                      {signal.signalType?.toUpperCase() || 'N/A'}
                    </Badge>
                    <span className="text-foreground">${signal.price}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}