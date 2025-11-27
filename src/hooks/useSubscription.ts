'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface SubscriptionData {
  hasActiveSubscription: boolean;
  plan: string;
  features: string[];
  expiresAt: string | null;
  isExpiringSoon?: boolean;
}

export function useSubscription() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        const response = await fetch('/api/subscriptions/subscribe');
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        const data = await response.json();
        setSubscription(data.subscription || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [session?.user?.id]);

  const hasFeature = (featureId: string): boolean => {
    if (!subscription || !subscription.hasActiveSubscription) {
      return false;
    }
    return subscription.features.includes(featureId);
  };

  const isPremium = (): boolean => {
    return subscription?.plan === 'PREMIUM' || subscription?.plan === 'ENTERPRISE';
  };

  const isEnterprise = (): boolean => {
    return subscription?.plan === 'ENTERPRISE';
  };

  const canAccessFeature = (featureId: string): {
    hasAccess: boolean;
    reason?: string;
  } => {
    if (!subscription) {
      return {
        hasAccess: false,
        reason: 'No active subscription',
      };
    }

    if (!subscription.hasActiveSubscription) {
      return {
        hasAccess: false,
        reason: 'Subscription expired',
      };
    }

    if (!subscription.features.includes(featureId)) {
      return {
        hasAccess: false,
        reason: `This feature requires a higher tier subscription`,
      };
    }

    return { hasAccess: true };
  };

  return {
    subscription,
    loading,
    error,
    hasFeature,
    isPremium,
    isEnterprise,
    canAccessFeature,
  };
}
