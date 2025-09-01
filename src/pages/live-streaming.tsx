import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { Sidebar } from "../components/layout/Sidebar";
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Server, 
  Users, 
  Zap,
  PlayCircle,
  PauseCircle
} from "lucide-react";

interface StreamingStatus {
  websocket: {
    connected: number;
    status: 'active' | 'idle';
  };
  tickers: {
    enabled: number;
    symbols: string[];
  };
  signals: {
    recent: number;
    lastSignal: string | null;
  };
  server: {
    uptime: number;
    memory: any;
  };
}

interface LiveSignal {
  id: string;
  symbol: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  source: string;
  note?: string;
}

export default function LiveStreamingPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Fetch streaming status
  const { data: streamingStatus, isLoading, refetch } = useQuery<StreamingStatus>({
    queryKey: ['/api/admin/live-streaming'],
    queryFn: () => apiRequest('/api/admin/live-streaming'),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // WebSocket connection
  useEffect(() => {
    if (isStreaming) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isStreaming]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionAttempts(0);
        toast({
          title: "Connected",
          description: "Live data stream connected",
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          
          if (message.type === 'signal') {
            const signal = message.data as LiveSignal;
            setLiveSignals(prev => [signal, ...prev.slice(0, 49)]); // Keep last 50 signals
            
            toast({
              title: `${signal.signalType.toUpperCase()} Signal`,
              description: `${signal.ticker || signal.symbol} at $${Number(signal.price).toLocaleString()}`,
              variant: signal.signalType === 'buy' ? 'default' : 'destructive',
            });
          } else if (message.type === 'connection') {
            console.log('WebSocket connection confirmed:', message.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        if (isStreaming && connectionAttempts < 5) {
          // Auto-reconnect with exponential backoff
          setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
            connectWebSocket();
          }, Math.pow(2, connectionAttempts) * 1000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to live data stream",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to establish WebSocket connection",
        variant: "destructive",
      });
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  const sendTestSignal = async () => {
    try {
      await apiRequest('/api/admin/live-streaming/test', {
        method: 'POST',
        body: JSON.stringify({
          symbol: 'BTCUSDT',
          signalType: Math.random() > 0.5 ? 'buy' : 'sell'
        })
      });
      
      toast({
        title: "Test Signal Sent",
        description: "Test signal broadcasted to all connected clients",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test signal",
        variant: "destructive",
      });
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex">
        <Sidebar className="flex-none w-64 hidden lg:block" />
        <div className="flex-1 min-h-screen lg:ml-64">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Live Data Streaming
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time market data and signal broadcasting
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button
              onClick={toggleStreaming}
              variant={isStreaming ? "destructive" : "default"}
              className="flex-1 sm:flex-none"
            >
              {isStreaming ? (
                <>
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Stop Stream
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Stream
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Connection Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                WebSocket
              </CardTitle>
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">
                <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {streamingStatus?.websocket.connected || 0} clients
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Tickers
              </CardTitle>
              <Radio className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {streamingStatus?.tickers.enabled || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Enabled symbols</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Recent Signals
              </CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {streamingStatus?.signals.recent || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">
                Server Status
              </CardTitle>
              <Server className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {streamingStatus ? formatUptime(streamingStatus.server.uptime) : "N/A"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {streamingStatus ? formatMemory(streamingStatus.server.memory.heapUsed) : "N/A"} used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stream Controls */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stream Controls</span>
              <Badge variant={streamingStatus?.websocket.status === 'active' ? "default" : "secondary"}>
                {streamingStatus?.websocket.status === 'active' ? "Active" : "Idle"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium mb-2">Enabled Symbols</h3>
                <div className="flex flex-wrap gap-2">
                  {streamingStatus?.tickers.symbols.map((symbol) => (
                    <Badge key={symbol} variant="outline" className="font-mono">
                      {symbol}
                    </Badge>
                  )) || <span className="text-gray-500 text-sm">No symbols enabled</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={sendTestSignal} variant="outline" size="sm">
                  Send Test Signal
                </Button>
                <p className="text-xs text-gray-500">
                  Last signal: {streamingStatus?.signals.lastSignal ? 
                    new Date(streamingStatus.signals.lastSignal).toLocaleTimeString() : 
                    "None"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Signals Feed */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live Signals Feed</span>
              <Badge variant="secondary">{liveSignals.length} signals</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {liveSignals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Radio className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No live signals received</p>
                <p className="text-sm mt-2">
                  {isConnected ? "Waiting for signals..." : "Connect to WebSocket to receive signals"}
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {/* Mobile View */}
                <div className="lg:hidden p-4 space-y-4">
                  {liveSignals.map((signal) => (
                    <Card key={signal.id} className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge variant="outline" className="font-mono text-sm">
                            {signal.symbol}
                          </Badge>
                          <Badge 
                            variant={signal.signalType === 'buy' ? "default" : "destructive"}
                            className="ml-2"
                          >
                            {signal.signalType === 'buy' ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {signal.signalType.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold">
                          ${signal.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{signal.source}</span>
                        <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {signal.note && (
                        <p className="text-xs text-gray-600 mt-2">{signal.note}</p>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Time</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Symbol</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Signal</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Price</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Source</th>
                        <th className="text-left p-4 font-medium text-gray-600 dark:text-gray-400">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveSignals.map((signal) => (
                        <tr key={signal.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="font-mono">
                              {signal.symbol}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant={signal.signalType === 'buy' ? "default" : "destructive"}
                            >
                              {signal.signalType === 'buy' ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {signal.signalType.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4 font-bold text-lg">
                            ${signal.price.toLocaleString()}
                          </td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                            {signal.source}
                          </td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                            {signal.note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  );
}