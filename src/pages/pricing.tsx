import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  notIncluded?: string[];
  popular?: boolean;
  ctaText: string;
  tier: 'basic' | 'pro' | 'elite';
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49,
    yearlyPrice: 490,
    description: 'Perfect for individual traders getting started',
    features: [
      'Real-time price data',
      'Basic trading signals',
      'Email notifications',
      'Up to 3 watchlist items',
      'Mobile app access',
      'Community support'
    ],
    notIncluded: [
      'Advanced analytics',
      'SMS notifications',
      'Priority support'
    ],
    ctaText: 'Start Basic Plan',
    tier: 'basic'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    yearlyPrice: 990,
    description: 'Advanced features for serious traders',
    features: [
      'Everything in Basic',
      'Advanced trading signals',
      'SMS & Email notifications',
      'Up to 10 watchlist items',
      'Advanced analytics dashboard',
      'Technical indicators',
      'Priority support',
      'API access'
    ],
    notIncluded: [
      'Custom indicators',
      'Dedicated account manager'
    ],
    popular: true,
    ctaText: 'Choose Pro Plan',
    tier: 'pro'
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 199,
    yearlyPrice: 1990,
    description: 'Complete solution for professional traders',
    features: [
      'Everything in Pro',
      'Unlimited watchlist items',
      'Custom trading indicators',
      'Telegram notifications',
      'Advanced cycle forecasting',
      '200-week heatmap analysis',
      'Portfolio management tools',
      'Dedicated account manager',
      'White-label options',
      '24/7 priority support'
    ],
    ctaText: 'Go Elite',
    tier: 'elite'
  }
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStripeCheckout = async (plan: PricingPlan) => {
    try {
      setLoading(plan.id);
      const response = await apiRequest("POST", "/api/create-subscription", {
        planTier: plan.tier,
        billingInterval: isAnnual ? "yearly" : "monthly"
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to start payment process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handlePayPalCheckout = async (plan: PricingPlan) => {
    try {
      setLoading(`${plan.id}-paypal`);
      const amount = isAnnual ? plan.yearlyPrice : plan.price;
      
      // For PayPal, we'll redirect to a checkout page with PayPal integration
      const paypalUrl = `/checkout-paypal?plan=${plan.tier}&amount=${amount}&billing=${isAnnual ? 'yearly' : 'monthly'}`;
      window.location.href = paypalUrl;
    } catch (error) {
      console.error('PayPal checkout error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to start PayPal checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getSavingsPercentage = (monthly: number, yearly: number) => {
    return Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950">
      <Navigation />
      <div className="py-20">
        <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Choose Your Trading Plan
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Unlock powerful crypto trading insights with our comprehensive analytics platform
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-orange-400' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                isAnnual ? 'bg-orange-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-orange-400' : 'text-slate-400'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="ml-2">Save up to 20%</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative transition-all duration-300 hover:scale-105 bg-slate-800/60 border-slate-600/40 ${
                plan.popular 
                  ? 'border-2 border-orange-500/60 shadow-2xl ring-2 ring-orange-500 ring-opacity-50' 
                  : 'hover:shadow-xl hover:border-slate-500/60'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-extrabold text-white">
                      ${isAnnual ? plan.yearlyPrice : plan.price}
                    </span>
                    <span className="text-slate-400 ml-1">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <div className="text-sm text-green-600 font-medium mt-2">
                      Save {getSavingsPercentage(plan.price, plan.yearlyPrice)}% annually
                    </div>
                  )}
                </div>
                <p className="text-slate-300 mt-4">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="pb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-200">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded && plan.notIncluded.map((feature, index) => (
                    <li key={`not-${index}`} className="flex items-start">
                      <X className="h-5 w-5 text-slate-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6 flex flex-col gap-3">
                <Button
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  onClick={() => handleStripeCheckout(plan)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    plan.ctaText + ' - Stripe'
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handlePayPalCheckout(plan)}
                  disabled={loading === `${plan.id}-paypal`}
                >
                  {loading === `${plan.id}-paypal` ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Pay with PayPal'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Frequently Asked Questions</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Can I change plans anytime?</h3>
              <p className="text-slate-300">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Do you offer refunds?</h3>
              <p className="text-slate-300">
                We offer a 30-day money-back guarantee on all plans. No questions asked.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Is my data secure?</h3>
              <p className="text-slate-300">
                Absolutely. We use enterprise-grade security and never share your trading data.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">What payment methods do you accept?</h3>
              <p className="text-slate-300">
                We accept all major credit cards through Stripe and PayPal payments.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400 mb-4">Trusted by traders worldwide</p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <div className="text-xs">🔒 SSL Secured</div>
            <div className="text-xs">💳 Stripe Certified</div>
            <div className="text-xs">🛡️ SOC 2 Compliant</div>
            <div className="text-xs">📱 Mobile Ready</div>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}