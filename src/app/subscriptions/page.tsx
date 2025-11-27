'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SUBSCRIPTION_PLANS, YEARLY_PLANS, PREMIUM_FEATURES, getFeatureById } from '@/lib/subscriptions';
import { formatCurrencyGHS } from '@/lib/utils';
import { Check, Zap, Star, Crown, TrendingUp, Shield } from 'lucide-react';

export default function SubscriptionsPage() {
  const { data: session } = useSession();
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');
  const [loading, setLoading] = useState(false);

  const plans = interval === 'YEARLY' ? YEARLY_PLANS : SUBSCRIPTION_PLANS;

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      window.location.href = '/login?callbackUrl=/subscriptions';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'BASIC':
        return <Zap className="w-8 h-8" />;
      case 'PREMIUM':
        return <Star className="w-8 h-8" />;
      case 'ENTERPRISE':
        return <Crown className="w-8 h-8" />;
      default:
        return <Shield className="w-8 h-8" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="success" className="mb-4 px-4 py-2 text-sm font-semibold bg-white/20 backdrop-blur-sm border-white/30">
              🚀 Premium Features Available
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              Unlock Premium Features
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Take your vehicle and property management to the next level with our premium subscriptions
            </p>
            
            {/* Interval Toggle */}
            <div className="inline-flex items-center glass rounded-full p-1.5 space-x-2">
              <button
                onClick={() => setInterval('MONTHLY')}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ${
                  interval === 'MONTHLY'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white hover:text-white/90'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('YEARLY')}
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-300 ${
                  interval === 'YEARLY'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white hover:text-white/90'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-400 text-green-900 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Icons Animation */}
        <div className="absolute top-20 left-10 opacity-20 float">
          <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm"></div>
        </div>
        <div className="absolute bottom-20 right-20 opacity-20 float" style={{ animationDelay: '1s' }}>
          <div className="w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm"></div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative ${plan.popular ? 'lg:scale-110 lg:z-10' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                  <Badge variant="success" className="premium-badge text-white shadow-lg">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <Card
                className={`h-full glossy-card hover-lift ${
                  plan.popular ? 'premium-card' : ''
                } transition-all duration-300`}
              >
                <div className={`p-6 ${plan.popular ? 'text-white' : ''}`}>
                  {/* Plan Icon */}
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                      plan.popular
                        ? 'bg-white/20 text-white'
                        : 'bg-gradient-to-br ' + plan.gradient + ' text-white'
                    }`}
                  >
                    {getPlanIcon(plan.id)}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">{formatCurrencyGHS(plan.price)}</span>
                      <span className={`ml-2 ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                        /{interval === 'YEARLY' ? 'year' : 'month'}
                      </span>
                    </div>
                    {interval === 'YEARLY' && plan.price > 0 && (
                      <p className={`text-sm mt-1 ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>
                        {formatCurrencyGHS(Math.round((plan.price / 12) * 100) / 100)}/month billed annually
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => {
                      const featureDetail = getFeatureById(feature);
                      const displayText = featureDetail?.name || feature;
                      
                      return (
                        <li key={idx} className="flex items-start">
                          <Check
                            className={`w-5 h-5 mr-2 flex-shrink-0 ${
                              plan.popular ? 'text-white' : 'text-green-500'
                            }`}
                          />
                          <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-gray-600'}`}>
                            {displayText}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading || plan.id === 'FREE'}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-white text-purple-600 hover:bg-gray-100'
                        : 'btn-glossy'
                    }`}
                  >
                    {plan.id === 'FREE' ? 'Current Plan' : 'Get Started'}
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Features Showcase */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">Premium Features</h2>
          <p className="text-xl text-gray-600">Everything you need to manage your vehicles and properties</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.values(PREMIUM_FEATURES)
            .filter((f) => f.category === 'automotive')
            .slice(0, 6)
            .map((feature, index) => (
              <div
                key={feature.id}
                className="metric-card hover-lift bg-white rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{feature.name}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Ready to Upgrade?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of satisfied customers who have upgraded to premium
          </p>
          <Button
            onClick={() => handleSubscribe('PREMIUM')}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl"
          >
            Start Your Premium Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
