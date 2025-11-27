'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Clock,
  Filter,
  Download,
  Plus,
  Search,
  FileText,
} from 'lucide-react';

interface Transaction {
  id: string;
  transactionNumber: string;
  transactionType: string;
  transactionDate: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  accountCode?: string;
  category?: string;
  department?: string;
  requestedBy: {
    name: string;
    email: string;
    staffId?: string;
  };
  approvedBy?: {
    name: string;
    staffId?: string;
  };
  isReconciled: boolean;
}

export default function FinanceTransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.append('status', filter);

      const response = await fetch(`/api/finance/transactions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      if (response.ok) {
        fetchTransactions();
        alert('Transaction approved successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve transaction');
      }
    } catch (error) {
      alert('Error approving transaction');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: reason,
        }),
      });

      if (response.ok) {
        fetchTransactions();
        alert('Transaction rejected');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject transaction');
      }
    } catch (error) {
      alert('Error rejecting transaction');
    }
  };

  const handlePost = async (id: string) => {
    if (!confirm('Post this transaction to the ledger?')) return;

    try {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'POST' }),
      });

      if (response.ok) {
        fetchTransactions();
        alert('Transaction posted successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to post transaction');
      }
    } catch (error) {
      alert('Error posting transaction');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      PENDING: { variant: 'warning', icon: Clock },
      APPROVED: { variant: 'success', icon: Check },
      REJECTED: { variant: 'error', icon: X },
      POSTED: { variant: 'info', icon: FileText },
    };

    const config = statusConfig[status] || { variant: 'default', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'EXPENSE':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredTransactions = transactions.filter((txn) =>
    txn.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.requestedBy.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    pending: transactions.filter((t) => t.status === 'PENDING').length,
    approved: transactions.filter((t) => t.status === 'APPROVED').length,
    posted: transactions.filter((t) => t.status === 'POSTED').length,
    totalAmount: transactions
      .filter((t) => t.status === 'POSTED')
      .reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-emerald-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Financial Transactions
            </h2>
            <p className="text-gray-600 text-lg">Manage income, expenses, and transfers</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus className="w-6 h-6" />
            New Transaction
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Pending</p>
                  <p className="text-5xl font-bold">{stats.pending}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Clock className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Approved</p>
                  <p className="text-5xl font-bold">{stats.approved}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Check className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Posted</p>
                  <p className="text-5xl font-bold">{stats.posted}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <FileText className="w-10 h-10" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 border-0 shadow-2xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <CardBody>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-medium opacity-90 mb-1">Total Posted</p>
                  <p className="text-4xl font-bold">
                    ₦{stats.totalAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by transaction number, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'ALL' ? 'primary' : 'outline'}
                onClick={() => setFilter('ALL')}
              >
                All
              </Button>
              <Button
                variant={filter === 'PENDING' ? 'primary' : 'outline'}
                onClick={() => setFilter('PENDING')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'APPROVED' ? 'primary' : 'outline'}
                onClick={() => setFilter('APPROVED')}
              >
                Approved
              </Button>
              <Button
                variant={filter === 'POSTED' ? 'primary' : 'outline'}
                onClick={() => setFilter('POSTED')}
              >
                Posted
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Transactions</h3>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-center py-8">Loading transactions...</p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No transactions found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Transaction #
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Requested By
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {transaction.transactionNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.transactionType)}
                          <span className="text-sm">{transaction.transactionType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {transaction.currency} {transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{transaction.requestedBy.name}</p>
                          {transaction.requestedBy.staffId && (
                            <p className="text-xs text-gray-500">
                              {transaction.requestedBy.staffId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(transaction.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {transaction.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="accent"
                                onClick={() => handleApprove(transaction.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleReject(transaction.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {transaction.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handlePost(transaction.id)}
                            >
                              Post
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
