/**
 * Subscription Gate Utilities
 * Functions to check user subscription status and feature access
 */

import { prisma } from '@/lib/prisma';
import { PREMIUM_FEATURES, SubscriptionFeature } from '@/lib/subscriptions';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  plan: string;
  features: string[];
  expiresAt: Date | null;
}

/**
 * Check if user has an active subscription
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionStatus | null> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!subscription) {
      return {
        hasActiveSubscription: false,
        plan: 'FREE',
        features: [],
        expiresAt: null,
      };
    }

    return {
      hasActiveSubscription: true,
      plan: subscription.plan,
      features: subscription.features || [],
      expiresAt: subscription.endDate,
    };
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific premium feature
 */
export async function hasFeatureAccess(
  userId: string,
  featureId: keyof typeof PREMIUM_FEATURES
): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  // Free plan has no premium features
  if (subscription.plan === 'FREE') {
    return false;
  }

  // Check if feature is in user's subscription features
  return subscription.features.includes(featureId);
}

/**
 * Get all accessible features for a user
 */
export async function getUserFeatures(userId: string): Promise<SubscriptionFeature[]> {
  const subscription = await getUserSubscription(userId);

  if (!subscription || !subscription.hasActiveSubscription) {
    return [];
  }

  // Map feature IDs to feature objects
  const accessibleFeatures = subscription.features
    .map((featureId) => PREMIUM_FEATURES[featureId as keyof typeof PREMIUM_FEATURES])
    .filter(Boolean);

  return accessibleFeatures;
}

/**
 * Check if subscription is expiring soon (within 7 days)
 */
export function isSubscriptionExpiringSoon(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;

  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
}

/**
 * Check multiple features at once
 */
export async function checkMultipleFeatures(
  userId: string,
  featureIds: (keyof typeof PREMIUM_FEATURES)[]
): Promise<Record<string, boolean>> {
  const subscription = await getUserSubscription(userId);

  if (!subscription || !subscription.hasActiveSubscription) {
    return featureIds.reduce((acc, featureId) => {
      acc[featureId] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }

  return featureIds.reduce((acc, featureId) => {
    acc[featureId] = subscription.features.includes(featureId);
    return acc;
  }, {} as Record<string, boolean>);
}

/**
 * Get feature access error message
 */
export function getFeatureAccessError(featureId: keyof typeof PREMIUM_FEATURES): {
  message: string;
  requiredPlan: string;
} {
  const feature = PREMIUM_FEATURES[featureId];

  if (!feature) {
    return {
      message: 'This feature is not available.',
      requiredPlan: 'PREMIUM',
    };
  }

  return {
    message: `${feature.name} is a premium feature. Please upgrade your subscription to access it.`,
    requiredPlan: feature.category === 'automotive' ? 'PREMIUM' : 'BASIC',
  };
}

/**
 * Subscription gate for API routes
 * Returns null if access granted, error response if access denied
 */
export async function requireFeatureAccess(
  userId: string,
  featureId: keyof typeof PREMIUM_FEATURES
): Promise<{ error: string; requiredPlan: string } | null> {
  const hasAccess = await hasFeatureAccess(userId, featureId);

  if (!hasAccess) {
    const errorData = getFeatureAccessError(featureId);
    return { error: errorData.message, requiredPlan: errorData.requiredPlan };
  }

  return null;
}
