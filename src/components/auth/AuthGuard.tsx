import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, startTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "superuser" | "user";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      startTransition(() => {
        // Store the attempted URL for post-login redirect
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/auth' && currentPath !== '/') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        setLocation("/auth");
      });
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Redirect free tier users to subscription page
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userTier = user.subscriptionTier || "free";
      const subscriptionStatus = user.subscriptionStatus;
      const currentPath = window.location.pathname;
      
      // Skip redirecting if user is admin or already on subscription/pricing page
      if (user.role === "admin" || user.role === "superuser") {
        return;
      }
      
      if (currentPath === "/subscription" || currentPath === "/pricing" || currentPath === "/auth" || currentPath === "/") {
        return;
      }

      // Check if user just completed payment (don't redirect during payment success)
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment') === 'success';
      
      if (paymentSuccess && currentPath === "/dashboard") {
        // Allow dashboard access immediately after payment success
        return;
      }

      // Redirect free tier users or users without active subscription to subscription page
      if (userTier === "free" || !subscriptionStatus || subscriptionStatus !== "active") {
        startTransition(() => {
          setLocation("/subscription");
        });
      }
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // Check role-based access with superuser support
  if (requiredRole && user?.role !== requiredRole) {
    // Allow superuser to access admin routes
    const hasAccess = requiredRole === "admin" && (user?.role === "superuser" || user?.role === "admin");
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl lg:text-4xl font-bold text-destructive mb-2">Access Denied</h1>
              <p className="text-muted-foreground mb-6">
                You don't have permission to access this page. {requiredRole === "admin" ? "Administrator" : "Elevated"} privileges required.
              </p>
            </div>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/settings">Account Settings</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
