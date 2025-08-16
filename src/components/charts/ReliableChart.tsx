import React, { useEffect, useRef, useState } from 'react';
import { buildApiUrl } from '@/lib/config';

interface ReliableChartProps {
  height?: number;
  className?: string;
  title?: string;
}

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

export default function ReliableChart({ 
  height = 600, 
  className = '',
  title = 'Weekly Buy/Sell Signals - Past 2 Years'
}: ReliableChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>([]);
  const [signals, setSignals] = useState<AlertSignal[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load chart data
  const loadChartData = async () => {
    try {
      setError(null);
      console.log('Loading chart data...');

      const [ohlcResponse, signalsResponse, priceResponse] = await Promise.all([
        fetch('/api/public/ohlc?symbol=BTCUSDT&interval=1w&limit=104').then(r => r.json()),
        fetch('/api/public/signals/alerts?ticker=BTCUSDT&timeframe=1W').then(r => r.json()),
        fetch('/api/public/market/price/BTCUSDT').then(r => r.json())
      ]);

      console.log('Data loaded:', { 
        ohlc: ohlcResponse?.data?.length || 0, 
        signals: signalsResponse?.length || 0,
        price: priceResponse?.price 
      });

      if (ohlcResponse?.data?.length) {
        setOhlcData(ohlcResponse.data);
      }

      if (signalsResponse?.length) {
        setSignals(signalsResponse);
      }

      if (priceResponse?.price) {
        setCurrentPrice(priceResponse.price);
      }

      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setError('Failed to load chart data');
      setIsLoading(false);
    }
  };

  // Draw the chart on canvas
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || ohlcData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const { width, height } = rect;
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Get price range
    const prices = ohlcData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid and labels
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (price levels)
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartHeight;
      const price = maxPrice - (i / 5) * priceRange;
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
      
      // Price labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, padding - 10, y + 4);
    }

    // Draw candlesticks
    const candleWidth = chartWidth / ohlcData.length * 0.7;
    
    ohlcData.forEach((candle, index) => {
      const x = padding + (index / ohlcData.length) * chartWidth;
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;
      
      const isGreen = candle.close > candle.open;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      ctx.fillRect(x - candleWidth/2, bodyY, candleWidth, bodyHeight || 1);
    });

    // Draw signals
    signals.forEach(signal => {
      const signalTime = new Date(signal.timestamp);
      const candleIndex = ohlcData.findIndex(candle => {
        const candleTime = new Date(candle.time);
        return Math.abs(candleTime.getTime() - signalTime.getTime()) < 7 * 24 * 60 * 60 * 1000; // Within a week
      });
      
      if (candleIndex >= 0) {
        const x = padding + (candleIndex / ohlcData.length) * chartWidth;
        const y = padding + ((maxPrice - signal.price) / priceRange) * chartHeight;
        
        // Draw signal marker
        ctx.fillStyle = signal.signalType === 'buy' ? '#10b981' : '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw signal border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw signal text
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(signal.signalType.toUpperCase(), x, y + 3);
      }
    });

    // Draw time labels (show a few dates)
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    const showDates = [0, Math.floor(ohlcData.length / 4), Math.floor(ohlcData.length / 2), Math.floor(3 * ohlcData.length / 4), ohlcData.length - 1];
    showDates.forEach(index => {
      if (index < ohlcData.length) {
        const x = padding + (index / ohlcData.length) * chartWidth;
        const date = new Date(ohlcData[index].time);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        ctx.fillText(dateStr, x, height - 20);
      }
    });
  };

  // Load data on mount and set up interval for updates
  useEffect(() => {
    loadChartData();
    const interval = setInterval(loadChartData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Redraw chart when data changes
  useEffect(() => {
    if (ohlcData.length > 0) {
      drawChart();
    }
  }, [ohlcData, signals]);

  // Get latest OHLC data for display
  const latestCandle = ohlcData[ohlcData.length - 1];

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">Interactive BTCUSD weekly chart with real buy/sell signals from our algorithm</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">Live</span>
          </div>
          <div className="text-sm text-gray-600">
            Current: {currentPrice ? `$${currentPrice.toLocaleString()}` : 'Loading...'}
          </div>
          <div className="text-xs text-gray-500">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading chart data...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <button 
                onClick={loadChartData}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded"
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </div>

      {/* Stats */}
      {latestCandle && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-gray-500 mb-1">Latest Weekly Candle</div>
            <div className="space-y-1">
              <div className="text-xs">
                <span className="text-gray-600">Open</span>
                <div className="font-medium">${latestCandle.open.toLocaleString()}</div>
              </div>
              <div className="text-xs">
                <span className="text-gray-600">High</span>
                <div className="font-medium">${latestCandle.high.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">&nbsp;</div>
            <div className="space-y-1">
              <div className="text-xs">
                <span className="text-gray-600">Low</span>
                <div className="font-medium">${latestCandle.low.toLocaleString()}</div>
              </div>
              <div className="text-xs">
                <span className="text-gray-600">Close</span>
                <div className="font-medium">${latestCandle.close.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="text-xs text-gray-500 mb-1">Data Range</div>
            <div className="text-xs">
              <span className="text-gray-600">From:</span> {new Date(ohlcData[0]?.time).toLocaleDateString()}
            </div>
            <div className="text-xs">
              <span className="text-gray-600">To:</span> {new Date(latestCandle.time).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Signal Summary */}
      {signals.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Live Data</span>
            <div className="flex items-center gap-4 text-sm">
              <span>Bitcoin: {currentPrice ? `$${currentPrice.toLocaleString()}` : 'Loading...'}</span>
              <span>Signals: {signals.length}</span>
              <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}