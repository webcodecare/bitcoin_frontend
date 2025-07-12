import { useState, useEffect } from 'react';
import { usePriceStreaming } from '@/hooks/usePriceStreaming';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LivePriceWidgetProps {
  symbols?: string[];
  showKlines?: boolean;
  showConnectionStatus?: boolean;
  compact?: boolean;
  className?: string;
}

export default function LivePriceWidget({
  symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
  showKlines = false,
  showConnectionStatus = true,
  compact = false,
  className
}: LivePriceWidgetProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  
  const {
    prices,
    klines,
    isConnected,
    connectionSource,
    error,
    connect,
    disconnect,
    getPrice,
    getPriceChange
  } = usePriceStreaming({
    symbols,
    enableKlines: showKlines,
    throttleDelay: 100,
    autoConnect: true
  });

  const formatPrice = (price: number) => {
    if (price > 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price > 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getConnectionStatusColor = () => {
    if (!isConnected) return 'text-red-500';
    return connectionSource === 'binance' ? 'text-green-500' : 'text-yellow-500';
  };

  const getConnectionSourceText = () => {
    if (!isConnected) return 'Disconnected';
    return connectionSource === 'binance' ? 'Binance WebSocket' : 
           connectionSource === 'coincap' ? 'CoinCap SSE (Fallback)' : 'Unknown';
  };

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {symbols.map(symbol => {
          const price = getPrice(symbol);
          const change = getPriceChange(symbol);
          
          return (
            <div key={symbol} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-medium">
                  {symbol.replace('USDT', '')}
                </span>
                {isConnected && (
                  <div className={cn("w-2 h-2 rounded-full", 
                    connectionSource === 'binance' ? 'bg-green-500' : 'bg-yellow-500'
                  )} />
                )}
              </div>
              
              <div className="text-right">
                <div className="font-mono text-sm">
                  ${price ? formatPrice(price.price) : '--'}
                </div>
                {change && (
                  <div className={cn("text-xs", 
                    change.isPositive ? 'text-green-400' : 'text-red-400'
                  )}>
                    {formatPercent(change.changePercent)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Live Price Streaming</span>
          </CardTitle>
          
          {showConnectionStatus && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getConnectionStatusColor()}>
                <div className="flex items-center space-x-1">
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span className="text-xs">{getConnectionSourceText()}</span>
                </div>
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={isConnected ? disconnect : connect}
                className="ml-2"
              >
                {isConnected ? (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reconnect
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Symbol Selector */}
        <div className="flex space-x-2 mb-4">
          {symbols.map(symbol => (
            <Button
              key={symbol}
              variant={selectedSymbol === symbol ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSymbol(symbol)}
              className="font-mono"
            >
              {symbol.replace('USDT', '')}
            </Button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-sm text-red-800 dark:text-red-200">
              Connection Error: {error.message}
            </div>
          </div>
        )}

        {/* Price Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {symbols.map(symbol => {
            const price = getPrice(symbol);
            const change = getPriceChange(symbol);
            
            return (
              <div key={symbol} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-medium">{symbol}</span>
                    {isConnected && (
                      <div className={cn("w-2 h-2 rounded-full animate-pulse", 
                        connectionSource === 'binance' ? 'bg-green-500' : 'bg-yellow-500'
                      )} />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {price?.timestamp && new Date(price.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="text-2xl font-mono font-bold mb-1">
                  ${price ? formatPrice(price.price) : '--'}
                </div>
                
                {change && (
                  <div className="flex items-center space-x-2">
                    <div className={cn("flex items-center", 
                      change.isPositive ? 'text-green-400' : 'text-red-400'
                    )}>
                      {change.isPositive ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {formatPercent(change.changePercent)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${change.change >= 0 ? '+' : ''}{change.change.toFixed(2)}
                    </div>
                  </div>
                )}
                
                {price && (
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                    <div>
                      High: ${price.high24h ? formatPrice(price.high24h) : '--'}
                    </div>
                    <div>
                      Low: ${price.low24h ? formatPrice(price.low24h) : '--'}
                    </div>
                    <div className="col-span-2">
                      Volume: ${price.volume24h ? price.volume24h.toLocaleString() : '--'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Klines Chart (if enabled) */}
        {showKlines && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Real-time Klines - {selectedSymbol}
              </h3>
              <Badge variant="outline">
                1m intervals
              </Badge>
            </div>
            
            <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
              {klines[selectedSymbol]?.length > 0 ? (
                <div className="text-sm text-muted-foreground">
                  {klines[selectedSymbol].length} klines received
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Waiting for kline data...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Streaming Statistics */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">
                {Object.keys(prices).length}
              </div>
              <div className="text-xs text-muted-foreground">Active Streams</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">
                {isConnected ? (
                  <div className="flex items-center justify-center">
                    <Zap className="h-4 w-4 mr-1" />
                    Live
                  </div>
                ) : (
                  'Offline'
                )}
              </div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">
                100ms
              </div>
              <div className="text-xs text-muted-foreground">Throttle</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}