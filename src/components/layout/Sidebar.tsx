import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import ProtectedSidebarItem from "./ProtectedSidebarItem";
import { hasAccess, FeatureAccess } from "@/lib/subscriptionUtils";
import {
  Bitcoin,
  TrendingUp,
  Bell,
  Settings,
  SlidersHorizontal,
  Shield,
  BarChart3,
  BarChart,
  Users,
  Coins,
  Activity,
  CreditCard,
  DollarSign,
  MessageSquare,
  FileText,
  Edit,
  AlertTriangle,
  PieChart,
  Smile,
  Menu,
  X,
  LogOut,
  Star,
  Target,
  Trophy,
  UserCheck,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className }: Omit<SidebarProps, 'isOpen' | 'onClose'>) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin users bypass subscription checks
  const isAdminUser = user?.role === "admin" || user?.role === "superuser";
  
  // Check subscription tier for feature access
  const userTier = user?.subscriptionTier || "free";
  const isSubscriptionActive = user?.subscriptionStatus === "active";
  
  // Hide sidebar completely for free users only (except admins)
  if (!isAdminUser && (userTier === "free" || !isSubscriptionActive)) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/admin" && location === "/admin") return true;
    if (path !== "/admin" && location.startsWith(path)) return true;
    return location === path;
  };

  const userNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: TrendingUp,
      requiredFeature: "trading_dashboard" as keyof FeatureAccess,
    },
    {
      title: "Multi-Ticker",
      href: "/multi-ticker",
      icon: BarChart3,
      requiredFeature: "advancedCharts" as keyof FeatureAccess,
    },
    {
      title: "Subscriptions",
      href: "/subscription",
      icon: Star,
      requiredFeature: "basicSignals" as keyof FeatureAccess,
    },
    {
      title: "Trading",
      href: "/trading",
      icon: Activity,
      requiredFeature: "tradingPlayground" as keyof FeatureAccess,
    },
    {
      title: "Bitcoin Analytics",
      href: "/bitcoin-analytics",
      icon: Bitcoin,
      requiredFeature: "advancedAnalytics" as keyof FeatureAccess,
    },
    {
      title: "Live Streaming",
      href: "/live-streaming",
      icon: Activity,
      requiredFeature: "liveStreaming" as keyof FeatureAccess,
    },
    {
      title: "Historical OHLC",
      href: "/historical-ohlc",
      icon: BarChart,
      requiredFeature: "historicalData" as keyof FeatureAccess,
    },
    {
      title: "Notifications",
      href: "/notification-center",
      icon: Bell,
      requiredFeature: "emailAlerts" as keyof FeatureAccess,
    },
    {
      title: "Signal Mood Board",
      href: "/mood-board",
      icon: Smile,
      requiredFeature: "basicSignals" as keyof FeatureAccess,
    },
    {
      title: "Alerts",
      href: "/alerts",
      icon: Bell,
      requiredFeature: "realTimeAlerts" as keyof FeatureAccess,
    },
    {
      title: "Advanced Alerts",
      href: "/advanced-alerts",
      icon: AlertTriangle,
      requiredFeature: "advancedAlerts" as keyof FeatureAccess,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      requiredFeature: "basicSignals" as keyof FeatureAccess,
    },
    {
      title: "Notification Dashboard",
      href: "/notification-dashboard",
      icon: Activity,
      requiredFeature: "multiChannelAlerts" as keyof FeatureAccess,
    },
  ];

  const adminNavItems = [
    {
      title: "Overview",
      href: "/admin",
      icon: BarChart3,
    },
    {
      title: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Subscriptions",
      href: "/admin/subscriptions",
      icon: CreditCard,
    },
    {
      title: "Payment Logs",
      href: "/admin/payments",
      icon: DollarSign,
    },
    {
      title: "Signal Logs",
      href: "/admin/signals",
      icon: Activity,
    },
    {
      title: "Ticker Management",
      href: "/admin/tickers",
      icon: Coins,
    },
    {
      title: "Alerts Monitor",
      href: "/admin/alerts",
      icon: Bell,
    },
    {
      title: "Notifications",
      href: "/admin/notifications",
      icon: MessageSquare,
    },
    {
      title: "Access Logs",
      href: "/admin/logs",
      icon: FileText,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: TrendingUp,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: BarChart,
    },
    {
      title: "API Integrations",
      href: "/admin/integrations",
      icon: Settings,
    },
    {
      title: "Notification Setup",
      href: "/admin/notification-setup",
      icon: Bell,
    },
    {
      title: "Content Management",
      href: "/admin/content",
      icon: Edit,
    },
    {
      title: "Permission Management",
      href: "/admin/permissions",
      icon: Shield,
    },
    {
      title: "Admin User Roles",
      href: "/admin/user-roles",
      icon: UserCheck,
    },
    {
      title: "Test Users",
      href: "/admin/test-users",
      icon: Users,
    },
  ];

  // Filter navigation items based on subscription features
  const filteredUserNavItems = userNavItems.filter(item => {
    if (isAdminUser) return true; // Admins see everything
    if (!item.requiredFeature) return true; // Items without feature requirements are always shown
    return hasAccess(userTier, item.requiredFeature);
  });

  const navItems = user?.role === 'admin' ? adminNavItems : filteredUserNavItems;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-card h-screen border-r border-border fixed left-0 top-0 z-40 transition-transform duration-300",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="p-4 lg:p-6">
          <Link href="/" className="flex items-center justify-center mb-6 lg:mb-8">
            {user?.role === 'admin' ? (
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 lg:h-6 lg:w-6" style={{ color: '#4A9FE7' }} />
                <span className="text-lg lg:text-xl font-bold" style={{ color: '#4A9FE7' }}>Admin Panel</span>
              </div>
            ) : (
              <img 
                src="/proud-profits-logo.png" 
                alt="Proud Profits" 
                className="h-10 lg:h-12 object-contain"
              />
            )}
          </Link>
          
          <nav className="space-y-1 lg:space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 p-2 lg:p-3 rounded-lg transition-colors text-sm lg:text-base",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info and Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 border-t border-border bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block">
                  <p className="font-medium text-foreground">{user?.firstName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-2 lg:p-3 rounded-lg transition-colors text-sm lg:text-base text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <LogOut className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
