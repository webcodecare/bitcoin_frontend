import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Bitcoin, Menu, X, Bell, Settings, LogOut, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-primary">
            <Bitcoin className="h-8 w-8" />
            <span>CryptoStrategy Pro</span>
          </Link>
          
          <div className="hidden md:flex space-x-6">
            {!isAuthenticated && (
              <>
                <Link href="/market-data" className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/market-data') ? 'text-foreground font-semibold' : ''}`}>
                  Market Data
                </Link>
                <Link href="/pricing" className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/pricing') ? 'text-foreground font-semibold' : ''}`}>
                  Pricing
                </Link>
                <Link href="/about" className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/about') ? 'text-foreground font-semibold' : ''}`}>
                  About
                </Link>
                <Link href="/contact" className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/contact') ? 'text-foreground font-semibold' : ''}`}>
                  Contact
                </Link>
              </>
            )}
            
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/dashboard') ? 'text-foreground font-semibold' : ''}`}>
                  Dashboard
                </Link>
                <Link href="/members" className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/members') ? 'text-foreground font-semibold' : ''}`}>
                  Members
                </Link>
                <Link href="/alerts" className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/alerts') ? 'text-foreground font-semibold' : ''}`}>
                  Alerts
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className={`text-muted-foreground hover:text-foreground transition-colors ${isActive('/admin') ? 'text-foreground font-semibold' : ''}`}>
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Live BTC Price */}
          <div className="hidden sm:flex items-center space-x-2 lg:space-x-4 bg-muted px-2 lg:px-4 py-2 rounded-lg">
            <span className="text-xs lg:text-sm text-muted-foreground">BTC/USD</span>
            <span className="text-emerald-400 font-semibold text-sm lg:text-base">$67,234.56</span>
            <span className="text-emerald-400 text-xs lg:text-sm">+2.34%</span>
          </div>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.firstName || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/alerts" className="flex items-center">
                    <Bell className="mr-2 h-4 w-4" />
                    Alerts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth?mode=register">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-4 py-2 space-y-1">
            {!isAuthenticated && (
              <Link href="/pricing" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            )}
            
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/alerts" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                  Alerts
                </Link>
                <Link href="/settings" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="block px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
