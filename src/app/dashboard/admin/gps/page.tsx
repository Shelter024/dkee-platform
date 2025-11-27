'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Navigation, Activity, AlertCircle, Eye, Radio } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  trackingDevice: boolean;
  customer: {
    user: {
      name: string;
      phone: string;
    };
  };
}

export default function GpsTrackingPage() {
  const { data: session } = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tracked' | 'untracked'>('tracked');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filter === 'tracked') return v.trackingDevice;
    if (filter === 'untracked') return !v.trackingDevice;
    return true;
  });

  const trackedCount = vehicles.filter((v) => v.trackingDevice).length;
  const untrackedCount = vehicles.filter((v) => !v.trackingDevice).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-8 h-8" />
          Vehicle Tracking
        </h1>
        <p className="text-gray-600 mt-1">Vehicle tracking and monitoring system</p>
      </div>

      {/* Integration Notice */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              Third-Party GPS Integration Point
            </h3>
            <p className="text-blue-800 mb-4">
              This interface is ready to integrate with your vehicle tracking provider. Connect your
              tracking system API to display real-time vehicle locations, movement history, and
              alerts.
            </p>
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">Recommended providers:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>GPS Gate</li>
                <li>Traccar</li>
                <li>Geotab</li>
                <li>Fleet Complete</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Vehicles</p>
              <p className="text-3xl font-bold text-gray-900">{vehicles.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Navigation className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tracked Vehicles</p>
              <p className="text-3xl font-bold text-green-600">{trackedCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Untracked Vehicles</p>
              <p className="text-3xl font-bold text-gray-600">{untrackedCount}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Radio className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="p-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
          >
            All ({vehicles.length})
          </Button>
          <Button
            onClick={() => setFilter('tracked')}
            variant={filter === 'tracked' ? 'primary' : 'outline'}
            size="sm"
          >
            Tracked ({trackedCount})
          </Button>
          <Button
            onClick={() => setFilter('untracked')}
            variant={filter === 'untracked' ? 'primary' : 'outline'}
            size="sm"
          >
            Untracked ({untrackedCount})
          </Button>
        </div>
      </Card>

      {/* Vehicles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No vehicles found</p>
          </Card>
        ) : (
          filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-600">{vehicle.year}</p>
                  <p className="text-sm font-mono text-gray-700 mt-1">{vehicle.plateNumber}</p>
                </div>
                <Badge variant={vehicle.trackingDevice ? 'success' : 'secondary'}>
                  {vehicle.trackingDevice ? (
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Tracked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      Untracked
                    </span>
                  )}
                </Badge>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="text-sm">
                  <p className="text-gray-600">Owner</p>
                  <p className="font-medium">{vehicle.customer.user.name}</p>
                  <p className="text-gray-600">{vehicle.customer.user.phone}</p>
                </div>

                {vehicle.trackingDevice && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">GPS Status</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Update:</span>
                        <span className="font-medium text-gray-400">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium text-gray-400">Awaiting API</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant="warning" className="text-xs">
                          Pending Integration
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-1"
                  onClick={() => (window.location.href = `/dashboard/admin/vehicles/${vehicle.id}`)}
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                {vehicle.trackingDevice && (
                  <Button
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    disabled
                  >
                    <MapPin className="w-4 h-4" />
                    Track
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Footer Note */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">Integration Instructions</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            To enable live vehicle tracking, configure your tracking provider's API credentials in the
            system settings. The following endpoints need to be connected:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Real-time location updates</li>
            <li>Historical route data</li>
            <li>Geofencing and alerts</li>
            <li>Speed and diagnostic monitoring</li>
          </ul>
          <p className="mt-4 font-medium">
            Contact your system administrator to complete the GPS integration.
          </p>
        </div>
      </Card>
    </div>
  );
}
