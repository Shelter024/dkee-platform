'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Navigation,
  Search,
  MapPin,
  Car,
  Gauge,
  Download,
  Activity,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface VehicleTracking {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  };
  location: {
    id: string;
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    address: string | null;
    timestamp: Date;
    batteryLevel: number | null;
    fuelLevel: number | null;
  } | null;
}

export default function AdminTrackingPage() {
  const [vehicles, setVehicles] = useState<VehicleTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackingData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchTrackingData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      // In real implementation, this would be an admin-specific endpoint
      const response = await fetch('/api/admin/tracking');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleStatus = (vehicle: VehicleTracking) => {
    if (!vehicle.location) return { status: 'offline', label: 'Offline', color: 'gray' };

    const timeSinceUpdate = Date.now() - new Date(vehicle.location.timestamp).getTime();
    const minutesSinceUpdate = timeSinceUpdate / (1000 * 60);

    if (minutesSinceUpdate > 30) {
      return { status: 'idle', label: 'Idle', color: 'yellow' };
    }

    const speed = vehicle.location.speed || 0;
    if (speed > 5) {
      return { status: 'moving', label: 'Moving', color: 'green' };
    } else if (speed > 0) {
      return { status: 'idling', label: 'Idling', color: 'yellow' };
    } else {
      return { status: 'parked', label: 'Parked', color: 'blue' };
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle.user.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    total: vehicles.length,
    active: vehicles.filter((v) => {
      const status = getVehicleStatus(v);
      return status.status === 'moving' || status.status === 'idling';
    }).length,
    moving: vehicles.filter((v) => getVehicleStatus(v).status === 'moving').length,
    parked: vehicles.filter((v) => getVehicleStatus(v).status === 'parked').length,
    offline: vehicles.filter((v) => getVehicleStatus(v).status === 'offline').length,
    averageSpeed: vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + (v.location?.speed || 0), 0) / vehicles.length
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="glossy-card hover-lift p-8 animated-gradient">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Navigation className="w-8 h-8 mr-3" />
              Vehicle Tracking Management
            </h1>
            <p className="text-white/90 text-lg">
              Monitor all customer vehicles in real-time
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="glass px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2 text-white">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">Live</span>
              </div>
            </div>
            <Button variant="secondary" className="btn-glossy">
              <Download className="w-5 h-5 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Vehicles</p>
                <p className="text-3xl font-bold gradient-text shimmer">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center neon-glow">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active</p>
                <p className="text-3xl font-bold gradient-text shimmer">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center neon-glow">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Moving</p>
                <p className="text-3xl font-bold gradient-text shimmer">{stats.moving}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center neon-glow">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Parked</p>
                <p className="text-3xl font-bold gradient-text shimmer">{stats.parked}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center neon-glow">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Offline</p>
                <p className="text-3xl font-bold gradient-text shimmer">{stats.offline}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center neon-glow">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Avg Speed</p>
                <p className="text-3xl font-bold gradient-text shimmer">
                  {Math.round(stats.averageSpeed)}
                </p>
                <p className="text-xs text-gray-600 font-semibold">km/h</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center neon-glow">
                <Gauge className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Card className="glossy-card hover-lift">
        <CardBody className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by customer, vehicle, or plate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardBody>
      </Card>

      {/* Vehicles Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          <span className="gradient-text">All Vehicles</span>
          <span className="ml-3 text-sm font-normal text-gray-500">
            {filteredVehicles.length} results
          </span>
        </h2>

        {loading ? (
          <Card className="glossy-card">
            <CardBody className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading tracking data...</p>
            </CardBody>
          </Card>
        ) : filteredVehicles.length === 0 ? (
          <Card className="glossy-card">
            <CardBody className="p-12 text-center">
              <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">No vehicles found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm ? 'Try adjusting your search' : 'No vehicles with tracking enabled'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVehicles.map((vehicleData) => {
              const statusInfo = getVehicleStatus(vehicleData);
              return (
                <Card key={vehicleData.vehicle.id} className="glossy-card hover-lift">
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            statusInfo.status === 'moving'
                              ? 'bg-green-500'
                              : statusInfo.status === 'parked'
                              ? 'bg-blue-500'
                              : statusInfo.status === 'idling'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                          } neon-glow`}
                        >
                          <Car className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold gradient-text mb-1">
                            {vehicleData.vehicle.make} {vehicleData.vehicle.model}
                          </h3>
                          <p className="text-sm text-gray-600 font-mono mb-2">
                            {vehicleData.vehicle.licensePlate}
                          </p>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={
                                statusInfo.color === 'green'
                                  ? 'success'
                                  : statusInfo.color === 'yellow'
                                  ? 'warning'
                                  : statusInfo.color === 'blue'
                                  ? 'info'
                                  : undefined
                              }
                              className={statusInfo.status === 'moving' ? 'animate-pulse' : ''}
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass p-3 rounded-lg mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-600 font-medium">Customer</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {vehicleData.vehicle.user.name}
                      </p>
                      <p className="text-xs text-gray-600">{vehicleData.vehicle.user.email}</p>
                    </div>

                    {vehicleData.location ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="glass p-3 rounded-lg">
                            <div className="flex items-center space-x-1 mb-1">
                              <Gauge className="w-3 h-3 text-gray-600" />
                              <span className="text-xs text-gray-600 font-medium">Speed</span>
                            </div>
                            <p className="font-bold text-gray-900">
                              {vehicleData.location.speed || 0} km/h
                            </p>
                          </div>

                          {vehicleData.location.batteryLevel && (
                            <div className="glass p-3 rounded-lg">
                              <div className="flex items-center space-x-1 mb-1">
                                <Activity className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-600 font-medium">Battery</span>
                              </div>
                              <p className="font-bold text-gray-900">
                                {vehicleData.location.batteryLevel}%
                              </p>
                            </div>
                          )}

                          {vehicleData.location.fuelLevel && (
                            <div className="glass p-3 rounded-lg">
                              <div className="flex items-center space-x-1 mb-1">
                                <Gauge className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-600 font-medium">Fuel</span>
                              </div>
                              <p className="font-bold text-gray-900">
                                {vehicleData.location.fuelLevel}%
                              </p>
                            </div>
                          )}

                          <div className="glass p-3 rounded-lg">
                            <div className="flex items-center space-x-1 mb-1">
                              <Clock className="w-3 h-3 text-gray-600" />
                              <span className="text-xs text-gray-600 font-medium">Updated</span>
                            </div>
                            <p className="font-bold text-gray-900 text-xs">
                              {new Date(vehicleData.location.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {vehicleData.location.address && (
                          <div className="glass p-3 rounded-lg mb-4">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="w-4 h-4 text-gray-600" />
                              <span className="text-xs text-gray-600 font-medium">
                                Current Location
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 font-medium">
                              {vehicleData.location.address}
                            </p>
                            <p className="text-xs text-gray-600 font-mono mt-1">
                              {vehicleData.location.latitude.toFixed(6)},{' '}
                              {vehicleData.location.longitude.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="glass p-4 rounded-lg text-center">
                        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No location data available</p>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      className="w-full btn-glossy"
                      onClick={() => setSelectedVehicle(vehicleData.vehicle.id)}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View on Map
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
