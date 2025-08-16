import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
const heatmapChart = '/assets/heatmap-chart.webp';

interface CycleData {
  period: string;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  nextPhase: string;
  daysToPhase: number;
}

const HeatmapCycleAnalyzer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('200week');
  const [cycleData, setCycleData] = useState<Record<string, CycleData>>({
    '200week': {
      period: '200-Week Cycle',
      confidence: 87,
      trend: 'bullish',
      nextPhase: 'Peak Formation',
      daysToPhase: 45
    },
    'yearly': {
      period: 'Yearly Cycle',
      confidence: 73,
      trend: 'neutral',
      nextPhase: 'Seasonal Rally',
      daysToPhase: 89
    },
    'cyclical': {
      period: 'Cyclical Trend',
      confidence: 92,
      trend: 'bullish',
      nextPhase: 'Momentum Shift',
      daysToPhase: 23
    }
  });

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="w-4 h-4" />;
      case 'bearish': return <TrendingDown className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getChartImage = (tab: string) => {
    // Use the same heatmap chart for all analyzer types
    return heatmapChart;
  };

  const getChartTitle = (tab: string) => {
    switch (tab) {
      case '200week': return '200-Week Heatmap Cycle Analyzer';
      case 'yearly': return 'Yearly Cycle Heatmap Forecaster';
      case 'cyclical': return 'Cyclical Heatmap Trend Indicator';
      default: return '200-Week Heatmap Cycle Analyzer';
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Advanced Heatmap Cycle Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="200week" className="text-white data-[state=active]:bg-blue-600">
                200-Week
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-white data-[state=active]:bg-blue-600">
                Yearly
              </TabsTrigger>
              <TabsTrigger value="cyclical" className="text-white data-[state=active]:bg-blue-600">
                Cyclical
              </TabsTrigger>
            </TabsList>

            {['200week', 'yearly', 'cyclical'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {/* Chart Display */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">
                      {getChartTitle(tab)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
                      <img 
                        src={getChartImage(tab)}
                        alt={getChartTitle(tab)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load chart image:', e);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {/* Overlay Info */}
                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center gap-2 text-white">
                          <div className={getTrendColor(cycleData[tab].trend)}>
                            {getTrendIcon(cycleData[tab].trend)}
                          </div>
                          <span className="text-sm font-medium">
                            {cycleData[tab].trend.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Chart Type Indicator */}
                      <div className="absolute bottom-4 left-4 bg-blue-600/90 backdrop-blur-sm rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-white">
                          {getChartTitle(tab)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Confidence Level</p>
                          <p className="text-2xl font-bold text-white">
                            {cycleData[tab].confidence}%
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Current Trend</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-lg font-bold ${getTrendColor(cycleData[tab].trend)}`}>
                              {cycleData[tab].trend.toUpperCase()}
                            </span>
                            {getTrendIcon(cycleData[tab].trend)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Next Phase</p>
                          <p className="text-sm font-medium text-white">
                            {cycleData[tab].nextPhase}
                          </p>
                          <p className="text-xs text-blue-400 mt-1">
                            {cycleData[tab].daysToPhase} days
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cycle Information */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">
                      {cycleData[tab].period} Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-gray-300">
                      {tab === '200week' && (
                        <>
                          <p>The 200-week heatmap cycle analyzer provides long-term perspective on Bitcoin's halving cycles and major market trends using advanced color-coded visualization.</p>
                          <p>Current heatmap shows bullish accumulation patterns with green zones indicating optimal buy opportunities and red zones marking resistance levels.</p>
                        </>
                      )}
                      {tab === 'yearly' && (
                        <>
                          <p>Yearly cycle heatmap forecaster displays seasonal market behavior through color-intensity mapping, revealing institutional flow patterns and seasonal trends.</p>
                          <p>The heatmap analysis suggests neutral momentum with blue zones indicating consolidation and potential for seasonal rally progression.</p>
                        </>
                      )}
                      {tab === 'cyclical' && (
                        <>
                          <p>Cyclical heatmap trend indicator captures short-term momentum shifts through dynamic color gradients, highlighting technical pattern formations.</p>
                          <p>High-intensity green heatmap signals indicate strong bullish momentum with volume confirmation for trend continuation.</p>
                        </>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {cycleData[tab].period}
                      </Badge>
                      <Badge variant="outline" className={getTrendColor(cycleData[tab].trend).replace('text-', 'text-') + ' border-current'}>
                        {cycleData[tab].trend}
                      </Badge>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {cycleData[tab].confidence}% Confidence
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeatmapCycleAnalyzer;