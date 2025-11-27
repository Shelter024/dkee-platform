'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import {
  Car,
  Building2,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Settings,
  UserCheck,
  Shield,
  Globe,
  Mail,
} from 'lucide-react';

export default function AdminDashboard() {
  const quickActions = [
    { title: 'System Settings', icon: Settings, href: '/dashboard/admin/settings', color: 'bg-blue-500', description: 'Configure all system settings' },
    { title: 'User Management', icon: Users, href: '/dashboard/admin/users/manage', color: 'bg-green-500', description: 'Manage all user accounts' },
    { title: 'Approve Accounts', icon: UserCheck, href: '/dashboard/admin/users/approvals', color: 'bg-purple-500', description: 'Review pending registrations' },
    { title: 'Session Settings', icon: Shield, href: '/dashboard/admin/settings?tab=session', color: 'bg-orange-500', description: 'Configure login sessions' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="glossy-card hover-lift p-8 mb-8 animated-gradient">
        <h1 className="text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
        <p className="text-white/90">Complete control center for DK Executive Engineers</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-brand-navy-900 mb-4 flex items-center">
          <span className="gradient-text">Quick Actions</span>
          <span className="ml-3 text-sm font-normal text-gray-500">⚡ Instant access</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="glossy-card hover-lift cursor-pointer h-full group">
                  <CardBody className="flex flex-col items-center text-center p-6">
                    <div className={`w-14 h-14 ${action.color} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform neon-glow`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-brand-navy-900 mb-1 gradient-text">{action.title}</h3>
                    <p className="text-xs text-neutral-600">{action.description}</p>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Overview Stats */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          <span className="gradient-text">Overview Statistics</span>
          <span className="ml-3 text-sm font-normal text-gray-500">📊 Real-time metrics</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Customers</p>
                <p className="text-3xl font-bold gradient-text shimmer">247</p>
                <p className="text-xs text-green-600 mt-1 font-semibold">↑ 12% from last month</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center neon-glow">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Services</p>
                <p className="text-3xl font-bold gradient-text shimmer">45</p>
                <p className="text-xs text-blue-600 mt-1 font-semibold">18 automotive, 27 property</p>
              </div>
              <div className="w-12 h-12 bg-brand-navy-100 rounded-lg flex items-center justify-center neon-glow">
                <Car className="w-6 h-6 text-brand-navy-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Properties Listed</p>
                <p className="text-3xl font-bold gradient-text shimmer">89</p>
                <p className="text-xs text-green-600 mt-1 font-semibold">23 available</p>
              </div>
              <div className="w-12 h-12 bg-brand-red-100 rounded-lg flex items-center justify-center neon-glow">
                <Building2 className="w-6 h-6 text-brand-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="metric-card hover-lift">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
                <p className="text-3xl font-bold gradient-text shimmer">₦8.5M</p>
                <p className="text-xs text-green-600 mt-1 font-semibold">↑ 8% from last month</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center neon-glow">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          <span className="gradient-text">Recent Activity</span>
          <span className="ml-3 text-sm font-normal text-gray-500">🔥 Live updates</span>
        </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automotive Services */}
        <Card className="glossy-card hover-lift">
          <CardHeader>
            <h3 className="text-lg font-semibold gradient-text">Recent Automotive Services</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-navy-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-brand-navy-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Oil Change - Toyota Camry</p>
                    <p className="text-xs text-gray-600">John Doe</p>
                  </div>
                </div>
                <Badge variant="success">Completed</Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Brake Repair - Honda Accord</p>
                    <p className="text-xs text-gray-600">Jane Smith</p>
                  </div>
                </div>
                <Badge variant="info">In Progress</Badge>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Diagnosis - Mercedes Benz</p>
                    <p className="text-xs text-gray-600">Mike Johnson</p>
                  </div>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Property Inquiries */}
        <Card className="glossy-card hover-lift">
          <CardHeader>
            <h3 className="text-lg font-semibold gradient-text">Recent Property Inquiries</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-red-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-brand-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">3BR Apartment - Lekki</p>
                    <p className="text-xs text-gray-600">Sarah Williams</p>
                  </div>
                </div>
                <Badge variant="info">New</Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-red-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-brand-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">5BR House - Abuja</p>
                    <p className="text-xs text-gray-600">David Brown</p>
                  </div>
                </div>
                <Badge variant="warning">Contacted</Badge>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-red-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-brand-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Office Space - VI</p>
                    <p className="text-xs text-gray-600">ABC Corporation</p>
                  </div>
                </div>
                <Badge variant="success">Scheduled</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      </div>

      {/* Emergency Requests */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          <span className="gradient-text">Emergency Center</span>
          <span className="ml-3 text-sm font-normal text-gray-500">🚨 Critical alerts</span>
        </h2>
      <Card className="glossy-card hover-lift border-red-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-brand-red-600" />
              <span>Active Emergency Requests</span>
            </h3>
            <Badge variant="danger">2 Urgent</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-brand-red-900">Vehicle Breakdown - Expressway</p>
                  <p className="text-sm text-brand-red-700">Customer: Robert Taylor</p>
                  <p className="text-xs text-brand-red-600 mt-1">Location: Lekki-Epe Expressway</p>
                </div>
                <Badge variant="danger">Critical</Badge>
              </div>
              <p className="text-sm text-brand-red-800">Reported 15 minutes ago</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-yellow-900">Urgent Property Inspection</p>
                  <p className="text-sm text-yellow-700">Customer: Linda Garcia</p>
                  <p className="text-xs text-yellow-600 mt-1">Location: Ikeja GRA</p>
                </div>
                <Badge variant="warning">High</Badge>
              </div>
              <p className="text-sm text-yellow-800">Reported 1 hour ago</p>
            </div>
          </div>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
