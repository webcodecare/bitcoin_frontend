import React, { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Check, CreditCard, Crown, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PaymentModal from '@/components/payments/PaymentModal';

// Define the subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tier: 'basic',
    monthlyPrice: 4900, // $49.00 in cents
    yearlyPrice: 47040, // $470.40 in cents (20% discount)
    description: 'Core indicators access',
    features: [
      'Core indicators access',
      'Weekly market updates',
      'Basic support',
      'Email alerts',
      'Up to 5 tickers'
    ],
    color: 'slate',
    icon: TrendingUp
  },
  {
    id: 'pro',
    name: 'Pro',
    tier: 'premium',
    monthlyPrice: 9900, // $99.00 in cents
    yearlyPrice: 95040, // $950.40 in cents (20% discount)
    description: 'All indicators & tools',
    features: [
      'All indicators & tools',
      'Real-time alerts',
      'Historical data access',
      'Priority support',
      'SMS & Telegram alerts',
      'Up to 25 tickers'
    ],
    color: 'orange',
    icon: BarChart3,
    popular: true
  },
  {
    id: 'elite',
    name: 'Elite',
    tier: 'pro',
    monthlyPrice: 19900, // $199.00 in cents
    yearlyPrice: 191040, // $1910.40 in cents (20% discount)
    description: 'Everything for professional trading',
    features: [
      'All Pro features',
      'API access',
      'Custom indicators',
      'Advanced forecasting',
      'White-label options',
      'Dedicated support',
      'Unlimited tickers'
    ],
    color: 'gold',
    icon: Crown
  }
];

function Pricing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = useCallback(async (planTier: string) => {
    // Prevent double clicks
    if (isProcessing) {
      console.log('Already processing, ignoring click');
      return;
    }

    if (!user) {
      // Redirect to auth page if not logged in
      console.log('Redirecting to auth - user not logged in');
      setLocation('/auth');
      return;
    }

    if (user.subscriptionTier === planTier) {
      toast({
        title: "Already Subscribed",
        description: `You are already on the ${planTier} plan.`,
        variant: "default",
      });
      return;
    }

    console.log(`Processing subscription for plan: ${planTier}`);
    setIsProcessing(true);

    try {
      const response = await apiRequest('POST', '/api/create-subscription', {
        planTier,
        billingInterval: 'monthly'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Subscription creation failed');
      }

      const data = await response.json();
      console.log('Subscription response:', data);

      if (data.url) {
        // Redirect to Stripe Checkout
        console.log('Redirecting to Stripe checkout:', data.url);
        window.location.href = data.url;
      } else {
        toast({
          title: "Success!",
          description: `Successfully upgraded to ${planTier} plan.`,
          variant: "default",
        });
        
        // Redirect to dashboard after success
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "An error occurred while processing your subscription.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, toast, setLocation]);

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const getYearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
    const yearlyCost = monthlyPrice * 12;
    const savings = yearlyCost - yearlyPrice;
    return Math.round((savings / yearlyCost) * 100);
  };

  return (
    <section id="pricing" className="py-20 bg-slate-900 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Choose Your Membership</h2>
          <p className="text-xl text-white/80">Professional tools for serious crypto traders</p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center mt-8">
            <div className="bg-slate-800/60 p-1 rounded-lg border border-slate-600/40">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'monthly'
                    ? 'bg-white text-gray-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'yearly'
                    ? 'bg-white text-gray-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Yearly (Save up to 20%)
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const isCurrentPlan = user?.subscriptionTier === plan.tier;
            const savings = billingInterval === 'yearly' ? getYearlySavings(plan.monthlyPrice, plan.yearlyPrice) : 0;

            return (
              <div 
                key={plan.id} 
                className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-8 border relative ${
                  plan.popular 
                    ? 'from-slate-800/60 to-slate-700/50 border-2 border-orange-500/60' 
                    : plan.color === 'gold'
                    ? 'from-slate-800/40 to-slate-700/60 border border-yellow-500/40'
                    : 'from-slate-800/50 to-slate-700/60 border border-slate-600/40'
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-center mb-4">
                  <Icon className={`w-8 h-8 mr-3 ${
                    plan.color === 'orange' ? 'text-orange-400' :
                    plan.color === 'gold' ? 'text-yellow-400' :
                    'text-slate-400'
                  }`} />
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  {isCurrentPlan && (
                    <Badge className="ml-2 bg-green-500 text-white">Current</Badge>
                  )}
                </div>
                
                <div className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-2 ${
                  plan.color === 'orange' ? 'from-orange-400 to-orange-500' :
                  plan.color === 'gold' ? 'from-yellow-400 to-yellow-500' :
                  'from-slate-400 to-blue-400'
                }`}>
                  ${formatPrice(price)}
                  <span className="text-lg text-white/60">/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
                </div>
                
                {billingInterval === 'yearly' && savings > 0 && (
                  <p className="text-sm text-green-400 mb-6">
                    Save {savings}% annually
                  </p>
                )}
                
                <p className="text-white/80 mb-6">{plan.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-white/80">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : (
                  <>
                    {!user ? (
                      <button 
                        type="button"
                        onClick={() => {
                          toast({
                            title: "Login Required",
                            description: "Please login to purchase a subscription",
                            variant: "default",
                          });
                          setTimeout(() => setLocation('/auth/login'), 500);
                        }}
                        className={`w-full py-3 rounded-full font-semibold transition-all ${
                          plan.color === 'orange' 
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' :
                          plan.color === 'gold'
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' :
                            'bg-gradient-to-r from-slate-500 to-blue-500 hover:from-blue-600 hover:to-cyan-600'
                        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        Login to Subscribe
                      </button>
                    ) : (
                      <PaymentModal
                        planName={plan.name}
                        planTier={plan.tier}
                        monthlyPrice={plan.monthlyPrice}
                        yearlyPrice={plan.yearlyPrice}
                        billingInterval={billingInterval}
                        onSuccess={() => {
                          toast({
                            title: "Subscription Successful!",
                            description: `Welcome to ${plan.name}!`,
                          });
                          setTimeout(() => setLocation('/dashboard'), 1500);
                        }}
                      >
                        <button 
                          type="button"
                          className={`w-full py-3 rounded-full font-semibold transition-all ${
                            plan.color === 'orange' 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' :
                            plan.color === 'gold'
                              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' :
                              'bg-gradient-to-r from-slate-500 to-blue-500 hover:from-blue-600 hover:to-cyan-600'
                          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Upgrade to {plan.name}
                        </button>
                      </PaymentModal>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-600/40">
            <h3 className="text-xl font-semibold text-white mb-4">Flexible Billing & Guarantees</h3>
            <p className="text-white/80 mb-6">
              All plans include a 14-day money-back guarantee. Cancel or change your plan at any time.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                Secure payment processing
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                No hidden fees
              </span>
              <span className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                Instant activation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Pricing