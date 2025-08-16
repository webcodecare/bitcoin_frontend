import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Smile,
  RefreshCw
} from 'lucide-react';

interface SignalMood {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  timeframe: string;
  emoji: string;
  mood: 'bullish' | 'bearish';
}

const SIGNAL_EMOJIS = {
  buy: ['🚀', '📈', '💚', '⬆️', '✅'],
  sell: ['📉', '🔻', '❌', '⬇️', '🔴']
};

export default function MoodBoardSimple() {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  // Fetch live TradingView signals
  const { data: signals, isLoading } = useQuery({
    queryKey: ['/api/public/signals'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform signals into mood data
  const moodSignals: SignalMood[] = signals?.map((signal: any) => {
    const mood = signal.signalType === 'buy' ? 'bullish' : 'bearish';
    const emojiPool = SIGNAL_EMOJIS[signal.signalType];
    const emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];

    return {
      id: signal.id,
      ticker: signal.ticker,
      signalType: signal.signalType,
      price: parseFloat(signal.price),
      timestamp: signal.timestamp,
      timeframe: signal.timeframe || '1D',
      emoji,
      mood
    };
  }) || [];

  // Filter signals
  const filteredSignals = filter === 'all' 
    ? moodSignals 
    : moodSignals.filter(signal => signal.signalType === filter);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        
        <div className="ml-0 md:ml-64 flex-1">
          <Header />
          
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Smile className="h-5 w-5 sm:h-6 sm:w-6 text-[#4A90A4]" />
                <h1 className="text-lg sm:text-2xl font-bold">Signal Mood Board</h1>
              </div>
              
              {/* Filter Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs ${
                    filter === 'all' 
                      ? 'bg-[#4A90A4] text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('buy')}
                  className={`px-3 py-1 rounded-full text-xs ${
                    filter === 'buy' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setFilter('sell')}
                  className={`px-3 py-1 rounded-full text-xs ${
                    filter === 'sell' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Mood Signals Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-16 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSignals.map((signal) => (
                  <Card 
                    key={signal.id}
                    className={`border-2 transition-all hover:shadow-lg ${
                      signal.mood === 'bullish' 
                        ? 'border-green-200 hover:border-green-300' 
                        : 'border-red-200 hover:border-red-300'
                    }`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">{signal.emoji}</div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg">{signal.ticker}</span>
                        <Badge 
                          variant={signal.signalType === 'buy' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {signal.signalType.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-1">
                        ${signal.price.toLocaleString()}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{signal.timeframe}</span>
                        <span>{new Date(signal.timestamp).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredSignals.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Smile className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Signals Yet</h3>
                  <p className="text-muted-foreground">
                    TradingView signals will appear here when available
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}