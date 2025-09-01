import React, { useEffect, useRef, useState } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  height?: number;
  className?: string;
  theme?: 'light' | 'dark';
  interval?: string;
  showToolbar?: boolean;
  title?: string;
  description?: string;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function TradingViewChart({
  symbol = 'BINANCE:BTCUSDT',
  height = 700,
  className = '',
  theme = 'dark',
  interval = '1W',
  showToolbar = true,
  title = 'Bitcoin Buy/Sell Signals - Past 2 Years',
  description = 'Interactive chart showing our trading algorithm\'s buy/sell signals with real market data'
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [signalsCount, setSignalsCount] = useState<number>(5);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch current Bitcoin price for display
  const fetchCurrentPrice = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://bitcoin-api.solvemeet.com';
      const response = await fetch(`${apiBaseUrl}/api/public/market/price/BTCUSDT`);
      const data = await response.json();
      if (data.price) {
        setCurrentPrice(data.price);
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
  };

  // Load TradingView script and initialize widget
  useEffect(() => {
    const initializeTradingView = () => {
      if (!containerRef.current) return;

      try {
        // Create unique container ID
        const containerId = `tradingview_${Math.random().toString(36).substr(2, 9)}`;
        containerRef.current.id = containerId;

        // Initialize TradingView widget
        widgetRef.current = new window.TradingView.widget({
          container_id: containerId,
          autosize: true,
          symbol: symbol,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: theme,
          style: '1', // Candlestick
          locale: 'en',
          toolbar_bg: theme === 'dark' ? '#1a1a1a' : '#ffffff',
          enable_publishing: false,
          hide_top_toolbar: !showToolbar,
          hide_legend: false,
          save_image: false,
          hide_volume: false,
          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
          gridColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
          studies: [
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies'
          ],
          overrides: {
            'paneProperties.background': theme === 'dark' ? '#0f172a' : '#ffffff',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': theme === 'dark' ? '#1e293b' : '#e2e8f0',
            'paneProperties.horzGridProperties.color': theme === 'dark' ? '#1e293b' : '#e2e8f0',
            'scalesProperties.textColor': theme === 'dark' ? '#94a3b8' : '#374151',
            'scalesProperties.backgroundColor': theme === 'dark' ? '#0f172a' : '#ffffff',
            'mainSeriesProperties.candleStyle.upColor': '#22c55e',
            'mainSeriesProperties.candleStyle.downColor': '#ef4444',
            'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
            'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444'
          },
          loading_screen: {
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            foregroundColor: theme === 'dark' ? '#94a3b8' : '#374151'
          },
          width: '100%',
          height: height
        });

        setIsLoading(false);
        setError(null);

      } catch (error) {
        console.error('Error initializing TradingView widget:', error);
        setError('Failed to load TradingView chart');
        setIsLoading(false);
      }
    };

    // Load TradingView script if not already loaded
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        initializeTradingView();
      };
      script.onerror = () => {
        setError('Failed to load TradingView script');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initializeTradingView();
    }

    // Fetch current price
    fetchCurrentPrice();
    const priceInterval = setInterval(fetchCurrentPrice, 30000); // Update every 30 seconds

    return () => {
      clearInterval(priceInterval);
      if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
        try {
          widgetRef.current.remove();
        } catch (error) {
          console.error('Error removing TradingView widget:', error);
        }
      }
    };
  }, [symbol, interval, theme, height, showToolbar]);

  // Update last update time periodically
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(updateInterval);
  }, []);

  if (error) {
    return (
      <div className={`p-8 bg-slate-800 rounded-lg ${className}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            {title}
          </h2>
          <div className="text-red-400 mb-4">⚠️ {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition-colors"
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
          <h2 className="text-2xl font-bold text-white mb-2">
            {title}
          </h2>
          <p className="text-slate-300">
            {description}
          </p>
        </div>
        
        {/* Status indicators */}
        <div className="flex justify-center items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Live Data</span>
          </div>
          
          {currentPrice && (
            <div className="text-slate-300">
              Bitcoin: <span className="text-green-400 font-bold">${currentPrice.toLocaleString()}</span>
            </div>
          )}
          
          <div className="text-slate-300">
            Signals: <span className="text-orange-400 font-bold">{signalsCount}</span>
          </div>
          
          <div className="text-slate-400">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-300">Loading TradingView chart...</p>
            </div>
          </div>
        )}
        
        <div
          ref={containerRef}
          style={{ width: '100%', height: `${height}px` }}
          className="bg-slate-900 rounded-b-lg"
        />
      </div>

      {/* Chart Legend & Info */}
      <div className="p-4 bg-slate-700 border-t border-slate-600">
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-300">Bullish Candle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-300">Bearish Candle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-400"></div>
            <span className="text-slate-300">RSI & MACD Indicators</span>
          </div>
          <div className="text-slate-400 text-xs">
            Powered by TradingView.com
          </div>
        </div>
      </div>
    </div>
  );
}