'use client';

import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Lock, Sparkles, Crown, Zap } from 'lucide-react';

interface FeatureGateProps {
  featureId: string;
  featureName?: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * FeatureGate Component
 * Wraps premium features and shows upgrade prompt for users without access
 */
export function FeatureGate({
  featureId,
  featureName,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { loading, canAccessFeature } = useSubscription();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const { hasAccess, reason } = canAccessFeature(featureId);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className="premium-card relative overflow-hidden">
      <CardBody className="p-10 text-center relative z-10">
        <div className="mx-auto mb-6 w-16 h-16 rounded-xl premium-gradient-banner flex items-center justify-center shadow-lg">
          <Lock className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-2xl font-semibold mb-2 gradient-text tracking-tight">Premium Feature</h3>
        <p className="font-medium text-[var(--color-text)] mb-2 text-base">
          {featureName || 'This feature'} is locked
        </p>
        <p className="text-[var(--color-text-muted)] mb-6 max-w-xl mx-auto">
          {reason || 'Upgrade to unlock advanced capabilities, enhanced analytics and priority support.'}
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 flex items-center justify-center text-xs font-medium text-[var(--color-text)]">
            <Zap className="w-4 h-4 text-[var(--color-primary)] mr-2" /> Real-time updates
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 flex items-center justify-center text-xs font-medium text-[var(--color-text)]">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)] mr-2" /> Advanced analytics
          </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 flex items-center justify-center text-xs font-medium text-[var(--color-text)]">
            <Crown className="w-4 h-4 text-[var(--color-primary)] mr-2" /> Priority support
          </div>
        </div>

        <Link href="/subscriptions" className="inline-block">
          <Button variant="accent" className="px-8 py-3 text-base font-semibold rounded-xl">
            <Crown className="w-5 h-5 mr-2" /> Upgrade to Premium
          </Button>
        </Link>
        <p className="text-xs text-[var(--color-text-muted)] mt-5">
          Starting from GH₵15/month · Cancel anytime
        </p>
      </CardBody>
    </Card>
  );
}

/**
 * Inline Feature Badge
 * Shows a small premium badge next to feature names
 */
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold ${className}`}>
      <Crown className="w-3 h-3 mr-1" />
      PREMIUM
    </span>
  );
}

/**
 * Feature Lock Icon
 * Shows a lock icon for locked features
 */
export function FeatureLockIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <Lock className="w-4 h-4 text-gray-400" />
    </div>
  );
}
