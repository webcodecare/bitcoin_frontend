import { useState } from "react";
import { Check, CreditCard, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: "free" | "basic" | "premium" | "pro";
  stripePriceId: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  features: string[] | null;
  maxSignals: number | null;
  maxTickers: number | null;
  isActive: boolean;
}

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const applyPromoMutation = useMutation({
    mutationFn: async ({ code, tier }: { code: string; tier: string }) => {
      const response = await apiRequest("POST", "/api/apply-promo-code", {
        promoCode: code,
        planTier: tier,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAppliedPromo(data);
      toast({
        title: "Promo Code Applied!",
        description: `You save ${formatCurrency(data.savings)} with this code.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Promo Code",
        description: error.message || "This promotional code is not valid.",
        variant: "destructive",
      });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planTier: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", {
        planTier,
        billingInterval: isYearly ? "yearly" : "monthly",
        promoCode: appliedPromo ? promoCode : undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast({
          title: "Subscription Updated",
          description: "Your subscription has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoadingPlan(null);
    },
  });

  const handleSelectPlan = async (planTier: string) => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }

    if (user?.subscriptionTier === planTier) {
      toast({
        title: "Already Subscribed",
        description: `You are already on the ${planTier} plan.`,
      });
      return;
    }

    setLoadingPlan(planTier);
    createSubscriptionMutation.mutate(planTier);
  };

  const applyPromoCode = (planTier: string) => {
    if (!promoCode.trim()) {
      toast({
        title: "Enter Promo Code",
        description: "Please enter a promotional code.",
        variant: "destructive",
      });
      return;
    }
    applyPromoMutation.mutate({ code: promoCode.toUpperCase(), tier: planTier });
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    if (plan.monthlyPrice === 0) return "Free";
    
    let price = isYearly ? (plan.yearlyPrice || plan.monthlyPrice * 12) : plan.monthlyPrice;
    
    // Apply promotional discount if applicable
    if (appliedPromo && appliedPromo.discountedPrice && plan.tier !== "free") {
      price = appliedPromo.discountedPrice;
    }
    
    const amount = (price / 100).toFixed(2);
    const period = isYearly ? "/year" : "/month";
    return `$${amount}${period}`;
  };

  const getOriginalPrice = (plan: SubscriptionPlan) => {
    if (plan.monthlyPrice === 0) return null;
    const price = isYearly ? (plan.yearlyPrice || plan.monthlyPrice * 12) : plan.monthlyPrice;
    const amount = (price / 100).toFixed(2);
    const period = isYearly ? "/year" : "/month";
    return `$${amount}${period}`;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (!plan.yearlyPrice || plan.monthlyPrice === 0) return null;
    const yearlyMonthly = plan.yearlyPrice / 12;
    const monthlySavings = plan.monthlyPrice - yearlyMonthly;
    const percentSavings = Math.round((monthlySavings / plan.monthlyPrice) * 100);
    return percentSavings;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-16 pt-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Trading Strategy Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Unlock advanced crypto trading insights with real-time signals and analytics
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">
                Save up to 20%
              </Badge>
            )}
          </div>

          {/* Promotional Code Section */}
          <div className="max-w-md mx-auto mb-8">
            <div className="text-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPromoInput(!showPromoInput)}
              >
                Have a promo code?
              </Button>
            </div>
            
            {showPromoInput && (
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                />
                <Button
                  onClick={() => plans.length > 0 && applyPromoCode(plans[1].tier)}
                  disabled={applyPromoMutation.isPending || !promoCode.trim()}
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            )}
            
            {appliedPromo && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  🎉 Promo code applied! You save {formatCurrency(appliedPromo.savings)}
                </div>
              </div>
            )}
            
            {/* Sample Promo Codes for Demo */}
            <div className="mt-4 text-center">
              <div className="text-xs text-muted-foreground mb-2">Try these demo codes:</div>
              <div className="flex justify-center space-x-2 text-xs">
                <Badge variant="outline" className="cursor-pointer" onClick={() => setPromoCode("WELCOME20")}>
                  WELCOME20
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setPromoCode("CRYPTO50")}>
                  CRYPTO50
                </Badge>
                <Badge variant="outline" className="cursor-pointer" onClick={() => setPromoCode("FIRST30")}>
                  FIRST30
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = user?.subscriptionTier === plan.tier;
            const isPopular = plan.tier === "premium";
            const savings = getSavings(plan);
            
            return (
              <Card key={plan.id} className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="capitalize">{plan.tier} tier</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{formatPrice(plan)}</span>
                    {isYearly && savings && plan.monthlyPrice > 0 && (
                      <div className="text-sm text-green-600 mt-1">
                        Save {savings}% annually
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    
                    {plan.maxSignals && plan.maxSignals > 0 && (
                      <li className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">
                          {plan.maxSignals === -1 ? "Unlimited" : plan.maxSignals} signals per month
                        </span>
                      </li>
                    )}
                    
                    {plan.maxTickers && plan.maxTickers > 0 && (
                      <li className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">
                          {plan.maxTickers === -1 ? "Unlimited" : plan.maxTickers} trading pairs
                        </span>
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "secondary" : isPopular ? "default" : "outline"}
                    disabled={isCurrentPlan || loadingPlan === plan.tier}
                    onClick={() => handleSelectPlan(plan.tier)}
                  >
                    {loadingPlan === plan.tier ? (
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {plan.monthlyPrice === 0 ? "Get Started" : "Subscribe"}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
          <div className="max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-6">Features</th>
                    <th className="text-center py-4 px-6">Free</th>
                    <th className="text-center py-4 px-6">Basic</th>
                    <th className="text-center py-4 px-6 bg-primary/5">Premium</th>
                    <th className="text-center py-4 px-6">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 px-6">Trading Signals</td>
                    <td className="text-center py-4 px-6">10/month</td>
                    <td className="text-center py-4 px-6">100/month</td>
                    <td className="text-center py-4 px-6 bg-primary/5">500/month</td>
                    <td className="text-center py-4 px-6">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Trading Pairs</td>
                    <td className="text-center py-4 px-6">3</td>
                    <td className="text-center py-4 px-6">10</td>
                    <td className="text-center py-4 px-6 bg-primary/5">25</td>
                    <td className="text-center py-4 px-6">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Real-time Charts</td>
                    <td className="text-center py-4 px-6">Basic</td>
                    <td className="text-center py-4 px-6">✓</td>
                    <td className="text-center py-4 px-6 bg-primary/5">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Email Alerts</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6">✓</td>
                    <td className="text-center py-4 px-6 bg-primary/5">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">SMS Alerts</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-primary/5">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Heatmap Analysis</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-primary/5">✓</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-6">Forecasting</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-primary/5">-</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6">API Access</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6">-</td>
                    <td className="text-center py-4 px-6 bg-primary/5">-</td>
                    <td className="text-center py-4 px-6">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}