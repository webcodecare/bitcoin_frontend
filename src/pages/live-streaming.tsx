import { useState } from 'react';
import { usePriceStreaming } from '@/hooks/usePriceStreaming';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LivePriceWidget from '@/components/widgets/LivePriceWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  Wifi,
  WifiOff,
  Zap,
  BarChart3,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export default function LiveStreaming() {
  const [selectedSymbols, setSelectedSymbols] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT']);
  const [throttleDelay, setThrottleDelay] = useState(100);

  const {
    prices,
    isConnected,
    connectionSource,
    error,
    connect,
    disconnect,
    getStatus
  } = usePriceStreaming({
    symbols: selectedSymbols,
    enableKlines: true,
    throttleDelay,
    autoConnect: true
  });

  const implementationStatus = [
    {
      feature: "Binance WebSocket for Kline Streaming",
      status: "implemented",
      description: "Direct WebSocket connection to Binance for real-time kline and ticker data",
      component: "priceStreamingService.connectBinanceWebSocket()"
    },
    {
      feature: "Fallback SSE Client Using CoinCap",
      status: "implemented", 
      description: "Server-Sent Events fallback using CoinCap API for resilience",
      component: "priceStreamingService.connectCoinCapSSE()"
    },
    {
      feature: "Throttled Chart Update Logic",
      status: "implemented",
      description: "Sub-second price feed throttling with configurable delay (50ms-1s)",
      component: "throttledEmit() with 100ms default"
    },
    {
      feature: "WebSocket → SSE Proxy via Edge Function",
      status: "implemented",
      description: "Optional server-side proxy converting WebSocket to SSE",
      component: "/api/stream/binance-proxy endpoint"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return 'text-green-600 border-green-600';
      case 'partial':
        return 'text-yellow-600 border-yellow-600';
      default:
        return 'text-red-600 border-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        <div className="lg:ml-64 flex-1">
          <Header />
          
          <div className="p-4 lg:p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold">Live Price Streaming System</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Connected via {connectionSource}
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" />
                      Disconnected
                    </>
                  )}
                </Badge>
              </div>
            </div>

            {/* Implementation Status */}
            <Card>
              <CardHeader>
                <CardTitle>Client Requirements Implementation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {implementationStatus.map((item, index) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <div className="font-medium">{item.feature}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Component: {item.component}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Streaming Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="binance">Binance WebSocket</TabsTrigger>
                <TabsTrigger value="fallback">CoinCap Fallback</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Primary Streaming Widget */}
                  <LivePriceWidget
                    symbols={selectedSymbols.slice(0, 3)}
                    showKlines={true}
                    showConnectionStatus={true}
                  />

                  {/* Compact Price Display */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Pairs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LivePriceWidget
                        symbols={selectedSymbols.slice(3)}
                        compact={true}
                        showConnectionStatus={false}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* System Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Streaming Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-500">
                          {Object.keys(prices).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Streams</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-500">
                          {throttleDelay}ms
                        </div>
                        <div className="text-sm text-muted-foreground">Update Throttle</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-500">
                          {connectionSource === 'binance' ? 'Primary' : 'Fallback'}
                        </div>
                        <div className="text-sm text-muted-foreground">Data Source</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-500">
                          {isConnected ? 'Online' : 'Offline'}
                        </div>
                        <div className="text-sm text-muted-foreground">Connection Status</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="binance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Binance WebSocket Integration</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Primary data source using Binance's real-time WebSocket streams
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-2">Connection Details</div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Endpoint: wss://stream.binance.com:9443</div>
                            <div>Streams: kline_1m + ticker</div>
                            <div>Symbols: {selectedSymbols.join(', ')}</div>
                            <div>Status: {isConnected && connectionSource === 'binance' ? 'Connected' : 'Disconnected'}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">Features</div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>✓ Real-time kline data</div>
                            <div>✓ 24hr ticker statistics</div>
                            <div>✓ Sub-second updates</div>
                            <div>✓ Automatic reconnection</div>
                          </div>
                        </div>
                      </div>

                      {/* Test Connection */}
                      <div className="pt-4 border-t">
                        <Button
                          onClick={connectionSource === 'binance' ? disconnect : connect}
                          className="mr-2"
                        >
                          {connectionSource === 'binance' ? (
                            <>
                              <WifiOff className="h-4 w-4 mr-2" />
                              Disconnect
                            </>
                          ) : (
                            <>
                              <Wifi className="h-4 w-4 mr-2" />
                              Connect to Binance
                            </>
                          )}
                        </Button>
                        
                        {error && (
                          <div className="mt-2 text-sm text-red-600">
                            Error: {error.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fallback" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>CoinCap SSE Fallback</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Resilient fallback using Server-Sent Events with CoinCap API
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-2">Fallback Details</div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Endpoint: /api/stream/coincap</div>
                            <div>Protocol: Server-Sent Events</div>
                            <div>Update Rate: 5 seconds</div>
                            <div>Status: {connectionSource === 'coincap' ? 'Active' : 'Standby'}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">Capabilities</div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>✓ Automatic failover</div>
                            <div>✓ Browser-native SSE</div>
                            <div>✓ CoinCap API integration</div>
                            <div>✓ Graceful degradation</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Fallback Mode:</strong> Automatically activated when Binance WebSocket fails. 
                          Provides continued price updates with reduced frequency for maximum reliability.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Streaming Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Throttle Settings */}
                    <div>
                      <div className="text-sm font-medium mb-2">Update Throttle Delay</div>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="50"
                          max="1000"
                          step="50"
                          value={throttleDelay}
                          onChange={(e) => setThrottleDelay(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm font-mono w-16">{throttleDelay}ms</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Controls minimum time between price updates to prevent excessive UI updates
                      </div>
                    </div>

                    {/* Symbol Selection */}
                    <div>
                      <div className="text-sm font-medium mb-2">Monitored Symbols</div>
                      <div className="flex flex-wrap gap-2">
                        {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT'].map(symbol => (
                          <Badge
                            key={symbol}
                            variant={selectedSymbols.includes(symbol) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (selectedSymbols.includes(symbol)) {
                                setSelectedSymbols(prev => prev.filter(s => s !== symbol));
                              } else {
                                setSelectedSymbols(prev => [...prev, symbol]);
                              }
                            }}
                          >
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Connection Test */}
                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Connection Testing</div>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" onClick={connect}>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Test Binance Connection
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open('/api/stream/coincap', '_blank')}>
                          <Zap className="h-3 w-3 mr-1" />
                          Test CoinCap SSE
                        </Button>
                      </div>
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