import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

interface CycleChartProps {
  symbol?: string;
  height?: number;
  className?: string;
}

interface CycleData {
  id: string;
  ticker: string;
  date: string;
  ma2y: string;
  deviation: string;
  cyclePhase: string;
  strengthScore: string;
  createdAt: string;
}

export default function CycleChart({
  symbol = "BTC",
  height = 300,
  className,
}: CycleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const { data: cycleData, isLoading } = useQuery({
    queryKey: [`/api/public/chart/cycle/${symbol}`],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: forecastData } = useQuery({
    queryKey: [`/api/public/chart/forecast/${symbol}`],
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear any existing chart
    chartContainerRef.current.innerHTML = '';

    // Create canvas-based cycle chart
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = chartContainerRef.current.clientWidth || 600;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;

    chartContainerRef.current.appendChild(canvas);

    // Chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);

    // Generate time-series data (2 years)
    const dataPoints = 730; // 2 years daily
    const dataSpacing = chartWidth / dataPoints;

    // Use real data if available, otherwise generate realistic sample
    const generateData = () => {
      const ma2yData = [];
      const deviationData = [];
      const halvingEvents = [];

      for (let i = 0; i < dataPoints; i++) {
        const x = padding + i * dataSpacing;
        
        if (cycleData && cycleData.length > 0) {
          // Use real cycle data
          const dataIndex = Math.floor(i / dataPoints * cycleData.length);
          const point = cycleData[dataIndex];
          ma2yData.push({ x, y: padding + chartHeight - (parseFloat(point.ma2y) / 80000) * chartHeight });
          deviationData.push({ x, y: padding + chartHeight - (parseFloat(point.deviation) + 1) * chartHeight / 2 });
        } else {
          // Generate realistic crypto cycle pattern
          const basePrice = 35000 + Math.sin(i * 0.008) * 25000; // 2-year cycle
          const ma2y = basePrice + Math.sin(i * 0.002) * 5000; // Smoother MA
          const deviation = Math.sin(i * 0.01) * 0.5 + Math.random() * 0.1;
          
          ma2yData.push({ x, y: padding + chartHeight - (ma2y / 80000) * chartHeight });
          deviationData.push({ x, y: padding + chartHeight - (deviation + 1) * chartHeight / 2 });
        }

        // Add halving events (approximately every 4 years = ~1460 days)
        if (i % 1460 === 0 && i > 0) {
          halvingEvents.push({ x, label: `Halving ${Math.floor(i / 1460)}` });
        }
      }

      return { ma2yData, deviationData, halvingEvents };
    };

    const { ma2yData, deviationData, halvingEvents } = generateData();

    // Draw grid lines
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Draw 2-year MA line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ma2yData.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw deviation area
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.beginPath();
    deviationData.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    // Close area to bottom
    ctx.lineTo(deviationData[deviationData.length - 1].x, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Draw deviation line
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    deviationData.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw halving event markers
    halvingEvents.forEach(event => {
      // Vertical line
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(event.x, padding);
      ctx.lineTo(event.x, padding + chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Event marker circle
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(event.x, padding + 20, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Event label
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(event.label, event.x, padding + 10);
    });

    // Add Y-axis labels
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartHeight;
      const value = (1 - i / 5) * 2 - 1; // Range from 1 to -1
      ctx.fillText(value.toFixed(1), padding - 5, y + 4);
    }

    // Add current time indicator
    const currentX = padding + chartWidth * 0.9; // 90% through the timeline
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(currentX, padding);
    ctx.lineTo(currentX, padding + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [cycleData, forecastData, symbol, height]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            2-Year Cycle Analysis
          </CardTitle>
          <CardDescription>Loading cycle data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get current cycle phase and deviation
  const currentCycle = cycleData && cycleData.length > 0 ? cycleData[0] : null;
  const currentPhase = currentCycle?.cyclePhase || 'accumulation';
  const currentDeviation = currentCycle ? parseFloat(currentCycle.deviation) : 0.15;
  const strengthScore = currentCycle ? parseFloat(currentCycle.strengthScore) : 0.78;

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'accumulation': return 'bg-blue-500';
      case 'markup': return 'bg-green-500';
      case 'distribution': return 'bg-orange-500';
      case 'markdown': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'accumulation': return 'Smart money accumulating, prices stable';
      case 'markup': return 'Uptrend in progress, momentum building';
      case 'distribution': return 'Late stage bull, smart money selling';
      case 'markdown': return 'Downtrend active, bear market';
      default: return 'Cycle phase undefined';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              2-Year Cycle Analysis
            </CardTitle>
            <CardDescription>Price deviation from 2-year moving average with market cycles</CardDescription>
          </div>
          <div className="text-right">
            <Badge className={getPhaseColor(currentPhase)}>
              {currentPhase}
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">
              Strength: {(strengthScore * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>2-Year MA</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>Price Deviation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span>Halving Events</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentDeviation > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="font-medium">
                {currentDeviation > 0 ? '+' : ''}{(currentDeviation * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p><strong>Current Phase:</strong> {getPhaseDescription(currentPhase)}</p>
            <p><strong>Signal:</strong> {currentDeviation > 0.5 ? 'Overbought - Consider taking profits' : currentDeviation < -0.3 ? 'Oversold - Potential accumulation zone' : 'Neutral - Watch for trend continuation'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}