// Premium subscription features and pricing configuration

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'automotive' | 'property' | 'both';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'MONTHLY' | 'YEARLY';
  features: string[];
  popular?: boolean;
  color: string;
  gradient: string;
}

// Premium Features
export const PREMIUM_FEATURES: Record<string, SubscriptionFeature> = {
  // Automotive Features
  OIL_SERVICE_REMINDER: {
    id: 'OIL_SERVICE_REMINDER',
    name: 'Oil Service Reminders',
    description: 'Automatic reminders for oil changes based on mileage and time',
    icon: '🛢️',
    category: 'automotive',
  },
  VEHICLE_TRACKING: {
    id: 'VEHICLE_TRACKING',
    name: 'Real-Time Vehicle Tracking',
    description: 'Track your vehicle location in real-time with history',
    icon: '📍',
    category: 'automotive',
  },
  MAINTENANCE_SCHEDULE: {
    id: 'MAINTENANCE_SCHEDULE',
    name: 'Maintenance Scheduler',
    description: 'Smart scheduling for all vehicle maintenance services',
    icon: '📅',
    category: 'automotive',
  },
  TIRE_ROTATION_REMINDER: {
    id: 'TIRE_ROTATION_REMINDER',
    name: 'Tire Rotation Alerts',
    description: 'Never miss tire rotation intervals',
    icon: '🔄',
    category: 'automotive',
  },
  BRAKE_CHECK_REMINDER: {
    id: 'BRAKE_CHECK_REMINDER',
    name: 'Brake System Alerts',
    description: 'Safety reminders for brake inspections',
    icon: '🛑',
    category: 'automotive',
  },
  FUEL_EFFICIENCY: {
    id: 'FUEL_EFFICIENCY',
    name: 'Fuel Efficiency Tracking',
    description: 'Monitor and optimize your fuel consumption',
    icon: '⛽',
    category: 'automotive',
  },
  DIAGNOSTIC_REPORTS: {
    id: 'DIAGNOSTIC_REPORTS',
    name: 'Advanced Diagnostics',
    description: 'Detailed vehicle health reports and analytics',
    icon: '🔧',
    category: 'automotive',
  },
  PRIORITY_SERVICE: {
    id: 'PRIORITY_SERVICE',
    name: 'Priority Service Booking',
    description: 'Skip the queue with priority scheduling',
    icon: '⭐',
    category: 'automotive',
  },
  
  // Property Features
  PROPERTY_ALERTS: {
    id: 'PROPERTY_ALERTS',
    name: 'Property Market Alerts',
    description: 'Get notified of new properties matching your criteria',
    icon: '🏠',
    category: 'property',
  },
  VIRTUAL_TOURS: {
    id: 'VIRTUAL_TOURS',
    name: '3D Virtual Tours',
    description: 'Explore properties with immersive 3D tours',
    icon: '🎥',
    category: 'property',
  },
  MARKET_ANALYSIS: {
    id: 'MARKET_ANALYSIS',
    name: 'Market Analysis Reports',
    description: 'Comprehensive property market insights',
    icon: '📊',
    category: 'property',
  },
  PROPERTY_TRACKING: {
    id: 'PROPERTY_TRACKING',
    name: 'Property Portfolio Tracking',
    description: 'Monitor all your properties in one place',
    icon: '📈',
    category: 'property',
  },
  
  // Universal Features
  SMS_NOTIFICATIONS: {
    id: 'SMS_NOTIFICATIONS',
    name: 'SMS Notifications',
    description: 'Receive important updates via SMS',
    icon: '💬',
    category: 'both',
  },
  DEDICATED_SUPPORT: {
    id: 'DEDICATED_SUPPORT',
    name: 'Dedicated Support',
    description: '24/7 priority customer support',
    icon: '🎧',
    category: 'both',
  },
  ANALYTICS: {
    id: 'ANALYTICS',
    name: 'Advanced Analytics',
    description: 'Detailed insights and reports',
    icon: '📈',
    category: 'both',
  },
};

// Subscription Plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    interval: 'MONTHLY',
    features: [
      'Basic service requests',
      'Service history',
      'Invoice viewing',
      'Standard support',
    ],
    color: 'gray',
    gradient: 'from-gray-400 to-gray-600',
  },
  {
    id: 'BASIC',
    name: 'Basic',
    price: 15,
    interval: 'MONTHLY',
    features: [
      'OIL_SERVICE_REMINDER',
      'MAINTENANCE_SCHEDULE',
      'SMS_NOTIFICATIONS',
      'Email support',
    ],
    color: 'blue',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 35,
    interval: 'MONTHLY',
    popular: true,
    features: [
      'VEHICLE_TRACKING',
      'OIL_SERVICE_REMINDER',
      'TIRE_ROTATION_REMINDER',
      'BRAKE_CHECK_REMINDER',
      'MAINTENANCE_SCHEDULE',
      'FUEL_EFFICIENCY',
      'SMS_NOTIFICATIONS',
      'PRIORITY_SERVICE',
      'DEDICATED_SUPPORT',
    ],
    color: 'purple',
    gradient: 'from-purple-400 via-pink-500 to-red-500',
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 99,
    interval: 'MONTHLY',
    features: [
      'All Premium features',
      'DIAGNOSTIC_REPORTS',
      'PROPERTY_TRACKING',
      'MARKET_ANALYSIS',
      'VIRTUAL_TOURS',
      'ANALYTICS',
      'Custom integrations',
      'Dedicated account manager',
    ],
    color: 'gold',
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
  },
];

// Yearly plans (20% discount)
export const YEARLY_PLANS: SubscriptionPlan[] = SUBSCRIPTION_PLANS.map((plan) => ({
  ...plan,
  interval: 'YEARLY',
  price: plan.price > 0 ? Math.round(plan.price * 12 * 0.8) : 0,
}));

// Helper functions
export function getFeatureById(featureId: string): SubscriptionFeature | undefined {
  return PREMIUM_FEATURES[featureId];
}

export function getPlanFeatures(planId: string): SubscriptionFeature[] {
  const plan = [...SUBSCRIPTION_PLANS, ...YEARLY_PLANS].find((p) => p.id === planId);
  if (!plan) return [];
  
  return plan.features
    .map((featureId) => getFeatureById(featureId))
    .filter((f): f is SubscriptionFeature => f !== undefined);
}

export function hasFeature(features: string[], featureId: string): boolean {
  return features.includes(featureId);
}

export function getMonthlyPrice(plan: SubscriptionPlan): number {
  if (plan.interval === 'YEARLY') {
    return Math.round((plan.price / 12) * 100) / 100;
  }
  return plan.price;
}
