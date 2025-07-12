import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  Filter,
  Calendar,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SignalMood {
  id: string;
  ticker: string;
  signalType: 'buy' | 'sell';
  price: number;
  timestamp: string;
  timeframe: string;
  confidence?: number;
  emoji: string;
  mood: 'bullish' | 'bearish' | 'neutral';
  intensity: 'low' | 'medium' | 'high';
  note?: string;
}

const SIGNAL_EMOJIS = {
  buy: {
    high: ['🚀', '🔥', '💎', '⚡', '🎯', '💰', '🌟', '⭐'],
    medium: ['📈', '✅', '🟢', '👍', '💚', '🔋', '🎉'],
    low: ['🔼', '➡️', '🟩', '📊', '💹', '🔀']
  },
  sell: {
    high: ['💥', '⚠️', '🔴', '📉', '💔', '🚨', '⛔', '🔻'],
    medium: ['👎', '🔽', '📊', '⬇️', '🟠', '⚡'],
    low: ['🔻', '📉', '🟡', '⚪', '📋', '🔄']
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
  const [signals, setSignals] = useState<SignalMood[]>([]);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | 'all'>('24h');
  const [selectedSignal, setSelectedSignal] = useState<SignalMood | null>(null);

  // Fetch signals from API
  const { data: signalData, refetch } = useQuery({
    queryKey: ['/api/signals'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket('ws://localhost:5000/ws');

  // Transform signals into mood data
  useEffect(() => {
    if (signalData) {
      const moodSignals = signalData.map((signal: any) => {
        const mood = signal.signalType === 'buy' ? 'bullish' : 'bearish';
        const confidence = signal.confidence || Math.floor(Math.random() * 40) + 60; // 60-100%
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
          intensity,
          note: signal.note
        };
      });

      setSignals(moodSignals);
    }
  }, [signalData]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        if (data.type === 'signal') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, refetch]);

  const getRandomEmoji = (signalType: 'buy' | 'sell', intensity: 'low' | 'medium' | 'high') => {
    const emojiPool = SIGNAL_EMOJIS[signalType][intensity];
    return emojiPool[Math.floor(Math.random() * emojiPool.length)];
  };

  const filteredSignals = signals.filter(signal => {
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

  const getSignalSize = (intensity: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Navigation />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Trading Signal Mood Board</h1>
              <p className="text-gray-400">Interactive visualization of market sentiment through trading signals</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Signals</p>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-900/20 border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-400">Bullish Signals</p>
                      <p className="text-2xl font-bold text-green-300">{stats.bullish}</p>
                      <p className="text-xs text-green-500">{stats.bullishPercent}% of total</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-900/20 border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-400">Bearish Signals</p>
                      <p className="text-2xl font-bold text-red-300">{stats.bearish}</p>
                      <p className="text-xs text-red-500">{stats.bearishPercent}% of total</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-900/20 border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-400">Mood Score</p>
                      <p className="text-2xl font-bold text-purple-300">
                        {stats.bullishPercent - stats.bearishPercent > 0 ? '+' : ''}{stats.bullishPercent - stats.bearishPercent}
                      </p>
                      <p className="text-xs text-purple-500">Market sentiment</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Signal Type:</span>
                <div className="flex gap-2">
                  {['all', 'buy', 'sell'].map((type) => (
                    <Button
                      key={type}
                      variant={filter === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(type as any)}
                      className={`capitalize ${
                        filter === type 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Time:</span>
                <div className="flex gap-2">
                  {['1h', '24h', '7d', 'all'].map((time) => (
                    <Button
                      key={time}
                      variant={timeFilter === time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeFilter(time as any)}
                      className={`${
                        timeFilter === time 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-auto bg-gray-800 hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Mood Board Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              <AnimatePresence>
                {filteredSignals.map((signal, index) => {
                  const colorScheme = MOOD_COLORS[signal.mood];
                  
                  return (
                    <motion.div
                      key={signal.id}
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                      transition={{ 
                        delay: index * 0.05,
                        duration: 0.3,
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                      whileHover={{ 
                        scale: 1.1, 
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.3 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        relative p-4 rounded-xl border-2 cursor-pointer
                        ${colorScheme.bg} ${colorScheme.border} ${colorScheme.glow}
                        shadow-lg hover:shadow-xl transition-all duration-300
                        group
                      `}
                      onClick={() => setSelectedSignal(signal)}
                    >
                      {/* Emoji */}
                      <div className={`text-center ${getSignalSize(signal.intensity)} mb-2 group-hover:animate-bounce`}>
                        {signal.emoji}
                      </div>
                      
                      {/* Ticker */}
                      <div className="text-xs font-bold text-center text-white mb-1">
                        {signal.ticker}
                      </div>
                      
                      {/* Price */}
                      <div className="text-xs text-center text-gray-400 mb-1">
                        ${signal.price.toLocaleString()}
                      </div>
                      
                      {/* Signal Type Badge */}
                      <div className="text-center">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-2 py-1 ${
                            signal.signalType === 'buy' 
                              ? 'bg-green-900/50 text-green-300' 
                              : 'bg-red-900/50 text-red-300'
                          }`}
                        >
                          {signal.signalType.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {/* Confidence Indicator */}
                      {signal.confidence && (
                        <div className="absolute top-1 right-1">
                          <div className={`w-2 h-2 rounded-full ${
                            signal.confidence >= 85 ? 'bg-green-400' :
                            signal.confidence >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                        </div>
                      )}
                      
                      {/* Intensity Indicator */}
                      <div className="absolute top-1 left-1">
                        <div className="flex gap-1">
                          {Array.from({ length: 3 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full ${
                                i < (signal.intensity === 'high' ? 3 : signal.intensity === 'medium' ? 2 : 1)
                                  ? colorScheme.text.replace('text-', 'bg-')
                                  : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* No signals message */}
            {filteredSignals.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-white mb-2">No signals found</h3>
                <p className="text-gray-400">Try adjusting your filters or wait for new signals to arrive</p>
              </div>
            )}

            {/* Signal Detail Modal */}
            <AnimatePresence>
              {selectedSignal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedSignal(null)}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-4">{selectedSignal.emoji}</div>
                      <h3 className="text-2xl font-bold text-white mb-2">{selectedSignal.ticker}</h3>
                      <Badge className={`mb-4 ${
                        selectedSignal.signalType === 'buy' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {selectedSignal.signalType.toUpperCase()} SIGNAL
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white font-mono">${selectedSignal.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Timeframe:</span>
                        <span className="text-white">{selectedSignal.timeframe}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="text-white">{selectedSignal.confidence}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Intensity:</span>
                        <span className={`capitalize ${
                          selectedSignal.intensity === 'high' ? 'text-red-400' :
                          selectedSignal.intensity === 'medium' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {selectedSignal.intensity}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white text-sm">
                          {new Date(selectedSignal.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {selectedSignal.note && (
                        <div className="pt-2 border-t border-gray-800">
                          <span className="text-gray-400 text-sm">Note:</span>
                          <p className="text-white text-sm mt-1">{selectedSignal.note}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => setSelectedSignal(null)}
                      className="w-full mt-6 bg-gray-800 hover:bg-gray-700"
                    >
                      Close
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}