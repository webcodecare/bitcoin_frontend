import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, TrendingDown, Play, Pause } from "lucide-react";

interface WorkingChartProps {
  symbol?: string;
  height?: number;
}

export default function WorkingChart({ 
  symbol = 'BTCUSDT',
  height = 400 
}: WorkingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(67000);
  const [isLive, setIsLive] = useState(true);
  const [change24h, setChange24h] = useState(2.5);

  // Generate realistic price data
  useEffect(() => {
    const generateInitialData = () => {
      const data = [];
      let price = 67000;
      for (let i = 0; i < 50; i++) {
        price += (Math.random() - 0.5) * 500;
        data.push(Math.max(60000, Math.min(75000, price)));
      }
      setPriceHistory(data);
    };

    generateInitialData();
  }, []);

  // Simulate live price updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setPriceHistory(prev => {
        const lastPrice = prev[prev.length - 1] || 67000;
        const newPrice = lastPrice + (Math.random() - 0.5) * 200;
        const clampedPrice = Math.max(60000, Math.min(75000, newPrice));
        
        setCurrentPrice(clampedPrice);
        setChange24h((Math.random() - 0.5) * 5);
        
        return [...prev.slice(-49), clampedPrice];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const chartHeight = height - 40;

    // Clear with TradingView background
    ctx.fillStyle = '#1e222d';
    ctx.fillRect(0, 0, width, height);

    if (priceHistory.length < 2) return;

    const minPrice = Math.min(...priceHistory);
    const maxPrice = Math.max(...priceHistory);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid lines
    ctx.strokeStyle = '#2a2e39';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let i = 0; i <= 8; i++) {
      const x = (width / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();
    }

    // Draw price line
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
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

    // Draw current price indicator
    if (priceHistory.length > 0) {
      const lastPrice = priceHistory[priceHistory.length - 1];
      const lastY = chartHeight - ((lastPrice - minPrice) / priceRange) * chartHeight;
      
      // Price line
      ctx.strokeStyle = '#ffb74d';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(width, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price dot
      ctx.fillStyle = '#2196f3';
      ctx.beginPath();
      ctx.arc(width - 10, lastY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Price label
      ctx.fillStyle = '#ffb74d';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${lastPrice.toFixed(0)}`, width - 15, lastY - 8);
    }

    // Draw price labels
    ctx.fillStyle = '#787b86';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange / 5) * (5 - i);
      const y = (chartHeight / 5) * i;
      ctx.fillText(`$${price.toFixed(0)}`, width - 5, y + 4);
    }

  }, [priceHistory]);

  return (
    <Card className="w-full bg-background border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            {symbol} • Live Chart
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xl font-bold">
                ${currentPrice.toLocaleString()}
              </span>
              <span className={`flex items-center gap-1 ${
                change24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {change24h >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(change24h).toFixed(2)}%
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="h-8 w-8 p-0"
            >
              {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative w-full border-t border-border" style={{ height: `${height}px` }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
          
          {/* Status indicator */}
          <div className="absolute top-4 left-4">
            <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
              isLive ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`} />
              {isLive ? 'LIVE' : 'PAUSED'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}