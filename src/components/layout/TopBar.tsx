import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'wouter';
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  title: string;
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
}

interface LiveTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

export default function TopBar({ title, onMobileMenuToggle, showMobileMenu }: TopBarProps) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(3); // Mock notification count

  // Fetch live ticker data for top bar preview
  const { data: tickers = [] } = useQuery({
    queryKey: ['/api/market/prices'],
    queryFn: async () => {
      const response = await fetch('/api/market/prices');
      if (!response.ok) throw new Error('Failed to fetch prices');
      return await response.json();
    },
    refetchInterval: 10000, // Update every 10 seconds
  });

  // Filter to show main tickers in top bar
  const mainTickers = tickers.filter((ticker: LiveTicker) => 
    ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].includes(ticker.symbol)
  ).slice(0, 3);

  const formatPrice = (price: number) => {
    if (price > 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (price > 1) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    return price.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'User';
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="flex items-center justify-between p-4 lg:p-6">
        {/* Left Section - Mobile Menu + Title */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMobileMenuToggle}
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Page Title */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">{title}</h1>
            {user?.role === 'admin' && (
              <Badge variant="destructive" className="text-xs mt-1">
                Administrator
              </Badge>
            )}
          </div>
        </div>

        {/* Center Section - Live Ticker Preview (Desktop) */}
        <div className="hidden lg:flex items-center space-x-6">
          {mainTickers.map((ticker: LiveTicker) => (
            <div key={ticker.symbol} className="bg-muted px-4 py-2 rounded-lg min-w-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  {ticker.symbol.replace('USDT', '')}
                </span>
                {ticker.changePercent24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-sm">
                  ${formatPrice(ticker.price)}
                </span>
                <span className={`text-xs ${
                  ticker.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {ticker.changePercent24h >= 0 ? '+' : ''}{ticker.changePercent24h.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Section - Notifications + Profile */}
        <div className="flex items-center space-x-3">
          {/* Live Status Indicator */}
          <div className="hidden md:flex items-center space-x-2 bg-green-600/10 text-green-400 px-3 py-1.5 rounded-lg border border-green-600/20">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-xs font-medium">Live</span>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 border-b">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem asChild>
                  <Link href="/alerts" className="flex items-center space-x-3 p-3">
                    <div className="bg-green-600/10 p-2 rounded">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">New BUY signal for BTCUSDT</p>
                      <p className="text-muted-foreground">2 minutes ago</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/alerts" className="flex items-center space-x-3 p-3">
                    <div className="bg-yellow-600/10 p-2 rounded">
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">Price alert triggered</p>
                      <p className="text-muted-foreground">15 minutes ago</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/alerts" className="flex items-center space-x-3 p-3">
                    <div className="bg-red-600/10 p-2 rounded">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">SELL signal for ETHUSDT</p>
                      <p className="text-muted-foreground">1 hour ago</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/alerts" className="w-full text-center text-sm font-medium">
                  View All Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{getUserDisplayName(user)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role || 'user'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="font-medium">{getUserDisplayName(user)}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/preferences" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/advanced-alerts" className="flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Advanced Alerts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="flex items-center text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Ticker Preview */}
      <div className="lg:hidden border-t border-border p-4">
        <div className="flex space-x-4 overflow-x-auto">
          {mainTickers.map((ticker: LiveTicker) => (
            <div key={ticker.symbol} className="bg-muted px-3 py-2 rounded-lg min-w-[120px] flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  {ticker.symbol.replace('USDT', '')}
                </span>
                {ticker.changePercent24h >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-sm">
                  ${formatPrice(ticker.price)}
                </span>
                <span className={`text-xs ${
                  ticker.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {ticker.changePercent24h >= 0 ? '+' : ''}{ticker.changePercent24h.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}