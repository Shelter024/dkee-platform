'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Shield,
  BarChart3,
  Settings,
  Building,
  Briefcase,
  CreditCard,
  Receipt,
  FileCheck,
  UserCheck,
  CalendarCheck,
  Package,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  financial: {
    pendingTransactions: number;
    totalRevenue: number;
    monthlyExpenses: number;
    budgetUtilization: number;
  };
  procurement: {
    pendingPO: number;
    pendingClaims: number;
    totalPOValue: number;
  };
  hr: {
    pendingLeaves: number;
    staffCount: number;
    activeAssignments: number;
  };
  operations: {
    pendingApprovals: number;
    activeTasks: number;
    upcomingMeetings: number;
  };
  compliance: {
    documentsForReview: number;
    auditFindings: number;
    kpisOnTrack: number;
  };
}

export default function ManagementDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = session?.user?.role || '';
  const isFinanceRole = ['ACCOUNTANT', 'FINANCE_MANAGER', 'CEO', 'ADMIN'].includes(userRole);
  const isAuditRole = ['AUDITOR', 'CEO', 'ADMIN'].includes(userRole);
  const isOperationsRole = ['OPERATIONS_MANAGER', 'ADMIN_MANAGER', 'MANAGER', 'CEO', 'ADMIN'].includes(userRole);
  const isHRRole = ['HR', 'CEO', 'ADMIN', 'ADMIN_MANAGER'].includes(userRole);
  const isManagement = ['CEO', 'ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'ADMIN_MANAGER'].includes(userRole);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // This would call various APIs to get stats
      // For now, using mock data
      setStats({
        financial: {
          pendingTransactions: 12,
          totalRevenue: 245000,
          monthlyExpenses: 87500,
          budgetUtilization: 67,
        },
        procurement: {
          pendingPO: 8,
          pendingClaims: 15,
          totalPOValue: 45600,
        },
        hr: {
          pendingLeaves: 6,
          staffCount: 48,
          activeAssignments: 23,
        },
        operations: {
          pendingApprovals: 18,
          activeTasks: 56,
          upcomingMeetings: 4,
        },
        compliance: {
          documentsForReview: 3,
          auditFindings: 2,
          kpisOnTrack: 12,
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Financial Transactions',
      description: 'Manage income, expenses, and transfers',
      icon: DollarSign,
      href: '/dashboard/finance/transactions',
      color: 'green',
      roles: ['ACCOUNTANT', 'FINANCE_MANAGER', 'CEO', 'ADMIN'],
    },
    {
      title: 'Budget Management',
      description: 'Track and manage departmental budgets',
      icon: Target,
      href: '/dashboard/finance/budgets',
      color: 'blue',
      roles: ['FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'CEO', 'ADMIN'],
    },
    {
      title: 'Purchase Orders',
      description: 'Create and approve purchase orders',
      icon: ShoppingCart,
      href: '/dashboard/procurement/purchase-orders',
      color: 'purple',
      roles: ['OPERATIONS_MANAGER', 'ADMIN_MANAGER', 'MANAGER', 'CEO', 'ADMIN'],
    },
    {
      title: 'Expense Claims',
      description: 'Submit and approve expense claims',
      icon: Receipt,
      href: '/dashboard/finance/expense-claims',
      color: 'orange',
      roles: ['ACCOUNTANT', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'CEO', 'ADMIN'],
    },
    {
      title: 'Leave Management',
      description: 'Approve and track staff leave requests',
      icon: CalendarCheck,
      href: '/dashboard/hr/leave-requests',
      color: 'indigo',
      roles: ['HR', 'MANAGER', 'CEO', 'ADMIN', 'ADMIN_MANAGER'],
    },
    {
      title: 'Tasks & Projects',
      description: 'Manage operational tasks and projects',
      icon: CheckCircle,
      href: '/dashboard/operations/tasks',
      color: 'teal',
      roles: ['OPERATIONS_MANAGER', 'ADMIN_MANAGER', 'MANAGER', 'CEO', 'ADMIN'],
    },
    {
      title: 'Meetings',
      description: 'Schedule and manage meetings',
      icon: Calendar,
      href: '/dashboard/operations/meetings',
      color: 'pink',
      roles: ['ADMIN_MANAGER', 'OPERATIONS_MANAGER', 'MANAGER', 'CEO', 'ADMIN'],
    },
    {
      title: 'Asset Management',
      description: 'Track company assets and equipment',
      icon: Package,
      href: '/dashboard/operations/assets',
      color: 'gray',
      roles: ['OPERATIONS_MANAGER', 'ADMIN_MANAGER', 'CEO', 'ADMIN'],
    },
    {
      title: 'Audit & Compliance',
      description: 'Review audit logs and compliance',
      icon: Shield,
      href: '/dashboard/audit/overview',
      color: 'red',
      roles: ['AUDITOR', 'CEO', 'ADMIN'],
    },
    {
      title: 'KPI Dashboard',
      description: 'Monitor key performance indicators',
      icon: BarChart3,
      href: '/dashboard/management/kpis',
      color: 'yellow',
      roles: ['CEO', 'ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER'],
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports',
      icon: FileText,
      href: '/dashboard/management/reports',
      color: 'cyan',
      roles: ['CEO', 'ADMIN', 'FINANCE_MANAGER', 'AUDITOR', 'OPERATIONS_MANAGER'],
    },
    {
      title: 'Workflow Approvals',
      description: 'Manage approval workflows',
      icon: FileCheck,
      href: '/dashboard/management/approvals',
      color: 'lime',
      roles: ['CEO', 'ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'ADMIN_MANAGER'],
    },
  ];

  const filteredQuickActions = quickActions.filter((action) =>
    action.roles.includes(userRole)
  );

  const getColorClasses = (color: string) => {
    const colors: any = {
      green: 'bg-green-50 text-green-600 hover:bg-green-100',
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
      indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
      teal: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
      pink: 'bg-pink-50 text-pink-600 hover:bg-pink-100',
      gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
      red: 'bg-red-50 text-red-600 hover:bg-red-100',
      yellow: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      cyan: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
      lime: 'bg-lime-50 text-lime-600 hover:bg-lime-100',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              Management Portal
            </h2>
            <p className="text-gray-600 text-lg">
              Comprehensive office management and workflow coordination
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 text-sm font-bold">
              {userRole.replace(/_/g, ' ')}
            </Badge>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-4 rounded-2xl">
              <LayoutDashboard className="w-12 h-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Role-based Stats Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Financial Stats - For Finance Roles */}
            {isFinanceRole && (
              <>
                <Card className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
                  <CardBody>
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="text-sm font-medium opacity-90 mb-1">Total Revenue</p>
                        <p className="text-4xl font-bold">
                          ${stats.financial.totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs opacity-75 mt-1">This month</p>
                      </div>
                      <div className="bg-white/20 p-3 rounded-xl">
                        <TrendingUp className="w-10 h-10" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
                  <CardBody>
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="text-sm font-medium opacity-90 mb-1">Pending Transactions</p>
                        <p className="text-4xl font-bold">
                          {stats.financial.pendingTransactions}
                        </p>
                        <p className="text-xs opacity-75 mt-1">Awaiting approval</p>
                      </div>
                      <div className="bg-white/20 p-3 rounded-xl">
                        <CreditCard className="w-10 h-10" />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </>
            )}

          {/* Operations Stats */}
          {isOperationsRole && (
            <>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Pending POs</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {stats.procurement.pendingPO}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        ${stats.procurement.totalPOValue.toLocaleString()} value
                      </p>
                    </div>
                    <ShoppingCart className="w-12 h-12 text-blue-500 opacity-50" />
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Active Tasks</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {stats.operations.activeTasks}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">In progress</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-purple-500 opacity-50" />
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* HR Stats */}
          {isHRRole && (
            <>
              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-600 font-medium">Staff Count</p>
                      <p className="text-2xl font-bold text-indigo-900">{stats.hr.staffCount}</p>
                      <p className="text-xs text-indigo-600 mt-1">Total employees</p>
                    </div>
                    <Users className="w-12 h-12 text-indigo-500 opacity-50" />
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-pink-600 font-medium">Pending Leaves</p>
                      <p className="text-2xl font-bold text-pink-900">
                        {stats.hr.pendingLeaves}
                      </p>
                      <p className="text-xs text-pink-600 mt-1">Awaiting approval</p>
                    </div>
                    <CalendarCheck className="w-12 h-12 text-pink-500 opacity-50" />
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* Audit Stats */}
          {isAuditRole && (
            <>
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Audit Findings</p>
                      <p className="text-2xl font-bold text-red-900">
                        {stats.compliance.auditFindings}
                      </p>
                      <p className="text-xs text-red-600 mt-1">Requires attention</p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-teal-600 font-medium">Compliance Docs</p>
                      <p className="text-2xl font-bold text-teal-900">
                        {stats.compliance.documentsForReview}
                      </p>
                      <p className="text-xs text-teal-600 mt-1">For review</p>
                    </div>
                    <FileCheck className="w-12 h-12 text-teal-500 opacity-50" />
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* Management Overview */}
          {isManagement && (
            <>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Pending Approvals</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {stats.operations.pendingApprovals}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">Across all departments</p>
                    </div>
                    <FileCheck className="w-12 h-12 text-yellow-500 opacity-50" />
                  </div>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-600 font-medium">KPIs On Track</p>
                      <p className="text-2xl font-bold text-cyan-900">
                        {stats.compliance.kpisOnTrack}
                      </p>
                      <p className="text-xs text-cyan-600 mt-1">Performance targets</p>
                    </div>
                    <Target className="w-12 h-12 text-cyan-500 opacity-50" />
                  </div>
                </CardBody>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredQuickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <Card className={`hover-lift cursor-pointer transition-all ${getColorClasses(action.color)} border-2`}>
                  <CardBody>
                    <div className="flex items-start space-x-3">
                      <Icon className="w-8 h-8 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                        <p className="text-xs opacity-80">{action.description}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity - Placeholder */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600">
            Recent activity feed will show latest transactions, approvals, and system events here.
          </p>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
