import React, { useEffect, useRef, useState } from 'react';
import { buildApiUrl } from '@/lib/config';

interface WeeklySignalsChartProps {
  height?: number;
  className?: string;
  title?: string;
}

interface AlertSignal {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  timeframe: string;
  notes?: string;
}

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function FixedWeeklySignalChart({ 
  height = 500, 
  className = '',
  title = 'Weekly Buy/Sell Signals - Past 2 Years'
}: WeeklySignalsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([]);
  const [signals, setSignals] = useState<AlertSignal[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch data from API
  const fetchData = async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);

      console.log('Loading chart data...');
      
      const [ohlcResponse, signalsResponse, priceResponse] = await Promise.all([
        fetch('/api/public/ohlc?symbol=BTCUSDT&interval=1w&limit=104').then(r => r.json()),
        fetch('/api/public/signals/alerts?ticker=BTCUSDT&timeframe=1W').then(r => r.json()),
        fetch('/api/public/market/price/BTCUSDT').then(r => r.json())
      ]);

      if (ohlcResponse?.data?.length) {
        setOhlcData(ohlcResponse.data);
      }

      if (signalsResponse?.data?.length) {
        setSignals(signalsResponse.data);
      }

      if (priceResponse?.price) {
        setCurrentPrice(priceResponse.price);
      }

      console.log('Data loaded:', {
        ohlc: ohlcResponse?.data?.length || 0,
        signals: signalsResponse?.data?.length || 0,
        price: priceResponse?.price
      });

      setConnectionStatus('connected');
      setIsLoading(false);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error loading chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setConnectionStatus('error');
      setIsLoading(false);
    }
  };

  // Draw canvas chart
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ohlcData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Calculate price range
    const prices = ohlcData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices) * 0.98;
    const maxPrice = Math.max(...prices) * 1.02;
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (i * priceRange) / 5;
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toLocaleString()}`, padding - 10, y + 4);
    }

    // Vertical grid lines
    const timeStep = Math.max(1, Math.floor(ohlcData.length / 10));
    for (let i = 0; i < ohlcData.length; i += timeStep) {
      const x = padding + (i * chartWidth) / (ohlcData.length - 1);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
      
      // Time labels
      const date = new Date(ohlcData[i].time);
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(x, padding + chartHeight + 15);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(date.toLocaleDateString(), 0, 0);
      ctx.restore();
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, chartWidth / ohlcData.length * 0.8);
    
    ohlcData.forEach((candle, index) => {
      const x = padding + (index * chartWidth) / (ohlcData.length - 1);
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;

      const isGreen = candle.close > candle.open;
      ctx.strokeStyle = isGreen ? '#4ADE80' : '#F87171';
      ctx.fillStyle = isGreen ? '#4ADE80' : '#F87171';
      ctx.lineWidth = 1;

      // Draw wick
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      if (isGreen) {
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, Math.max(1, bodyHeight));
      } else {
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, Math.max(1, bodyHeight));
      }
    });

    // Draw signals
    signals.forEach(signal => {
      // Find corresponding price point
      const signalTime = new Date(signal.timestamp);
      let closestIndex = 0;
      let minTimeDiff = Infinity;
      
      ohlcData.forEach((candle, index) => {
        const candleTime = new Date(candle.time);
        const timeDiff = Math.abs(candleTime.getTime() - signalTime.getTime());
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestIndex = index;
        }
      });

      const x = padding + (closestIndex * chartWidth) / (ohlcData.length - 1);
      const y = padding + ((maxPrice - signal.price) / priceRange) * chartHeight;

      // Draw signal arrow
      ctx.fillStyle = signal.signalType === 'buy' ? '#10B981' : '#EF4444';
      ctx.beginPath();
      
      if (signal.signalType === 'buy') {
        // Up arrow
        ctx.moveTo(x, y - 20);
        ctx.lineTo(x - 10, y - 5);
        ctx.lineTo(x + 10, y - 5);
      } else {
        // Down arrow
        ctx.moveTo(x, y + 20);
        ctx.lineTo(x - 10, y + 5);
        ctx.lineTo(x + 10, y + 5);
      }
      
      ctx.closePath();
      ctx.fill();

      // Signal price label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `$${signal.price.toLocaleString()}`,
        x,
        signal.signalType === 'buy' ? y - 25 : y + 35
      );
    });

    // Draw current price line if available
    if (currentPrice) {
      const currentY = padding + ((maxPrice - currentPrice) / priceRange) * chartHeight;
      
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(padding + chartWidth, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current price label
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`$${currentPrice.toLocaleString()}`, padding + chartWidth + 10, currentY + 5);
    }
  };

  // Initialize chart
  useEffect(() => {
    fetchData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Draw chart when data changes
  useEffect(() => {
    drawChart();
  }, [ohlcData, signals, currentPrice]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = height;
      drawChart();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  if (error) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
          <div className="text-red-400">Error: {error}</div>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 border-b border-slate-600">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-slate-300">
            Interactive chart showing our trading algorithm's buy/sell signals with real market data
          </p>
        </div>
        
        {/* Status indicators */}
        <div className="flex justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-slate-300">
              {connectionStatus === 'connected' ? 'Live Data' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Error'}
            </span>
          </div>
          
          {currentPrice && (
            <div className="text-slate-300">
              Bitcoin: <span className="text-green-400 font-bold">${currentPrice.toLocaleString()}</span>
            </div>
          )}
          
          <div className="text-slate-300">
            Signals: <span className="text-orange-400 font-bold">{signals.length}</span>
          </div>

          <div className="text-slate-300">
            OHLC Data: <span className="text-blue-400 font-bold">{ohlcData.length}</span>
          </div>

          <div className="text-slate-300 text-xs">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="p-4" ref={containerRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-slate-400">Loading chart data...</div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: `${height}px`, display: 'block' }}
            className="bg-slate-900 rounded-lg"
          />
        )}
      </div>

      {/* Legend */}
      <div className="px-6 pb-4">
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-green-400"></div>
            <span className="text-slate-300">Buy Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-red-400"></div>
            <span className="text-slate-300">Sell Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-yellow-400 border-dashed border border-yellow-400"></div>
            <span className="text-slate-300">Current Price</span>
          </div>
        </div>
      </div>
    </div>
  );
}