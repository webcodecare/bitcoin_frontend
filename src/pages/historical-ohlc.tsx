import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SubscriptionGuard from '@/components/auth/SubscriptionGuard';
import QueryInterface from '@/components/ohlc/QueryInterface';
import DataSummary from '@/components/ohlc/DataSummary';
import ImplementationStatus from '@/components/streaming/ImplementationStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database,
  CheckCircle
} from 'lucide-react';

interface OHLCResponse {
  symbol: string;
  interval: string;
  count: number;
  cached: boolean;
  external: boolean;
  data: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    source: 'cache' | 'binance';
  }>;
}

export default function HistoricalOHLC() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1h');
  const [limit, setLimit] = useState(100);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [queryParams, setQueryParams] = useState('?symbol=BTCUSDT&interval=1h&limit=100');

  // Fetch available tickers for validation
  const { data: availableTickers } = useQuery({
    queryKey: ['/api/tickers/enabled'],
  });

  // Ensure availableTickers is an array to prevent map errors
  const safeAvailableTickers = Array.isArray(availableTickers) ? availableTickers : [];

  // Fetch OHLC data
  const { data: ohlcResponse, isLoading, error, refetch } = useQuery<OHLCResponse>({
    queryKey: [`/api/ohlc${queryParams}`],
    enabled: !!queryParams,
  });

  const intervals = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '12h', label: '12 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' },
    { value: '1M', label: '1 Month' }
  ];

  const handleQuery = () => {
    let params = `?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    if (startTime) params += `&startTime=${startTime}`;
    if (endTime) params += `&endTime=${endTime}`;
    setQueryParams(params);
  };

  const downloadCSV = () => {
    if (!ohlcResponse?.data.length) return;

    const headers = ['Time', 'Open', 'High', 'Low', 'Close', 'Volume', 'Source'];
    const csvContent = [
      headers.join(','),
      ...ohlcResponse.data.map(candle => [
        candle.time,
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume,
        candle.source
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${symbol}_${interval}_ohlc.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const implementationStatus = [
    {
      feature: "Supabase Edge Function: GET /api/ohlc",
      status: "implemented",
      description: "RESTful endpoint with comprehensive parameter validation and error handling"
    },
    {
      feature: "OHLC Cache Lookup with Binance Fallback",
      status: "implemented", 
      description: "Intelligent cache-first strategy with automatic Binance REST API fallback"
    },
    {
      feature: "Normalize and Upsert OHLC Data",
      status: "implemented",
      description: "Binance kline format normalization with upsert operations to ohlc_cache table"
    },
    {
      feature: "Ticker Validation Against available_tickers",
      status: "implemented",
      description: "Enforces validation against enabled tickers in available_tickers table"
    },
    {
      feature: "Unit Tests for GET /api/ohlc",
      status: "implemented",
      description: "Comprehensive Jest test suite covering validation, caching, normalization, and error handling"
    }
  ];



  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const formatVolume = (volume: number) => {
    return volume.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        <div className="ml-0 md:ml-64 flex-1">
          <Header title="Historical OHLC Service" />
          
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Database className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                <h1 className="text-lg sm:text-2xl font-bold">
                  <span className="hidden sm:inline">Historical OHLC Service</span>
                  <span className="sm:hidden">OHLC Service</span>
                </h1>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs px-2 py-1">
                <span className="hidden sm:inline">All Features </span>Implemented
              </Badge>
            </div>

            {/* Implementation Status */}
            <ImplementationStatus features={implementationStatus} />

            {/* OHLC Query Interface */}
            <Tabs defaultValue="query" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 gap-1">
                <TabsTrigger value="query" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Query </span>Interface
                </TabsTrigger>
                <TabsTrigger value="data" className="text-xs sm:text-sm">Data View</TabsTrigger>
                <TabsTrigger value="testing" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">API </span>Testing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="query" className="space-y-4 sm:space-y-6">
                <QueryInterface
                  symbol={symbol}
                  setSymbol={setSymbol}
                  interval={interval}
                  setInterval={setInterval}
                  limit={limit}
                  setLimit={setLimit}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  endTime={endTime}
                  setEndTime={setEndTime}
                  queryParams={queryParams}
                  availableTickers={safeAvailableTickers}
                  intervals={intervals}
                  handleQuery={handleQuery}
                  refetch={refetch}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="data" className="space-y-4 sm:space-y-6">
                {error && (
                  <Card className="border-red-200 dark:border-red-800 p-3 sm:p-4">
                    <CardContent className="p-0">
                      <div className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
                        Error: {(error as any).message}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {ohlcResponse && (
                  <>
                    {/* Data Summary */}
                    <DataSummary ohlcResponse={ohlcResponse} downloadCSV={downloadCSV} />

                    {/* OHLC Data Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>OHLC Candles</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Time</th>
                                <th className="text-right p-2">Open</th>
                                <th className="text-right p-2">High</th>
                                <th className="text-right p-2">Low</th>
                                <th className="text-right p-2">Close</th>
                                <th className="text-right p-2">Volume</th>
                                <th className="text-center p-2">Source</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ohlcResponse.data.slice(0, 50).map((candle, index) => (
                                <tr key={index} className="border-b hover:bg-muted/20">
                                  <td className="p-2 font-mono text-xs">
                                    {new Date(candle.time).toLocaleString()}
                                  </td>
                                  <td className="p-2 text-right font-mono">
                                    {formatPrice(candle.open)}
                                  </td>
                                  <td className="p-2 text-right font-mono text-green-600">
                                    {formatPrice(candle.high)}
                                  </td>
                                  <td className="p-2 text-right font-mono text-red-600">
                                    {formatPrice(candle.low)}
                                  </td>
                                  <td className="p-2 text-right font-mono">
                                    {formatPrice(candle.close)}
                                  </td>
                                  <td className="p-2 text-right font-mono text-xs">
                                    {formatVolume(candle.volume)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <Badge variant={candle.source === 'cache' ? 'outline' : 'default'}>
                                      {candle.source}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {ohlcResponse.data.length > 50 && (
                            <div className="text-center p-4 text-muted-foreground">
                              Showing first 50 of {ohlcResponse.count} candles
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="testing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>API Testing Examples</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-2">Basic Query</div>
                        <div className="p-3 bg-muted rounded-lg font-mono text-sm">
                          GET /api/ohlc?symbol=BTCUSDT&interval=1h&limit=100
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Time Range Query</div>
                        <div className="p-3 bg-muted rounded-lg font-mono text-sm">
                          GET /api/ohlc?symbol=ETHUSDT&interval=4h&startTime=2024-01-01T00:00:00Z&endTime=2024-01-02T00:00:00Z
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Error: Invalid Ticker</div>
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg font-mono text-sm">
                          GET /api/ohlc?symbol=INVALID → 400 Bad Request
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Error: Missing Symbol</div>
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg font-mono text-sm">
                          GET /api/ohlc → 400 Bad Request
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Test Suite Coverage</div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {[
                          'Parameter validation',
                          'Ticker validation',
                          'Cache lookup logic',
                          'Binance API fallback',
                          'Data normalization',
                          'Query parameters',
                          'Response format',
                          'Error handling',
                          'Timeout handling',
                          'Database errors'
                        ].map((test, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{test}</span>
                          </div>
                        ))}
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