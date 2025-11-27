'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  Calendar,
  Briefcase,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

export default function CEODashboard() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all critical data
      const [
        financialRes,
        budgetsRes,
        purchaseOrdersRes,
        expenseClaimsRes,
        leaveRequestsRes,
        attendanceRes,
        tasksRes,
        kpisRes,
      ] = await Promise.all([
        fetch('/api/finance/transactions?limit=10'),
        fetch('/api/finance/budgets'),
        fetch('/api/procurement/purchase-orders?status=PENDING'),
        fetch('/api/finance/expense-claims?status=PENDING'),
        fetch('/api/hr/leave-requests?status=PENDING'),
        fetch(`/api/attendance/logs?startDate=${new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()}`),
        fetch('/api/operations/tasks?status=IN_PROGRESS'),
        fetch(`/api/management/kpis?fiscalYear=${new Date().getFullYear()}`),
      ]);

      const financial = await financialRes.json();
      const budgets = await budgetsRes.json();
      const purchaseOrders = await purchaseOrdersRes.json();
      const expenseClaims = await expenseClaimsRes.json();
      const leaveRequests = await leaveRequestsRes.json();
      const attendance = await attendanceRes.json();
      const tasks = await tasksRes.json();
      const kpis = await kpisRes.json();

      // Calculate metrics
      const totalRevenue = financial.transactions
        ?.filter((t: any) => t.transactionType === 'INCOME' && t.status === 'POSTED')
        .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

      const totalExpenses = financial.transactions
        ?.filter((t: any) => t.transactionType === 'EXPENSE' && t.status === 'POSTED')
        .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

      const totalBudgetAllocated = budgets.budgets
        ?.reduce((sum: number, b: any) => sum + b.allocatedAmount, 0) || 0;

      const totalBudgetSpent = budgets.budgets
        ?.reduce((sum: number, b: any) => sum + b.spentAmount, 0) || 0;

      const budgetUtilization = totalBudgetAllocated > 0 
        ? (totalBudgetSpent / totalBudgetAllocated) * 100 
        : 0;

      const attendanceRate = attendance.logs?.length > 0
        ? (attendance.logs.filter((l: any) => ['PRESENT', 'LATE'].includes(l.status)).length / attendance.logs.length) * 100
        : 0;

      const kpisAchieved = kpis.kpis?.filter((k: any) => k.status === 'ACHIEVED').length || 0;
      const kpisTotal = kpis.kpis?.length || 0;

      setDashboardData({
        financial: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
          pendingTransactions: financial.transactions?.filter((t: any) => t.status === 'PENDING').length || 0,
        },
        budgets: {
          allocated: totalBudgetAllocated,
          spent: totalBudgetSpent,
          remaining: totalBudgetAllocated - totalBudgetSpent,
          utilization: budgetUtilization,
          atRisk: budgets.budgets?.filter((b: any) => b.status === 'EXHAUSTED' || (b.remainingAmount / b.allocatedAmount) < 0.1).length || 0,
        },
        procurement: {
          pendingPOs: purchaseOrders.orders?.length || 0,
          totalPOValue: purchaseOrders.orders?.reduce((sum: number, po: any) => sum + po.totalAmount, 0) || 0,
        },
        hr: {
          pendingLeaves: leaveRequests.requests?.length || 0,
          pendingClaims: expenseClaims.claims?.length || 0,
          attendanceRate: attendanceRate.toFixed(1),
        },
        operations: {
          activeTasks: tasks.tasks?.length || 0,
          overdueTasks: tasks.tasks?.filter((t: any) => new Date(t.dueDate) < new Date()).length || 0,
        },
        kpis: {
          achieved: kpisAchieved,
          total: kpisTotal,
          achievementRate: kpisTotal > 0 ? (kpisAchieved / kpisTotal) * 100 : 0,
        },
        pendingApprovals: {
          transactions: financial.transactions?.filter((t: any) => t.status === 'PENDING').length || 0,
          purchaseOrders: purchaseOrders.orders?.length || 0,
          expenseClaims: expenseClaims.claims?.length || 0,
          leaveRequests: leaveRequests.requests?.length || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Loading executive dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-indigo-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Executive Dashboard
            </h2>
            <p className="text-gray-600 text-lg flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Real-time business intelligence and insights
            </p>
          </div>
          <div className="text-right bg-gradient-to-br from-indigo-100 to-purple-100 p-6 rounded-2xl">
            <p className="text-sm text-indigo-600 font-medium mb-1">Welcome back,</p>
            <p className="font-bold text-2xl text-indigo-900">{session?.user?.name}</p>
            <p className="text-xs text-indigo-600 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Financial Overview */}
        <div>
          <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
              💰
            </span>
            Financial Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
              <CardBody>
                <div className="text-white relative">
                  <TrendingUp className="absolute top-0 right-0 w-20 h-20 opacity-10" />
                  <p className="text-sm font-medium opacity-90 mb-2">Total Revenue</p>
                  <p className="text-4xl font-bold mb-1">
                    ₦{dashboardData.financial.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-75 flex items-center gap-1">
                    <span>📈</span> This period
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-rose-400 via-red-500 to-pink-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
              <CardBody>
                <div className="text-white relative">
                  <TrendingDown className="absolute top-0 right-0 w-20 h-20 opacity-10" />
                  <p className="text-sm font-medium opacity-90 mb-2">Total Expenses</p>
                  <p className="text-4xl font-bold mb-1">
                    ₦{dashboardData.financial.expenses.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-75 flex items-center gap-1">
                    <span>💳</span> This period
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
              <CardBody>
                <div className="text-white relative">
                  <DollarSign className="absolute top-0 right-0 w-20 h-20 opacity-10" />
                  <p className="text-sm font-medium opacity-90 mb-2">Net Profit</p>
                  <p className="text-4xl font-bold mb-1">
                    ₦{dashboardData.financial.netProfit.toLocaleString()}
                  </p>
                  <p className="text-xs opacity-75 flex items-center gap-1">
                    <span>📊</span> {dashboardData.financial.profitMargin.toFixed(1)}% margin
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
              <CardBody>
                <div className="text-white relative">
                  <Target className="absolute top-0 right-0 w-20 h-20 opacity-10" />
                  <p className="text-sm font-medium opacity-90 mb-2">Budget Utilization</p>
                  <p className="text-4xl font-bold mb-1">
                    {dashboardData.budgets.utilization.toFixed(1)}%
                  </p>
                  <p className="text-xs opacity-75 flex items-center gap-1">
                    <span>💵</span> ₦{dashboardData.budgets.remaining.toLocaleString()} left
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Pending Approvals */}
        <div>
          <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
              ⏳
            </span>
            Pending Approvals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link href="/dashboard/finance/transactions">
              <Card className="bg-white border-2 border-amber-200 hover:border-amber-400 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 font-semibold mb-2">Transactions</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {dashboardData.pendingApprovals.transactions}
                      </p>
                      <p className="text-xs text-amber-600 mt-2">Awaiting review</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-4 rounded-xl">
                      <DollarSign className="w-10 h-10 text-amber-600" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/dashboard/procurement/purchase-orders">
              <Card className="bg-white border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-600 font-semibold mb-2">Purchase Orders</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {dashboardData.pendingApprovals.purchaseOrders}
                      </p>
                      <p className="text-xs text-indigo-600 mt-2">Awaiting review</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-4 rounded-xl">
                      <ShoppingCart className="w-10 h-10 text-indigo-600" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/dashboard/finance/expense-claims">
              <Card className="bg-white border-2 border-pink-200 hover:border-pink-400 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-pink-600 font-semibold mb-2">Expense Claims</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                        {dashboardData.pendingApprovals.expenseClaims}
                      </p>
                      <p className="text-xs text-pink-600 mt-2">Awaiting review</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-4 rounded-xl">
                      <Briefcase className="w-10 h-10 text-pink-600" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>

            <Link href="/dashboard/hr/leave-requests">
              <Card className="bg-white border-2 border-teal-200 hover:border-teal-400 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-teal-600 font-semibold mb-2">Leave Requests</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        {dashboardData.pendingApprovals.leaveRequests}
                      </p>
                      <p className="text-xs text-teal-600 mt-2">Awaiting review</p>
                    </div>
                    <div className="bg-gradient-to-br from-teal-100 to-cyan-100 p-4 rounded-xl">
                      <Calendar className="w-10 h-10 text-teal-600" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          </div>
        </div>

        {/* Operations & HR */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Operations */}
          <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <CheckCircle className="w-7 h-7" />
                Operations Overview
              </h3>
            </CardHeader>
            <CardBody className="space-y-4 p-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Active Tasks</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {dashboardData.operations.activeTasks}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Overdue Tasks</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {dashboardData.operations.overdueTasks}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Pending POs Value</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  ₦{dashboardData.procurement.totalPOValue.toLocaleString()}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* HR & Attendance */}
          <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Users className="w-7 h-7" />
                Human Resources
              </h3>
            </CardHeader>
            <CardBody className="space-y-4 p-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Attendance Rate (30d)</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {dashboardData.hr.attendanceRate}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-500 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Pending Leaves</span>
                </div>
                <span className="text-2xl font-bold text-teal-600">
                  {dashboardData.hr.pendingLeaves}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-500 p-2 rounded-lg">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Pending Claims</span>
                </div>
                <span className="text-2xl font-bold text-pink-600">
                  {dashboardData.hr.pendingClaims}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* KPIs Performance */}
        <Card className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardBody className="p-8">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm font-medium opacity-90 mb-2">KPIs Achievement Rate</p>
                <p className="text-6xl font-bold mb-3">
                  {dashboardData.kpis.achievementRate.toFixed(1)}%
                </p>
                <p className="text-sm opacity-90 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {dashboardData.kpis.achieved} of {dashboardData.kpis.total} KPIs achieved
                </p>
              </div>
              <div className="relative">
                <Target className="w-32 h-32 opacity-20 absolute" />
                <Target className="w-32 h-32 opacity-40" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
