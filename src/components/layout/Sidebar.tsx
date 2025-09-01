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
      title: "Analytics",
      href: "/bitcoin-analytics",
      icon: Bitcoin,
      requiredFeature: "advancedAnalytics" as keyof FeatureAccess,
    },






  ];

  const adminNavSections = [
    {
      title: "Dashboard",
      items: [
        {
          title: "Overview",
          href: "/admin",
          icon: BarChart3,
          description: "Main admin dashboard"
        },
        {
          title: "Analytics",
          href: "/admin/analytics",
          icon: TrendingUp,
          description: "System analytics"
        },
        {
          title: "Reports",
          href: "/admin/reports",
          icon: PieChart,
          description: "Generate reports"
        }
      ]
    },
    {
      title: "User Management",
      items: [
        {
          title: "All Users",
          href: "/admin/users",
          icon: Users,
          description: "Manage all users"
        },
        {
          title: "User Roles",
          href: "/admin/user-roles",
          icon: UserCheck,
          description: "Manage user permissions"
        },
        {
          title: "Test Users",
          href: "/admin/test-users",
          icon: Users,
          description: "Demo & test accounts"
        },
        {
          title: "Permissions",
          href: "/admin/permissions",
          icon: Shield,
          description: "Access control"
        }
      ]
    },
    {
      title: "Signal Management",
      items: [
        {
          title: "Signal Control",
          href: "/admin/signal-management",
          icon: Activity,
          description: "Create & manage signals"
        },
        {
          title: "Signal Logs",
          href: "/admin/signals",
          icon: FileText,
          description: "Signal history"
        },
        {
          title: "Signal Subscriptions",
          href: "/admin/signal-subscriptions",
          icon: Bell,
          description: "User signal subscriptions"
        }
      ]
    },
    {
      title: "Market Data",
      items: [
        {
          title: "Tickers",
          href: "/admin/tickers",
          icon: Coins,
          description: "Manage crypto pairs"
        },
        {
          title: "Live Streaming",
          href: "/live-streaming",
          icon: Activity,
          description: "Real-time data"
        },
        {
          title: "Historical Data",
          href: "/historical-ohlc",
          icon: BarChart,
          description: "OHLC data"
        }
      ]
    },
    {
      title: "Subscriptions & Payments",
      items: [
        {
          title: "Subscriptions",
          href: "/admin/subscriptions",
          icon: CreditCard,
          description: "User subscriptions"
        },
        {
          title: "Payment Logs",
          href: "/admin/payments",
          icon: DollarSign,
          description: "Payment history"
        }
      ]
    },
    {
      title: "Notifications & Alerts",
      items: [
        {
          title: "Alert System",
          href: "/admin/alerts",
          icon: Bell,
          description: "System alerts"
        },
        {
          title: "Notifications",
          href: "/admin/notifications",
          icon: MessageSquare,
          description: "User notifications"
        },
        {
          title: "Notification Center",
          href: "/notification-center",
          icon: MessageSquare,
          description: "Notification hub"
        }
      ]
    },
    {
      title: "System & Settings",
      items: [
        {
          title: "Access Logs",
          href: "/admin/logs",
          icon: FileText,
          description: "System access logs"
        },
        {
          title: "API Integrations",
          href: "/admin/integrations",
          icon: Settings,
          description: "External APIs"
        },
        {
          title: "Content Management",
          href: "/admin/content",
          icon: Edit,
          description: "Manage content"
        },
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
          description: "System settings"
        }
      ]
    }
  ];

  // Flatten for compatibility with existing code
  const adminNavItems = adminNavSections.flatMap(section => section.items);

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
            {user?.role === 'admin' ? (
              // Admin organized sections
              adminNavSections.map((section, sectionIndex) => (
                <div key={section.title} className="space-y-1">
                  {sectionIndex > 0 && (
                    <div className="my-3 border-t border-border/50"></div>
                  )}
                  <div className="px-2 py-1">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 p-2 lg:p-3 rounded-lg transition-colors text-sm lg:text-base group relative",
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{item.title}</span>
                          <span className="text-xs text-muted-foreground/70 truncate hidden lg:block">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))
            ) : (
              // User navigation (existing)
              filteredUserNavItems.map((item) => {
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
              })
            )}
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
