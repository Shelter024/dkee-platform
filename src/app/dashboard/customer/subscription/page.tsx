'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Crown, Building2, Loader2 } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  icon: any;
  popular?: boolean;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    description: 'Essential features for individual users',
    monthlyPrice: 50,
    yearlyPrice: 500,
    icon: Zap,
    features: [
      'Basic Analytics',
      'Email Support',
      '1 Vehicle',
      'Service History',
      'Invoice Management',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    description: 'Advanced features for power users',
    monthlyPrice: 150,
    yearlyPrice: 1500,
    icon: Crown,
    popular: true,
    features: [
      'All Basic Features',
      'Service Reminders',
      'GPS Vehicle Tracking',
      'Priority Support',
      'Advanced Analytics',
      'Up to 5 Vehicles',
      'Custom Notifications',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Complete solution for businesses',
    monthlyPrice: 300,
    yearlyPrice: 3000,
    icon: Building2,
    features: [
      'All Premium Features',
      'Unlimited Vehicles',
      'Dedicated Support',
      'API Access',
      'Custom Integrations',
      'White Label Options',
      'Team Management',
      'Priority Processing',
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [loading, setLoading] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [pricingData, setPricingData] = useState<any>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscriptions/checkout');
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data.currentSubscription);
        setPricingData(data.pricing);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          interval,
        }),
      });

      const data = await response.json();

      if (data.authorizationUrl) {
        // Redirect to Paystack payment page
        window.location.href = data.authorizationUrl;
      } else if (data.success) {
        // Test mode - subscription created directly
        alert('Test subscription created successfully!');
        router.push('/dashboard/customer');
        router.refresh();
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return interval === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const yearlyCost = plan.yearlyPrice;
    return monthlyCost - yearlyCost;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Select the perfect subscription for your needs
          </p>

          {/* Interval Toggle */}
          <div className="inline-flex items-center gap-4 bg-white rounded-full p-2 shadow-lg">
            <button
              onClick={() => setInterval('MONTHLY')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                interval === 'MONTHLY'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('YEARLY')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                interval === 'YEARLY'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Current Subscription Banner */}
        {currentSubscription && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-900">
              <strong>Current Plan:</strong> {currentSubscription.plan} (
              {currentSubscription.interval})
              <span className="ml-4 text-sm text-blue-600">
                Valid until {new Date(currentSubscription.endDate).toLocaleDateString()}
              </span>
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = getPrice(plan);
            const isCurrentPlan = currentSubscription?.plan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-blue-500' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                {/* Card Content */}
                <div className="p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">
                        GH₵{price}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{interval === 'MONTHLY' ? 'month' : 'year'}
                      </span>
                    </div>
                    {interval === 'YEARLY' && (
                      <p className="text-sm text-green-600 mt-2">
                        Save GH₵{getSavings(plan)} per year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading !== null || isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      isCurrentPlan
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </span>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : currentSubscription ? (
                      'Upgrade'
                    ) : (
                      'Get Started'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Have Questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Contact our support team for help choosing the right plan
          </p>
          <button
            onClick={() => router.push('/contact')}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
