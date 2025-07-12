import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import SubscriptionGuard from "@/components/auth/SubscriptionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Target,
  BarChart3,
  Settings,
  Award,
  AlertTriangle,
  Activity,
  PieChart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdvancedSimulationChart from "@/components/trading/AdvancedSimulationChart";

interface SimulationSettings {
  initialBalance: number;
  riskPercentage: number;
  autoTrade: boolean;
  signalFrequency: number; // minutes
  marketCondition: 'bull' | 'bear' | 'sideways' | 'volatile';
  simulationSpeed: number; // 1x, 2x, 5x, 10x
  enableStopLoss: boolean;
  stopLossPercentage: number;
  enableTakeProfit: boolean;
  takeProfitPercentage: number;
  tradingPairs: string[];
}

interface TradingPosition {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  entryPrice: number;
  quantity: number;
  timestamp: Date;
  status: 'open' | 'closed';
  exitPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
}

interface SimulationStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercentage: number;
  largestWin: number;
  largestLoss: number;
  currentBalance: number;
  maxDrawdown: number;
  profitFactor: number;
}

interface LiveSignal {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  price: number;
  confidence: number;
  strategy: string;
  timestamp: Date;
  executed?: boolean;
}

export default function TradingPlayground() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulation state
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    initialBalance: 10000,
    riskPercentage: 2,
    autoTrade: true,
    signalFrequency: 5,
    marketCondition: 'bull',
    simulationSpeed: 1,
    enableStopLoss: true,
    stopLossPercentage: 5,
    enableTakeProfit: true,
    takeProfitPercentage: 10,
    tradingPairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
  });

  // Trading state
  const [currentBalance, setCurrentBalance] = useState(10000);
  const [positions, setPositions] = useState<TradingPosition[]>([]);
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>([]);
  const [simulationStats, setSimulationStats] = useState<SimulationStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    totalPnLPercentage: 0,
    largestWin: 0,
    largestLoss: 0,
    currentBalance: 10000,
    maxDrawdown: 0,
    profitFactor: 0
  });

  // Performance tracking
  const [balanceHistory, setBalanceHistory] = useState<{time: number, balance: number, pnl: number}[]>([]);
  const [riskMetrics, setRiskMetrics] = useState({
    sharpeRatio: 0,
    maxDrawdown: 0,
    volatility: 0,
    profitFactor: 0
  });

  // Fetch available tickers
  const { data: tickers } = useQuery({
    queryKey: ['/api/tickers'],
    queryFn: () => apiRequest('/api/tickers')
  });

  // Fetch market prices for selected pairs
  const { data: marketPrices } = useQuery({
    queryKey: ['/api/market/prices', simulationSettings.tradingPairs],
    queryFn: async () => {
      const prices: Record<string, number> = {};
      for (const pair of simulationSettings.tradingPairs) {
        try {
          const data = await apiRequest(`/api/market/price/${pair}`);
          prices[pair] = data.price;
        } catch (error) {
          console.error(`Error fetching price for ${pair}:`, error);
          // Add realistic price simulation based on pair
          const basePrice = pair.includes('BTC') ? 65000 : pair.includes('ETH') ? 3400 : 100;
          prices[pair] = basePrice * (0.95 + Math.random() * 0.1); // ±5% variation
        }
      }
      return prices;
    },
    refetchInterval: 2000,
    enabled: isSimulationRunning
  });

  // Generate random trading signals with market condition influence
  const generateSignal = (): LiveSignal => {
    const symbol = simulationSettings.tradingPairs[Math.floor(Math.random() * simulationSettings.tradingPairs.length)];
    
    // Market condition influences signal direction
    let action: 'buy' | 'sell';
    switch (simulationSettings.marketCondition) {
      case 'bull':
        action = Math.random() > 0.3 ? 'buy' : 'sell'; // 70% buy signals
        break;
      case 'bear':
        action = Math.random() > 0.7 ? 'buy' : 'sell'; // 30% buy signals
        break;
      case 'volatile':
        action = Math.random() > 0.5 ? 'buy' : 'sell'; // 50/50 with rapid changes
        break;
      default: // sideways
        action = Math.random() > 0.45 ? 'buy' : 'sell'; // Slightly more buys
    }
    
    const basePrice = marketPrices?.[symbol] || 50000;
    // Add market condition volatility
    const volatilityMultiplier = simulationSettings.marketCondition === 'volatile' ? 0.02 : 0.005;
    const price = basePrice * (1 + (Math.random() - 0.5) * volatilityMultiplier);
    
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%
    
    const strategies = [
      'RSI Divergence', 'MACD Cross', 'Support/Resistance', 
      'Trend Following', 'Volume Spike', 'Bollinger Bands',
      'Fibonacci Retracement', 'Moving Average Cross'
    ];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];

    return {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      action,
      price: parseFloat(price.toFixed(2)),
      confidence,
      strategy,
      timestamp: new Date(),
      executed: false
    };
  };

  // Execute trade based on signal
  const executeTrade = (signal: LiveSignal) => {
    if (!isSimulationRunning) return;

    const riskAmount = currentBalance * (simulationSettings.riskPercentage / 100);
    const quantity = riskAmount / signal.price;

    const newPosition: TradingPosition = {
      id: `position_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: signal.symbol,
      action: signal.action,
      entryPrice: signal.price,
      quantity: parseFloat(quantity.toFixed(6)),
      timestamp: signal.timestamp,
      status: 'open'
    };

    setPositions(prev => [newPosition, ...prev]);
    
    // Mark signal as executed
    setLiveSignals(prev => 
      prev.map(s => s.id === signal.id ? { ...s, executed: true } : s)
    );

    toast({
      title: "Trade Executed",
      description: `${signal.action.toUpperCase()} ${quantity.toFixed(6)} ${signal.symbol} at $${signal.price}`,
    });
  };

  // Close position with current market price
  const closePosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position || position.status === 'closed') return;

    const currentPrice = marketPrices?.[position.symbol] || position.entryPrice;
    const priceDiff = position.action === 'buy' 
      ? currentPrice - position.entryPrice 
      : position.entryPrice - currentPrice;
    
    const pnl = priceDiff * position.quantity;
    const pnlPercentage = (priceDiff / position.entryPrice) * 100;

    const updatedPosition: TradingPosition = {
      ...position,
      status: 'closed',
      exitPrice: currentPrice,
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPercentage: parseFloat(pnlPercentage.toFixed(2))
    };

    setPositions(prev => 
      prev.map(p => p.id === positionId ? updatedPosition : p)
    );

    // Update balance
    const newBalance = currentBalance + pnl;
    setCurrentBalance(newBalance);

    // Update balance history for chart
    setBalanceHistory(prev => [...prev, {
      time: Date.now(),
      balance: newBalance,
      pnl: newBalance - simulationSettings.initialBalance
    }].slice(-50)); // Keep last 50 data points

    // Update stats
    updateSimulationStats(updatedPosition);

    toast({
      title: pnl > 0 ? "Profitable Trade" : "Loss Trade",
      description: `Closed ${position.action.toUpperCase()} ${position.symbol}: ${pnl > 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercentage > 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%)`,
      variant: pnl > 0 ? "default" : "destructive"
    });
  };

  // Update simulation statistics
  const updateSimulationStats = (closedPosition: TradingPosition) => {
    setSimulationStats(prev => {
      const totalTrades = prev.totalTrades + 1;
      const isWin = (closedPosition.pnl || 0) > 0;
      const winningTrades = prev.winningTrades + (isWin ? 1 : 0);
      const losingTrades = prev.losingTrades + (isWin ? 0 : 1);
      const winRate = (winningTrades / totalTrades) * 100;
      const totalPnL = prev.totalPnL + (closedPosition.pnl || 0);
      const totalPnLPercentage = ((currentBalance - simulationSettings.initialBalance) / simulationSettings.initialBalance) * 100;
      
      return {
        ...prev,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: parseFloat(winRate.toFixed(2)),
        totalPnL: parseFloat(totalPnL.toFixed(2)),
        totalPnLPercentage: parseFloat(totalPnLPercentage.toFixed(2)),
        largestWin: Math.max(prev.largestWin, closedPosition.pnl || 0),
        largestLoss: Math.min(prev.largestLoss, closedPosition.pnl || 0),
        currentBalance
      };
    });
  };

  // Reset simulation
  const resetSimulation = () => {
    setIsSimulationRunning(false);
    setCurrentBalance(simulationSettings.initialBalance);
    setPositions([]);
    setLiveSignals([]);
    setBalanceHistory([{
      time: Date.now(),
      balance: simulationSettings.initialBalance,
      pnl: 0
    }]);
    setSimulationStats({
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      totalPnLPercentage: 0,
      largestWin: 0,
      largestLoss: 0,
      currentBalance: simulationSettings.initialBalance,
      maxDrawdown: 0,
      profitFactor: 0
    });

    toast({
      title: "Simulation Reset",
      description: "All trades cleared and balance restored",
    });
  };

  // Signal generation effect
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance to generate signal
        const newSignal = generateSignal();
        setLiveSignals(prev => [newSignal, ...prev.slice(0, 9)]); // Keep last 10 signals

        // Auto-execute if enabled
        if (simulationSettings.autoTrade && newSignal.confidence > 75) {
          setTimeout(() => executeTrade(newSignal), 1000);
        }
      }
    }, (simulationSettings.signalFrequency * 60 * 1000) / simulationSettings.simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulationRunning, simulationSettings, marketPrices]);

  // Auto-close positions effect (simulate take profit/stop loss)
  useEffect(() => {
    if (!isSimulationRunning || !marketPrices) return;

    const openPositions = positions.filter(p => p.status === 'open');
    
    openPositions.forEach(position => {
      const currentPrice = marketPrices[position.symbol];
      if (!currentPrice) return;

      const priceDiff = position.action === 'buy' 
        ? currentPrice - position.entryPrice 
        : position.entryPrice - currentPrice;
      
      const pnlPercentage = (priceDiff / position.entryPrice) * 100;

      // Check take profit
      if (simulationSettings.enableTakeProfit && pnlPercentage >= simulationSettings.takeProfitPercentage) {
        setTimeout(() => closePosition(position.id), 100);
        return;
      }

      // Check stop loss
      if (simulationSettings.enableStopLoss && pnlPercentage <= -simulationSettings.stopLossPercentage) {
        setTimeout(() => closePosition(position.id), 100);
        return;
      }
    });
  }, [marketPrices, positions, isSimulationRunning, simulationSettings]);

  const openPositions = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status === 'closed').slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="p-6 space-y-6">
            <SubscriptionGuard feature="tradingPlayground">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Trading Playground</h1>
                <p className="text-gray-400 mt-1">Practice trading with real-time signals and simulated portfolio</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setIsSimulationRunning(!isSimulationRunning)}
                  className={`${isSimulationRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isSimulationRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause Simulation
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Simulation
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetSimulation}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Current Balance</p>
                      <p className="text-2xl font-bold text-white">
                        ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    <span className={`text-sm ${simulationStats.totalPnLPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {simulationStats.totalPnLPercentage >= 0 ? '+' : ''}{simulationStats.totalPnLPercentage.toFixed(2)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Win Rate</p>
                      <p className="text-2xl font-bold text-white">{simulationStats.winRate.toFixed(1)}%</p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-400">
                      {simulationStats.winningTrades}W / {simulationStats.losingTrades}L
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total P&L</p>
                      <p className={`text-2xl font-bold ${simulationStats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {simulationStats.totalPnL >= 0 ? '+' : ''}${simulationStats.totalPnL.toFixed(2)}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-400">
                      {simulationStats.totalTrades} trades
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Open Positions</p>
                      <p className="text-2xl font-bold text-white">{openPositions.length}</p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-400">
                      Active trades
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Performance Chart */}
              <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Portfolio Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdvancedSimulationChart 
                    data={balanceHistory}
                    width={400}
                    height={200}
                  />
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-400">Max Drawdown</p>
                      <p className="text-lg font-semibold text-red-400">
                        {simulationStats.maxDrawdown.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Profit Factor</p>
                      <p className="text-lg font-semibold text-green-400">
                        {riskMetrics.profitFactor.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Volatility</p>
                      <p className="text-lg font-semibold text-yellow-400">
                        {riskMetrics.volatility.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Simulation Settings */}
              <Card className="bg-gray-800 border-gray-700 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Simulation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Initial Balance</Label>
                    <Input
                      type="number"
                      value={simulationSettings.initialBalance}
                      onChange={(e) => setSimulationSettings(prev => ({ 
                        ...prev, 
                        initialBalance: parseFloat(e.target.value) || 10000 
                      }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      disabled={isSimulationRunning}
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Risk Per Trade (%)</Label>
                    <Slider
                      value={[simulationSettings.riskPercentage]}
                      onValueChange={(value) => setSimulationSettings(prev => ({ 
                        ...prev, 
                        riskPercentage: value[0] 
                      }))}
                      max={10}
                      min={0.5}
                      step={0.5}
                      className="mt-2"
                      disabled={isSimulationRunning}
                    />
                    <span className="text-sm text-gray-400">{simulationSettings.riskPercentage}%</span>
                  </div>

                  <div>
                    <Label className="text-gray-300">Market Condition</Label>
                    <Select
                      value={simulationSettings.marketCondition}
                      onValueChange={(value: 'bull' | 'bear' | 'sideways' | 'volatile') => 
                        setSimulationSettings(prev => ({ ...prev, marketCondition: value }))
                      }
                      disabled={isSimulationRunning}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bull">Bull Market</SelectItem>
                        <SelectItem value="bear">Bear Market</SelectItem>
                        <SelectItem value="sideways">Sideways/Range</SelectItem>
                        <SelectItem value="volatile">High Volatility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Simulation Speed</Label>
                    <Select
                      value={simulationSettings.simulationSpeed.toString()}
                      onValueChange={(value) => setSimulationSettings(prev => ({ 
                        ...prev, 
                        simulationSpeed: parseInt(value) 
                      }))}
                      disabled={isSimulationRunning}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1x (Real-time)</SelectItem>
                        <SelectItem value="2">2x Speed</SelectItem>
                        <SelectItem value="5">5x Speed</SelectItem>
                        <SelectItem value="10">10x Speed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Auto-Trade Signals</Label>
                      <Switch
                        checked={simulationSettings.autoTrade}
                        onCheckedChange={(checked) => setSimulationSettings(prev => ({ 
                          ...prev, 
                          autoTrade: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Enable Stop Loss</Label>
                      <Switch
                        checked={simulationSettings.enableStopLoss}
                        onCheckedChange={(checked) => setSimulationSettings(prev => ({ 
                          ...prev, 
                          enableStopLoss: checked 
                        }))}
                      />
                    </div>

                    {simulationSettings.enableStopLoss && (
                      <div>
                        <Label className="text-gray-300">Stop Loss (%)</Label>
                        <Slider
                          value={[simulationSettings.stopLossPercentage]}
                          onValueChange={(value) => setSimulationSettings(prev => ({ 
                            ...prev, 
                            stopLossPercentage: value[0] 
                          }))}
                          max={20}
                          min={1}
                          step={1}
                          className="mt-2"
                          disabled={isSimulationRunning}
                        />
                        <span className="text-sm text-gray-400">{simulationSettings.stopLossPercentage}%</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Enable Take Profit</Label>
                      <Switch
                        checked={simulationSettings.enableTakeProfit}
                        onCheckedChange={(checked) => setSimulationSettings(prev => ({ 
                          ...prev, 
                          enableTakeProfit: checked 
                        }))}
                      />
                    </div>

                    {simulationSettings.enableTakeProfit && (
                      <div>
                        <Label className="text-gray-300">Take Profit (%)</Label>
                        <Slider
                          value={[simulationSettings.takeProfitPercentage]}
                          onValueChange={(value) => setSimulationSettings(prev => ({ 
                            ...prev, 
                            takeProfitPercentage: value[0] 
                          }))}
                          max={50}
                          min={5}
                          step={5}
                          className="mt-2"
                          disabled={isSimulationRunning}
                        />
                        <span className="text-sm text-gray-400">{simulationSettings.takeProfitPercentage}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Live Signals */}
              <Card className="bg-gray-800 border-gray-700 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Live Signals
                    {isSimulationRunning && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-2 h-2 bg-green-500 rounded-full ml-2"
                      />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {liveSignals.map((signal) => (
                        <motion.div
                          key={signal.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`p-3 rounded-lg border ${
                            signal.executed 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-gray-750 border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {signal.action === 'buy' ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-white font-medium">{signal.symbol}</span>
                              <Badge variant={signal.action === 'buy' ? 'default' : 'destructive'}>
                                {signal.action.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-400">
                              {signal.confidence}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-300">${signal.price.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{signal.strategy}</p>
                            </div>
                            {!signal.executed && !simulationSettings.autoTrade && (
                              <Button
                                size="sm"
                                onClick={() => executeTrade(signal)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Execute
                              </Button>
                            )}
                            {signal.executed && (
                              <Badge variant="outline" className="text-green-500 border-green-500">
                                Executed
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {liveSignals.length === 0 && (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500">
                          {isSimulationRunning ? 'Waiting for signals...' : 'Start simulation to see signals'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Open Positions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Open Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {openPositions.map((position) => {
                      const currentPrice = marketPrices?.[position.symbol] || position.entryPrice;
                      const priceDiff = position.action === 'buy' 
                        ? currentPrice - position.entryPrice 
                        : position.entryPrice - currentPrice;
                      const unrealizedPnL = priceDiff * position.quantity;
                      const unrealizedPnLPercentage = (priceDiff / position.entryPrice) * 100;

                      return (
                        <div
                          key={position.id}
                          className="p-3 rounded-lg bg-gray-750 border border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {position.action === 'buy' ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-white font-medium">{position.symbol}</span>
                              <Badge variant={position.action === 'buy' ? 'default' : 'destructive'}>
                                {position.action.toUpperCase()}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => closePosition(position.id)}
                              className="border-gray-600 text-gray-300 hover:text-white"
                            >
                              Close
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Entry: </span>
                              <span className="text-white">${position.entryPrice}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Current: </span>
                              <span className="text-white">${currentPrice.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Qty: </span>
                              <span className="text-white">{position.quantity.toFixed(6)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">P&L: </span>
                              <span className={unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <span className={`text-sm ${unrealizedPnLPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {unrealizedPnLPercentage >= 0 ? '+' : ''}{unrealizedPnLPercentage.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {openPositions.length === 0 && (
                      <div className="text-center py-8">
                        <BarChart3 className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-500">No open positions</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trade History */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Time</TableHead>
                      <TableHead className="text-gray-300">Symbol</TableHead>
                      <TableHead className="text-gray-300">Action</TableHead>
                      <TableHead className="text-gray-300">Entry Price</TableHead>
                      <TableHead className="text-gray-300">Exit Price</TableHead>
                      <TableHead className="text-gray-300">Quantity</TableHead>
                      <TableHead className="text-gray-300">P&L</TableHead>
                      <TableHead className="text-gray-300">P&L %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedPositions.map((position) => (
                      <TableRow key={position.id} className="border-gray-700">
                        <TableCell className="text-gray-300">
                          {position.timestamp.toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="text-white">{position.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={position.action === 'buy' ? 'default' : 'destructive'}>
                            {position.action.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">${position.entryPrice}</TableCell>
                        <TableCell className="text-white">${position.exitPrice}</TableCell>
                        <TableCell className="text-white">{position.quantity.toFixed(6)}</TableCell>
                        <TableCell className={position.pnl! >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {position.pnl! >= 0 ? '+' : ''}${position.pnl}
                        </TableCell>
                        <TableCell className={position.pnlPercentage! >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {position.pnlPercentage! >= 0 ? '+' : ''}{position.pnlPercentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {closedPositions.length === 0 && (
                  <div className="text-center py-8">
                    <BarChart3 className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-500">No completed trades yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            </SubscriptionGuard>
          </div>
        </div>
      </div>
    </div>
  );
}