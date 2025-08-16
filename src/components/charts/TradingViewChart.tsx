import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface TradingViewChartProps {
  symbol: string;
  height?: number;
  className?: string;
}

interface PriceData {
  time: string;
  price: number;
}

export default function TradingViewChart({ symbol, height = 400, className = '' }: TradingViewChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current price data
  const { data: priceData, isLoading: isPriceLoading } = useQuery({
    queryKey: [`/api/public/market/price/${symbol}`],
    refetchInterval: 5000,
  });

  // Fetch OHLC data for chart
  const { data: ohlcData, isLoading: isOhlcLoading } = useQuery({
    queryKey: [`/api/public/ohlc?symbol=${symbol}&interval=1w&limit=104`],
    refetchInterval: 30000,
  });

  // Fetch signals data
  const { data: signalsData } = useQuery({
    queryKey: [`/api/public/signals/alerts?ticker=${symbol}&timeframe=1W`],
    refetchInterval: 10000,
  });

  // Update loading state
  useEffect(() => {
    setIsLoading(isPriceLoading || isOhlcLoading);
  }, [isPriceLoading, isOhlcLoading]);

  // Process OHLC data for chart display
  useEffect(() => {
    if (ohlcData && Array.isArray(ohlcData)) {
      const chartData: PriceData[] = ohlcData.map((candle: any) => ({
        time: new Date(candle.openTime).toISOString(),
        price: parseFloat(candle.close)
      }));
      setPriceHistory(chartData);
      setIsLoading(false);
      console.log('Data loaded:', { 
        ohlc: chartData.length, 
        signals: signalsData?.length || 0, 
        price: priceData?.price 
      });
    } else if (ohlcData && !Array.isArray(ohlcData)) {
      console.error('Failed to initialize TradingView chart:', ohlcData);
    }
  }, [ohlcData, signalsData, priceData]);

  // Render loading state
  if (isLoading || priceHistory.length === 0) {
    return (
      <div 
        className={`bg-card border border-border rounded-lg p-4 flex items-center justify-center ${className}`}
        style={{ height: `${height}px` }}
      >
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Loading chart data...</span>
        </div>
      </div>
    );
  }

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card') || '#1e1e2e';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (priceHistory.length < 2) return;

    // Calculate price range
    const prices = priceHistory.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Chart dimensions
    const padding = 60;
    const chartWidth = rect.width - 2 * padding;
    const chartHeight = rect.height - 2 * padding;

    // Draw grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border') || '#374151';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(rect.width - padding, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (priceRange * i) / 5;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground') || '#9CA3AF';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, padding - 10, y + 4);
    }

    // Draw price line
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    priceHistory.forEach((point, index) => {
      const x = padding + (chartWidth * index) / (priceHistory.length - 1);
      const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw area under the line
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '59 130 246';
    ctx.fillStyle = `hsla(${primaryColor}, 0.1)`;
    ctx.beginPath();
    
    priceHistory.forEach((point, index) => {
      const x = padding + (chartWidth * index) / (priceHistory.length - 1);
      const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw current price dot
    if (priceHistory.length > 0) {
      const lastPoint = priceHistory[priceHistory.length - 1];
      const x = rect.width - padding;
      const y = padding + chartHeight - ((lastPoint.price - minPrice) / priceRange) * chartHeight;
      
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary') || '#3B82F6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

  }, [priceHistory]);

  const currentPrice = priceData?.price || (priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 0);
  const priceChange = priceHistory.length >= 2 ? 
    ((priceHistory[priceHistory.length - 1].price - priceHistory[priceHistory.length - 2].price) / priceHistory[priceHistory.length - 2].price * 100) : 0;

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Chart Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">{symbol}</h3>
              <p className="text-sm text-muted-foreground">Weekly Analysis</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(priceChange).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Signal indicators */}
        {signalsData && signalsData.length > 0 && (
          <div className="absolute top-2 right-2">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-muted-foreground">
              {signalsData.length} signals
            </div>
          </div>
        )}
      </div>
    </div>
  );
}