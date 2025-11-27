'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Bell,
  Search,
  Calendar,
  Car,
  Gauge,
  Filter,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
} from 'lucide-react';

interface ServiceReminderWithUser {
  id: string;
  serviceType: string;
  dueDate: Date | null;
  dueMileage: number | null;
  status: string;
  notificationSent: boolean;
  vehicle: {
    make: string;
    model: string;
    licensePlate: string;
    currentMileage: number | null;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  };
}

export default function AdminServiceRemindersPage() {
  const [reminders, setReminders] = useState<ServiceReminderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      // In real implementation, this would be an admin-specific endpoint
      const response = await fetch('/api/admin/service-reminders');
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (reminder: ServiceReminderWithUser) => {
    const now = new Date();
    const currentMileage = reminder.vehicle.currentMileage || 0;

    // Check date-based status
    if (reminder.dueDate) {
      const dueDate = new Date(reminder.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        return { status: 'overdue', label: 'Overdue', color: 'danger' };
      } else if (daysUntilDue <= 7) {
        return { status: 'due', label: 'Due Soon', color: 'warning' };
      }
    }

    // Check mileage-based status
    if (reminder.dueMileage && currentMileage) {
      const mileageUntilDue = reminder.dueMileage - currentMileage;
      
      if (mileageUntilDue < 0) {
        return { status: 'overdue', label: 'Overdue', color: 'danger' };
      } else if (mileageUntilDue <= 1000) {
        return { status: 'due', label: 'Due Soon', color: 'warning' };
      }
    }

    return { status: 'upcoming', label: 'Upcoming', color: 'info' };
  };

  const filteredReminders = reminders.filter((reminder) => {
    const matchesSearch =
      reminder.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.vehicle.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reminder.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

    const statusInfo = getStatusInfo(reminder);
    const matchesStatus = statusFilter === 'all' || statusInfo.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reminders.length,
    upcoming: reminders.filter((r) => getStatusInfo(r).status === 'upcoming').length,
    due: reminders.filter((r) => getStatusInfo(r).status === 'due').length,
    overdue: reminders.filter((r) => getStatusInfo(r).status === 'overdue').length,
    notificationsSent: reminders.filter((r) => r.notificationSent).length,
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="glossy-card hover-lift p-8 animated-gradient">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Bell className="w-8 h-8 mr-3" />
              Service Reminders Management
            </h1>
            <p className="text-white/90 text-lg">
              Monitor and manage all customer service reminders
            </p>
          </div>
          <Button variant="secondary" className="btn-glossy">
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Reminders</p>
                <p className="text-3xl font-bold gradient-text shimmer">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center neon-glow">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Upcoming</p>
                <p className="text-3xl font-bold gradient-text shimmer">{stats.upcoming}</p>
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
                <p className="text-3xl font-bold gradient-text shimmer">{stats.due}</p>
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
                <p className="text-3xl font-bold gradient-text shimmer">{stats.overdue}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center neon-glow">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Notified</p>
                <p className="text-3xl font-bold gradient-text shimmer">{stats.notificationsSent}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center neon-glow">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glossy-card hover-lift">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by customer, vehicle, or service type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'upcoming' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('upcoming')}
                size="sm"
              >
                Upcoming
              </Button>
              <Button
                variant={statusFilter === 'due' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('due')}
                size="sm"
              >
                Due Soon
              </Button>
              <Button
                variant={statusFilter === 'overdue' ? 'primary' : 'secondary'}
                onClick={() => setStatusFilter('overdue')}
                size="sm"
              >
                Overdue
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Reminders List */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          <span className="gradient-text">All Reminders</span>
          <span className="ml-3 text-sm font-normal text-gray-500">
            {filteredReminders.length} results
          </span>
        </h2>

        {loading ? (
          <Card className="glossy-card">
            <CardBody className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading reminders...</p>
            </CardBody>
          </Card>
        ) : filteredReminders.length === 0 ? (
          <Card className="glossy-card">
            <CardBody className="p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">No reminders found</p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No service reminders have been created yet'}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReminders.map((reminder) => {
              const statusInfo = getStatusInfo(reminder);
              return (
                <Card key={reminder.id} className="glossy-card hover-lift">
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            statusInfo.status === 'overdue'
                              ? 'bg-red-500'
                              : statusInfo.status === 'due'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          } neon-glow`}
                        >
                          <Bell className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold gradient-text">
                              {reminder.serviceType}
                            </h3>
                            <Badge variant={statusInfo.color as any}>
                              {statusInfo.label}
                            </Badge>
                            {reminder.notificationSent && (
                              <Badge variant="success">Notified</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-gray-700">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span className="font-semibold">
                                {reminder.vehicle.user.name}
                              </span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center space-x-2">
                              <Car className="w-4 h-4" />
                              <span>
                                {reminder.vehicle.make} {reminder.vehicle.model}
                              </span>
                              <span className="font-mono text-sm">
                                ({reminder.vehicle.licensePlate})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {reminder.dueDate && (
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-xs text-gray-600 font-medium">
                              Due Date
                            </span>
                          </div>
                          <p className="font-bold text-gray-900">
                            {new Date(reminder.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      )}

                      {reminder.dueMileage && (
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Gauge className="w-4 h-4 text-gray-600" />
                            <span className="text-xs text-gray-600 font-medium">
                              Due Mileage
                            </span>
                          </div>
                          <p className="font-bold text-gray-900">
                            {reminder.dueMileage.toLocaleString()} km
                          </p>
                        </div>
                      )}

                      {reminder.vehicle.currentMileage && (
                        <div className="glass p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Gauge className="w-4 h-4 text-gray-600" />
                            <span className="text-xs text-gray-600 font-medium">
                              Current Mileage
                            </span>
                          </div>
                          <p className="font-bold text-gray-900">
                            {reminder.vehicle.currentMileage.toLocaleString()} km
                          </p>
                        </div>
                      )}

                      <div className="glass p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-1">
                          <Users className="w-4 h-4 text-gray-600" />
                          <span className="text-xs text-gray-600 font-medium">Contact</span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {reminder.vehicle.user.email}
                        </p>
                        {reminder.vehicle.user.phone && (
                          <p className="text-xs text-gray-600 font-mono">
                            {reminder.vehicle.user.phone}
                          </p>
                        )}
                      </div>
                    </div>
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
