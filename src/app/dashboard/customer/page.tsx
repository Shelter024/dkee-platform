'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Car,
  Building2,
  AlertCircle,
  MessageSquare,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { generateVehicleCoverBase64 } from '@/lib/vehicle-image';
import { buildVehiclePhotoUrl, buildVehicleUnsplashUrl } from '@/lib/vehicle-photo';

export default function CustomerDashboard() {
  const [cover, setCover] = useState<string | null>(null);
  const [vehicleLabel, setVehicleLabel] = useState<string>('');
  const [fallbacks, setFallbacks] = useState<string[]>([]);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicle() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch('/api/customers/me', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        const v = data.customer?.vehicles?.[0];
        if (v) {
          setVehicleLabel(`${v.make} ${v.model}`);
          // Build layered fallbacks: Cloudinary fetch -> Unsplash direct -> SVG silhouette
          const cloud = buildVehiclePhotoUrl({ make: v.make, model: v.model, year: v.year, color: v.color });
          const unsplash = buildVehicleUnsplashUrl({ make: v.make, model: v.model, year: v.year, color: v.color });
          const svg = generateVehicleCoverBase64({ make: v.make, model: v.model, year: v.year, color: v.color });
          setFallbacks([cloud, unsplash, svg]);
          setFallbackIndex(0);
          setCover(cloud);
        }
      } catch (e) {
        // silent fail or timeout
      } finally {
        setLoading(false);
      }
    }
    fetchVehicle();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Cover Section */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white">
          {loading ? (
            <div className="h-64 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 animate-pulse" />
          ) : cover ? (
            <img
              src={cover}
              key={cover}
              alt={vehicleLabel}
              referrerPolicy="no-referrer"
              className="w-full h-64 object-cover"
              onError={() => {
                // Advance to next fallback if available
                const nextIndex = Math.min(fallbackIndex + 1, fallbacks.length - 1);
                if (nextIndex !== fallbackIndex) {
                  setFallbackIndex(nextIndex);
                setCover(fallbacks[nextIndex]);
              }
            }}
          />
        ) : (
          <div className="h-64 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex flex-col justify-end p-8">
          <h2 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">Welcome Back! 👋</h2>
          {vehicleLabel && (
            <p className="text-white/95 text-lg font-medium drop-shadow-md">Your first vehicle: {vehicleLabel}</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Your Statistics
          <span className="ml-3 text-lg font-normal text-gray-500">📈 Live metrics</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
          <Card className="bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300 group">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Active Services</p>
                  <p className="text-5xl font-bold">3</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl group-hover:rotate-12 transition-transform">
                  <Car className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-rose-400 via-red-500 to-pink-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300 group">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Properties Viewing</p>
                  <p className="text-5xl font-bold">5</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl group-hover:rotate-12 transition-transform">
                  <Building2 className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300 group">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Unread Messages</p>
                  <p className="text-5xl font-bold">2</p>
                </div>
                <div className="bg-white/20 p-4 rounded-xl group-hover:rotate-12 transition-transform">
                  <MessageSquare className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

        <Card className="glossy-card metric-card hover-lift group">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Invoices</p>
                <p className="text-3xl font-bold gradient-text shimmer">1</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardBody>
        </Card>
        </div>
      </div>

      {/* Recent Services */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          <span className="gradient-text">Your Services</span>
          <span className="ml-3 text-sm font-normal text-gray-500">🔧 Service history</span>
        </h2>
        <Card className="glossy-card hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold gradient-text">Recent Services</h3>
            <Link href="/dashboard/customer/services">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-brand-navy-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-brand-navy-600" />
                </div>
                <div>
                  <p className="font-medium">Regular Maintenance Service</p>
                  <p className="text-sm text-gray-600">Toyota Camry - LAG-123-AB</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="success">Completed</Badge>
                <p className="text-sm text-gray-600 mt-1">2 days ago</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Brake System Inspection</p>
                  <p className="text-sm text-gray-600">Toyota Camry - LAG-123-AB</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="info">In Progress</Badge>
                <p className="text-sm text-gray-600 mt-1">Started today</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">Vehicle Tracking Device Installation</p>
                  <p className="text-sm text-gray-600">Toyota Camry - LAG-123-AB</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="warning">Pending</Badge>
                <p className="text-sm text-gray-600 mt-1">Scheduled tomorrow</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          <span className="gradient-text">Quick Actions</span>
          <span className="ml-3 text-sm font-normal text-gray-500">⚡ One-click access</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-stagger">
        {/* Premium Subscription CTA */}
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-300 md:col-span-4">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-xl">Upgrade to Premium</h3>
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-gray-700 text-sm">
                    Unlock vehicle tracking, service reminders, priority support, and more premium features
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                    <span>✓ Real-time tracking</span>
                    <span>✓ Automated reminders</span>
                    <span>✓ Advanced analytics</span>
                    <span>✓ Priority service</span>
                  </div>
                </div>
              </div>
              <Link href="/subscriptions">
                <Button variant="primary" className="btn-glossy text-lg px-8">
                  <Crown className="w-5 h-5 mr-2" />
                  View Plans
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 hover-lift transition-all duration-300">
          <CardBody>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Emergency Request</h3>
                <p className="text-sm text-gray-600">Need urgent assistance?</p>
              </div>
            </div>
            <Link href="/dashboard/customer/emergency" className="mt-4 block">
              <Button variant="danger" className="w-full">
                Request Help
              </Button>
            </Link>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover-lift transition-all duration-300">
          <CardBody>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Book Service</h3>
                <p className="text-sm text-gray-600">Schedule a new service</p>
              </div>
            </div>
            <Link href="/dashboard/customer/services" className="mt-4 block">
              <Button variant="primary" className="w-full">
                Book Now
              </Button>
            </Link>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 hover-lift transition-all duration-300">
          <CardBody>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Browse Properties</h3>
                <p className="text-sm text-gray-600">Find your ideal property</p>
              </div>
            </div>
            <Link href="/dashboard/customer/properties" className="mt-4 block">
              <Button variant="secondary" className="w-full">
                View Properties
              </Button>
            </Link>
          </CardBody>
        </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
