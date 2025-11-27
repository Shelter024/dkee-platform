'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import Link from 'next/link';
import {
  MapPin,
  Navigation,
  Car,
  Clock,
  Activity,
  Gauge,
  Battery,
  Thermometer,
  Sparkles,
  History,
  Route,
  AlertCircle,
} from 'lucide-react';

interface VehicleLocation {
  id: string;
  vehicleName: string;
  vehiclePlate: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  address: string;
  timestamp: string;
  status: 'moving' | 'parked' | 'idling';
  batteryLevel?: number;
  fuelLevel?: number;
  engineTemp?: number;
}

export default function TrackingPage() {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([
    {
      id: '1',
      vehicleName: 'Toyota Camry',
      vehiclePlate: 'LAG-123-AB',
      latitude: 6.5244,
      longitude: 3.3792,
      speed: 45,
      heading: 180,
      address: 'Lekki-Epe Expressway, Lagos',
      timestamp: new Date().toISOString(),
      status: 'moving',
      batteryLevel: 85,
      fuelLevel: 62,
      engineTemp: 92,
    },
    {
      id: '2',
      vehicleName: 'Honda Accord',
      vehiclePlate: 'LAG-456-CD',
      latitude: 6.4541,
      longitude: 3.3947,
      speed: 0,
      heading: 0,
      address: 'Victoria Island, Lagos',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'parked',
      batteryLevel: 92,
      fuelLevel: 45,
      engineTemp: 75,
    },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(vehicles[0]?.id || null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'moving':
        return <Badge variant="success" className="animate-pulse">Moving</Badge>;
      case 'parked':
        return <Badge variant="info">Parked</Badge>;
      case 'idling':
        return <Badge variant="warning">Idling</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving':
        return 'bg-green-100 border-green-300 text-green-900';
      case 'parked':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'idling':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  return (
    <FeatureGate featureId="VEHICLE_TRACKING" featureName="GPS Vehicle Tracking">
    <div className="space-y-6">{/* Hero Section */}
      <div className="glossy-card hover-lift p-8 animated-gradient">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Navigation className="w-8 h-8 mr-3" />
              Vehicle Tracking
              <Sparkles className="w-6 h-6 ml-3 text-yellow-300" />
            </h1>
            <p className="text-white/90 text-lg">
              Real-time vehicle tracking and monitoring
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="glass px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2 text-white">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Feature Banner */}
      <div className="premium-card p-6 animated-gradient border-yellow-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center neon-glow">
              <Sparkles className="w-6 h-6 text-yellow-900" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Premium Feature</h3>
              <p className="text-white/90 text-sm">
                Real-time vehicle tracking, geofencing alerts, and trip history
              </p>
            </div>
          </div>
          <Link href="/subscriptions">
            <Button variant="secondary" className="btn-glossy">
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>

      {/* Vehicle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Vehicles</p>
                <p className="text-3xl font-bold gradient-text shimmer">{vehicles.length}</p>
                <p className="text-xs text-blue-600 mt-1 font-semibold">Being tracked</p>
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
                <p className="text-sm text-gray-600 font-medium">Moving</p>
                <p className="text-3xl font-bold gradient-text shimmer">
                  {vehicles.filter(v => v.status === 'moving').length}
                </p>
                <p className="text-xs text-green-600 mt-1 font-semibold">In transit</p>
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
                <p className="text-sm text-gray-600 font-medium">Parked</p>
                <p className="text-3xl font-bold gradient-text shimmer">
                  {vehicles.filter(v => v.status === 'parked').length}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-semibold">Stationary</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center neon-glow">
                <MapPin className="w-6 h-6 text-gray-600" />
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
                  {Math.round(vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length)}
                </p>
                <p className="text-xs text-blue-600 mt-1 font-semibold">km/h</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center neon-glow">
                <Gauge className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle List */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            <span className="gradient-text">Your Vehicles</span>
            <span className="ml-3 text-sm font-normal text-gray-500">🚗 Fleet</span>
          </h2>

          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className="cursor-pointer"
              >
              <Card
                className={`glossy-card hover-lift transition-all ${
                  selectedVehicle === vehicle.id ? 'ring-2 ring-brand-navy-600 shadow-lg' : ''
                }`}
              >
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        vehicle.status === 'moving' ? 'bg-green-500' :
                        vehicle.status === 'parked' ? 'bg-blue-500' : 'bg-yellow-500'
                      } neon-glow`}>
                        <Car className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{vehicle.vehicleName}</h3>
                        <p className="text-sm text-gray-600 font-mono">{vehicle.vehiclePlate}</p>
                      </div>
                    </div>
                    {getStatusBadge(vehicle.status)}
                  </div>

                  <div className="glass p-3 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 truncate">{vehicle.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Gauge className="w-3 h-3" />
                        <span>{vehicle.speed} km/h</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(vehicle.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
              </div>
            ))}
          </div>

          <Link href="/dashboard/customer/vehicles/new?tracking=true" className="block mt-4">
            <Button variant="primary" className="w-full btn-glossy">
              <Car className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </Link>
        </div>

        {/* Map & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Placeholder */}
          <Card className="glossy-card hover-lift">
            <CardHeader>
              <h3 className="text-lg font-semibold gradient-text flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Live Location
                {selectedVehicleData && (
                  <span className="ml-auto text-sm font-normal text-gray-600">
                    {selectedVehicleData.vehicleName}
                  </span>
                )}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="relative w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                {/* Map Integration Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold mb-2">Interactive Map</p>
                    <p className="text-sm text-gray-500">
                      Google Maps / Mapbox integration coming soon
                    </p>
                    {selectedVehicleData && (
                      <div className="mt-4 glass p-4 rounded-lg inline-block">
                        <p className="text-sm font-semibold text-gray-800">
                          Current Position:
                        </p>
                        <p className="text-xs text-gray-600 font-mono">
                          {selectedVehicleData.latitude.toFixed(4)}, {selectedVehicleData.longitude.toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 glass px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-gray-700">Live Tracking</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Vehicle Details */}
          {selectedVehicleData && (
            <Card className="glossy-card hover-lift">
              <CardHeader>
                <h3 className="text-lg font-semibold gradient-text">Vehicle Telemetry</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Speed */}
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Gauge className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Speed</span>
                      </div>
                    </div>
                    <p className="text-3xl font-bold gradient-text mb-1">
                      {selectedVehicleData.speed}
                    </p>
                    <p className="text-sm text-gray-600">km/h</p>
                  </div>

                  {/* Battery */}
                  {selectedVehicleData.batteryLevel && (
                    <div className="glass p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Battery className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-gray-600">Battery</span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold gradient-text mb-1">
                        {selectedVehicleData.batteryLevel}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${selectedVehicleData.batteryLevel}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Fuel */}
                  {selectedVehicleData.fuelLevel && (
                    <div className="glass p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-gray-600">Fuel Level</span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold gradient-text mb-1">
                        {selectedVehicleData.fuelLevel}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            selectedVehicleData.fuelLevel > 50 ? 'bg-green-500' :
                            selectedVehicleData.fuelLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedVehicleData.fuelLevel}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Engine Temperature */}
                  {selectedVehicleData.engineTemp && (
                    <div className="glass p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Thermometer className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium text-gray-600">Engine Temp</span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold gradient-text mb-1">
                        {selectedVehicleData.engineTemp}°C
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedVehicleData.engineTemp > 100 ? 'High' : 'Normal'}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  <div className="glass p-4 rounded-lg md:col-span-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-600">Current Location</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedVehicleData.address}
                    </p>
                    <p className="text-xs text-gray-600 font-mono">
                      {selectedVehicleData.latitude.toFixed(6)}, {selectedVehicleData.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <Button variant="primary" className="flex-1 btn-glossy">
                    <History className="w-4 h-4 mr-2" />
                    View Trip History
                  </Button>
                  <Button variant="secondary" className="flex-1 btn-glossy">
                    <Route className="w-4 h-4 mr-2" />
                    Set Geofence
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Features Info */}
      <Card className="glossy-card hover-lift">
        <CardHeader>
          <h3 className="text-lg font-semibold gradient-text">Premium Tracking Features</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 neon-glow">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-bold mb-2">Real-Time GPS</h4>
              <p className="text-sm text-gray-600">
                Track your vehicles in real-time with 5-second update intervals
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 neon-glow">
                <Route className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-bold mb-2">Geofencing Alerts</h4>
              <p className="text-sm text-gray-600">
                Get instant alerts when vehicles enter or exit designated areas
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 neon-glow">
                <History className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-bold mb-2">Trip History</h4>
              <p className="text-sm text-gray-600">
                Review complete trip history with routes, stops, and driving behavior analytics
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
    </FeatureGate>
  );
}
