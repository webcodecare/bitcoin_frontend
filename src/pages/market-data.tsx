import Navigation from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MarketWidget from "@/components/widgets/MarketWidget";
import TradingViewChart from "@/components/charts/TradingViewChart";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Activity,
  Globe,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface MarketStat {
  symbol: string;
  price: string;
  change24h: string;
  changePercent: string;
  volume: string;
}

export default function MarketData() {
  // This would normally fetch real market data
  const { data: marketStats, isLoading } = useQuery({
    queryKey: ["/api/market/overview"],
    queryFn: async () => {
      // Mock data for demonstration - in real app this would fetch from your API
      return [
        {
          symbol: "BTCUSDT",
          price: "67,543.21",
          change24h: "+1,234.56",
          changePercent: "+1.86%",
          volume: "28.4B"
        },
        {
          symbol: "ETHUSDT", 
          price: "3,421.89",
          change24h: "-45.67",
          changePercent: "-1.32%",
          volume: "15.2B"
        },
        {
          symbol: "ADAUSDT",
          price: "0.4567",
          change24h: "+0.0123",
          changePercent: "+2.77%",
          volume: "892M"
        },
        {
          symbol: "SOLUSDT",
          price: "98.34",
          change24h: "+2.45",
          changePercent: "+2.55%",
          volume: "1.8B"
        }
      ] as MarketStat[];
    },
  });

  const topCoins = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", 
    "SOLUSDT", "XRPUSDT", "DOTUSDT", "MATICUSDT"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-background to-muted/20">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Globe className="h-8 w-8 text-primary mr-2" />
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Live Market Data
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Cryptocurrency <span className="crypto-gradient bg-clip-text text-transparent">
                Market Overview
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Real-time prices, market trends, and comprehensive analysis for major cryptocurrencies
            </p>
          </div>

          {/* Market Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              marketStats?.map((stat) => {
                const isPositive = stat.changePercent.startsWith('+');
                return (
                  <Card key={stat.symbol} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-mono font-semibold text-lg">{stat.symbol}</div>
                        {isPositive ? (
                          <TrendingUp className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div className="text-2xl font-bold mb-2">${stat.price}</div>
                      <div className={`text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stat.change24h} ({stat.changePercent})
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Vol: ${stat.volume}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Main Chart */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <Card className="mb-12">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Bitcoin Price Chart
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Full Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TradingViewChart 
                symbol="BTCUSDT" 
                height={500}
                showSignals={false}
              />
            </CardContent>
          </Card>

          {/* Market Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Market Movers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCoins.slice(0, 4).map((symbol) => (
                    <div key={symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="font-mono font-semibold">{symbol}</div>
                      <div className="text-right">
                        <div className="font-semibold">Loading...</div>
                        <div className="text-sm text-muted-foreground">24h change</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Volume Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCoins.slice(4, 8).map((symbol) => (
                    <div key={symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="font-mono font-semibold">{symbol}</div>
                      <div className="text-right">
                        <div className="font-semibold">Loading...</div>
                        <div className="text-sm text-muted-foreground">24h volume</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading View Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MarketWidget symbol="BTCUSDT" name="Bitcoin" />
            <Card>
              <CardHeader>
                <CardTitle>Economic Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Economic Events</h3>
                  <p className="text-muted-foreground mb-4">
                    Stay updated with important market events
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">
                      View in Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-4">Get Advanced Market Analysis</h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Access real-time trading signals, advanced charts, and professional analytics tools
                </p>
                <div className="flex justify-center space-x-4">
                  <Button asChild size="lg" className="crypto-gradient text-white">
                    <Link href="/auth">
                      Start Trading
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/pricing">
                      View Plans
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}