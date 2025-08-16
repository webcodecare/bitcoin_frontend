import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketWidgetProps {
  symbol: string;
  name: string;
  icon?: React.ReactNode;
  className?: string;
}

interface PriceData {
  symbol: string;
  price: string;
}

export default function MarketWidget({ symbol, name, icon, className }: MarketWidgetProps) {
  const { data: priceData, isLoading, error } = useQuery({
    queryKey: ["/api/public/market/price", symbol],
    queryFn: async () => {
      const { apiService } = await import('@/services/apiService');
      return await apiService.getMarketPrice(symbol);
    },
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
    retry: 3,
  });

  // Mock 24h change data (in a real app, this would come from an API)
  const change24h = Math.random() * 10 - 5; // Random change between -5% and 5%
  const isPositive = change24h > 0;

  if (isLoading && !priceData) {
    return (
      <Card className={className}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
            <div className="text-right">
              <Skeleton className="h-5 w-20 mb-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  if (error && !priceData) {
    return (
      <Card className={className}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {icon && <div className="text-2xl opacity-50">{icon}</div>}
              <div>
                <div className="font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground">{symbol?.replace('USDT', '') || 'N/A'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-red-500">Error loading price</div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const price = priceData ? parseFloat(priceData.price) : 0;
  const formattedPrice = price > 1000 ? 
    `${(price / 1000).toFixed(1)}k` : 
    price > 1 ? 
      price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
      price.toFixed(6);

  return (
    <Card className={cn("hover:border-primary/50 transition-colors", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon && <div className="text-2xl">{icon}</div>}
            <div>
              <div className="font-semibold">{name}</div>
              <div className="text-sm text-muted-foreground">{symbol?.replace('USDT', '') || 'N/A'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">${formattedPrice}</div>
            <div className={cn(
              "text-sm flex items-center justify-end",
              isPositive ? "text-emerald-400" : "text-red-400"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(change24h).toFixed(2)}%
            </div>
            {isLoading && priceData && (
              <div className="text-xs text-muted-foreground mt-1">Updating...</div>
            )}
          </div>
        </div>
        
        {/* Mini chart placeholder */}
        <div className="h-16 bg-muted rounded-lg flex items-end justify-center p-2">
          <div className="flex items-end space-x-1 h-12">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-t transition-all duration-300",
                  isPositive ? "bg-emerald-400" : "bg-red-400"
                )}
                style={{
                  height: `${Math.random() * 100}%`,
                  opacity: 0.6 + (Math.random() * 0.4),
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
