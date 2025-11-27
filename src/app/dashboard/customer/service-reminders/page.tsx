'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import Link from 'next/link';
import {
  Calendar,
  Bell,
  Car,
  Wrench,
  Clock,
  Plus,
  CheckCircle,
  AlertTriangle,
  Gauge,
  Settings,
  Sparkles,
} from 'lucide-react';

interface ServiceReminder {
  id: string;
  vehicleName: string;
  vehiclePlate: string;
  serviceType: string;
  dueDate: string;
  dueMileage: number;
  currentMileage: number;
  status: 'upcoming' | 'due' | 'overdue';
  notes?: string;
}

export default function ServiceRemindersPage() {
  const [reminders, setReminders] = useState<ServiceReminder[]>([
    {
      id: '1',
      vehicleName: 'Toyota Camry',
      vehiclePlate: 'LAG-123-AB',
      serviceType: 'Oil Change',
      dueDate: '2025-12-01',
      dueMileage: 55000,
      currentMileage: 52000,
      status: 'upcoming',
      notes: 'Use synthetic oil - 5W-30',
    },
    {
      id: '2',
      vehicleName: 'Toyota Camry',
      vehiclePlate: 'LAG-123-AB',
      serviceType: 'Tire Rotation',
      dueDate: '2025-11-28',
      dueMileage: 53000,
      currentMileage: 52000,
      status: 'due',
    },
    {
      id: '3',
      vehicleName: 'Honda Accord',
      vehiclePlate: 'LAG-456-CD',
      serviceType: 'Brake Inspection',
      dueDate: '2025-11-20',
      dueMileage: 48000,
      currentMileage: 49500,
      status: 'overdue',
      notes: 'Check brake pads and rotors',
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="info">Upcoming</Badge>;
      case 'due':
        return <Badge variant="warning">Due Soon</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 border-blue-200 text-blue-900';
      case 'due':
        return 'bg-yellow-100 border-yellow-200 text-yellow-900';
      case 'overdue':
        return 'bg-red-100 border-red-200 text-red-900';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-900';
    }
  };

  const upcomingCount = reminders.filter(r => r.status === 'upcoming').length;
  const dueCount = reminders.filter(r => r.status === 'due').length;
  const overdueCount = reminders.filter(r => r.status === 'overdue').length;

  return (
    <FeatureGate featureId="OIL_SERVICE_REMINDER" featureName="Service Reminders">
    <div className="space-y-6">{/* Hero Section */}
      <div className="glossy-card hover-lift p-8 animated-gradient">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Bell className="w-8 h-8 mr-3" />
              Service Reminders
              <Sparkles className="w-6 h-6 ml-3 text-yellow-300" />
            </h1>
            <p className="text-white/90 text-lg">
              Never miss another oil change or maintenance appointment
            </p>
          </div>
          <Link href="/dashboard/customer/service-reminders/new">
            <Button variant="secondary" className="btn-glossy">
              <Plus className="w-5 h-5 mr-2" />
              Add Reminder
            </Button>
          </Link>
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
                Automated reminders via SMS, Email & Push notifications
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Upcoming</p>
                <p className="text-3xl font-bold gradient-text shimmer">{upcomingCount}</p>
                <p className="text-xs text-blue-600 mt-1 font-semibold">Services scheduled</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center neon-glow">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Due Soon</p>
                <p className="text-3xl font-bold gradient-text shimmer">{dueCount}</p>
                <p className="text-xs text-yellow-600 mt-1 font-semibold">Needs attention</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center neon-glow">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Overdue</p>
                <p className="text-3xl font-bold gradient-text shimmer">{overdueCount}</p>
                <p className="text-xs text-red-600 mt-1 font-semibold">Requires immediate action</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center neon-glow">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Service Reminders List */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          <span className="gradient-text">Your Reminders</span>
          <span className="ml-3 text-sm font-normal text-gray-500">🔔 Active alerts</span>
        </h2>

        <div className="space-y-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className={`glossy-card hover-lift border-2 ${getStatusColor(reminder.status)}`}>
              <CardBody className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      reminder.status === 'overdue' ? 'bg-red-500' :
                      reminder.status === 'due' ? 'bg-yellow-500' : 'bg-blue-500'
                    } neon-glow`}>
                      <Wrench className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold gradient-text">{reminder.serviceType}</h3>
                        {getStatusBadge(reminder.status)}
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Car className="w-4 h-4" />
                        <span className="font-semibold">{reminder.vehicleName}</span>
                        <span className="text-gray-500">•</span>
                        <span className="font-mono">{reminder.vehiclePlate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600 font-medium">Due Date</span>
                    </div>
                    <p className="font-bold text-gray-900">
                      {new Date(reminder.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Gauge className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600 font-medium">Due Mileage</span>
                    </div>
                    <p className="font-bold text-gray-900">
                      {reminder.dueMileage.toLocaleString()} km
                    </p>
                  </div>

                  <div className="glass p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Gauge className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600 font-medium">Current Mileage</span>
                    </div>
                    <p className="font-bold text-gray-900">
                      {reminder.currentMileage.toLocaleString()} km
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            reminder.status === 'overdue' ? 'bg-red-500' :
                            reminder.status === 'due' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${Math.min((reminder.currentMileage / reminder.dueMileage) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {reminder.notes && (
                  <div className="glass p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Notes:</span> {reminder.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Link href={`/dashboard/customer/services/new?reminder=${reminder.id}`} className="flex-1">
                    <Button variant="primary" className="w-full btn-glossy">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Book Service Now
                    </Button>
                  </Link>
                  <Link href={`/dashboard/customer/service-reminders/${reminder.id}/edit`}>
                    <Button variant="secondary" className="btn-glossy">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <Card className="glossy-card hover-lift">
        <CardHeader>
          <h3 className="text-lg font-semibold gradient-text">How Service Reminders Work</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 neon-glow">
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-bold mb-2">Set Reminders</h4>
              <p className="text-sm text-gray-600">
                Add reminders based on date or mileage for oil changes, tire rotations, and more
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 neon-glow">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="font-bold mb-2">Get Notified</h4>
              <p className="text-sm text-gray-600">
                Receive automated alerts via SMS, email, and push notifications before service is due
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 neon-glow">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-bold mb-2">Book Instantly</h4>
              <p className="text-sm text-gray-600">
                One-click booking to schedule your service appointment with us
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
    </FeatureGate>
  );
}
