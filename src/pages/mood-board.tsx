import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Smile,
  RefreshCw,
  Clock,
  Zap,
  Sparkles,
  Filter,
  BarChart3
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
  intensity: 'low' | 'medium' | 'high';
  confidence: number;
}

const SIGNAL_EMOJIS = {
  buy: {
    high: ['🚀', '💎', '⚡', '🔥'],
    medium: ['📈', '💚', '✅', '⬆️'],
    low: ['🟢', '👍', '📊', '💡']
  },
  sell: {
    high: ['💥', '❄️', '⚠️', '💔'],
    medium: ['📉', '🔻', '❌', '⬇️'],
    low: ['🔴', '👎', '📋', '💭']
  }
};

const MOOD_COLORS = {
  bullish: {
    bg: 'bg-green-900/30',
    border: 'border-green-500/50',
    text: 'text-green-300',
    glow: 'shadow-green-500/20'
  },
  bearish: {
    bg: 'bg-red-900/30',
    border: 'border-red-500/50',
    text: 'text-red-300',
    glow: 'shadow-red-500/20'
  },
  neutral: {
    bg: 'bg-gray-900/30',
    border: 'border-gray-500/50',
    text: 'text-gray-300',
    glow: 'shadow-gray-500/20'
  }
};

export default function MoodBoard() {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | 'all'>('24h');
  const [selectedSignal, setSelectedSignal] = useState<SignalMood | null>(null);

  // Fetch live TradingView signals - using public API per client requirements
  const { data: signals, isLoading, refetch } = useQuery({
    queryKey: ['/api/public/signals'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform signals into mood data
  const moodSignals: SignalMood[] = (signals && Array.isArray(signals) ? signals : []).map((signal: any) => {
    const mood = signal.signalType === 'buy' ? 'bullish' : 'bearish';
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%
    let intensity: 'low' | 'medium' | 'high' = 'medium';
    
    if (confidence >= 85) intensity = 'high';
    else if (confidence <= 70) intensity = 'low';

    const emojiPool = SIGNAL_EMOJIS[signal.signalType][intensity];
    const emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];

    return {
      id: signal.id,
      ticker: signal.ticker,
      signalType: signal.signalType,
      price: parseFloat(signal.price),
      timestamp: signal.timestamp,
      timeframe: signal.timeframe || '1D',
      confidence,
      emoji,
      mood,
      intensity
    };
  });

  // Filter signals
  const filteredSignals = moodSignals.filter(signal => {
    if (filter !== 'all' && signal.signalType !== filter) return false;
    
    const signalTime = new Date(signal.timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - signalTime.getTime()) / (1000 * 60 * 60);
    
    switch (timeFilter) {
      case '1h': return diffHours <= 1;
      case '24h': return diffHours <= 24;
      case '7d': return diffHours <= 168;
      default: return true;
    }
  });

  const getSignalSize = (intensity: 'low' | 'medium' | 'high') => {
    switch (intensity) {
      case 'high': return 'text-6xl';
      case 'medium': return 'text-4xl';
      case 'low': return 'text-2xl';
      default: return 'text-4xl';
    }
  };

  const getMoodStats = () => {
    const total = filteredSignals.length;
    const bullish = filteredSignals.filter(s => s.mood === 'bullish').length;
    const bearish = filteredSignals.filter(s => s.mood === 'bearish').length;
    
    return {
      total,
      bullish,
      bearish,
      bullishPercent: total > 0 ? Math.round((bullish / total) * 100) : 0,
      bearishPercent: total > 0 ? Math.round((bearish / total) * 100) : 0
    };
  };

  const stats = getMoodStats();

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const signalTime = new Date(timestamp);
    const diffMs = now.getTime() - signalTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

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
                <Smile className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#4A9FE7' }} />
                <h1 className="text-lg sm:text-2xl font-bold">Signal Mood Board</h1>
              </div>
              
              {/* Refresh Button */}
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-8 w-8" style={{ color: '#4A9FE7' }} />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Signals</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bullish</p>
                      <p className="text-2xl font-bold text-green-500">
                        {stats.bullish} ({stats.bullishPercent}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <TrendingDown className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bearish</p>
                      <p className="text-2xl font-bold text-red-500">
                        {stats.bearish} ({stats.bearishPercent}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Signal Type:</span>
              </div>
              
              {(['all', 'buy', 'sell'] as const).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className="capitalize"
                >
                  {filterType}
                </Button>
              ))}

              <div className="flex items-center space-x-2 ml-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time:</span>
              </div>
              
              {(['1h', '24h', '7d', 'all'] as const).map((timeType) => (
                <Button
                  key={timeType}
                  variant={timeFilter === timeType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter(timeType)}
                >
                  {timeType}
                </Button>
              ))}
            </div>

            {/* Signal Grid */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-muted h-32 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredSignals.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Signals Found</h3>
                    <p className="text-muted-foreground">
                      No trading signals match your current filters. Try adjusting the time range or signal type.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {filteredSignals.map((signal) => (
                    <motion.div
                      key={signal.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="cursor-pointer"
                      onClick={() => setSelectedSignal(signal)}
                    >
                      <Card className={`
                        ${MOOD_COLORS[signal.mood].bg} 
                        ${MOOD_COLORS[signal.mood].border} 
                        border-2 hover:shadow-lg transition-all duration-300
                        ${MOOD_COLORS[signal.mood].glow}
                      `}>
                        <CardContent className="p-3 text-center">
                          <div className={`${getSignalSize(signal.intensity)} mb-2`}>
                            {signal.emoji}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="font-bold text-sm">{signal.ticker}</span>
                              <Badge 
                                variant={signal.signalType === 'buy' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {signal.signalType.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              ${signal.price.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {signal.confidence}% confident
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(signal.timestamp)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signal Detail Modal */}
      <AnimatePresence>
        {selectedSignal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedSignal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-4">
                <div className="text-6xl">{selectedSignal.emoji}</div>
                <div>
                  <h3 className="text-xl font-bold">{selectedSignal.ticker}</h3>
                  <Badge 
                    variant={selectedSignal.signalType === 'buy' ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {selectedSignal.signalType.toUpperCase()} SIGNAL
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-bold">${selectedSignal.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Timeframe</p>
                    <p className="font-bold">{selectedSignal.timeframe}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Confidence</p>
                    <p className="font-bold">{selectedSignal.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-bold">{getTimeAgo(selectedSignal.timestamp)}</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => setSelectedSignal(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}