'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Lock,
  Unlock,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface ExclusiveAssignment {
  id: string;
  assignmentNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceType: string;
  assignmentTitle: string;
  transactionStatus: string;
  priority: string;
  estimatedValue?: number;
  actualValue?: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  totalInteractions: number;
  assignedAt: string;
  expectedCompletionDate?: string;
  interactions: any[];
  documents: any[];
}

export default function ExclusiveClientsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<ExclusiveAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAssignment, setSelectedAssignment] = useState<ExclusiveAssignment | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/exclusive-clients?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to close this assignment? This will unlock the client.')) {
      return;
    }

    try {
      const response = await fetch('/api/exclusive-clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          action: 'CLOSE',
          closureReason: 'Transaction completed by staff',
        }),
      });

      if (response.ok) {
        alert('Assignment closed successfully');
        fetchAssignments();
        setSelectedAssignment(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to close assignment');
      }
    } catch (error) {
      console.error('Error closing assignment:', error);
      alert('Failed to close assignment');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      ACTIVE: 'success',
      PENDING_COMPLETION: 'warning',
      COMPLETED: 'info',
      CANCELLED: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: any = {
      LOW: 'default',
      NORMAL: 'info',
      HIGH: 'warning',
      URGENT: 'danger',
    };
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.assignmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    total: assignments.length,
    active: assignments.filter((a) => a.transactionStatus === 'ACTIVE').length,
    pending: assignments.filter((a) => a.transactionStatus === 'PENDING_COMPLETION').length,
    completed: assignments.filter((a) => a.transactionStatus === 'COMPLETED').length,
    totalValue: assignments.reduce((sum, a) => sum + (a.estimatedValue || 0), 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Exclusive Clients</h2>
          <p className="text-gray-600 mt-1">Manage your exclusively assigned clients</p>
        </div>
        <Button onClick={() => setShowOnboardModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Onboard New Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center space-x-3">
              <DollarSign className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by client name, email, or assignment number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ALL')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'PENDING_COMPLETION' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('PENDING_COMPLETION')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'COMPLETED' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('COMPLETED')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Assignments List */}
      {loading ? (
        <Card>
          <CardBody>
            <p className="text-gray-600">Loading assignments...</p>
          </CardBody>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exclusive Clients</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'No clients match your search'
                : 'Start by onboarding your first exclusive client'}
            </p>
            <Button onClick={() => setShowOnboardModal(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Onboard Client
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover-lift">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lock className="w-5 h-5 text-brand-red-600" />
                      <h3 className="text-lg font-semibold">{assignment.clientName}</h3>
                      {getStatusBadge(assignment.transactionStatus)}
                      {getPriorityBadge(assignment.priority)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{assignment.assignmentTitle}</p>
                    <p className="text-xs text-gray-500 font-mono">{assignment.assignmentNumber}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{assignment.clientEmail}</span>
                  </div>
                  {assignment.clientPhone && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{assignment.clientPhone}</span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <MessageSquare className="w-4 h-4 mx-auto mb-1 text-gray-600" />
                    <p className="font-bold">{assignment.totalInteractions}</p>
                    <p className="text-xs text-gray-500">Interactions</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <FileText className="w-4 h-4 mx-auto mb-1 text-gray-600" />
                    <p className="font-bold">{assignment.documents?.length || 0}</p>
                    <p className="text-xs text-gray-500">Documents</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-gray-600" />
                    <p className="font-bold">
                      ${(assignment.estimatedValue || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Est. Value</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Assigned:</span>
                    <span className="font-medium">
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {assignment.lastContactDate && (
                    <div className="flex items-center justify-between">
                      <span>Last Contact:</span>
                      <span className="font-medium">
                        {new Date(assignment.lastContactDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {assignment.nextFollowUpDate && (
                    <div className="flex items-center justify-between text-orange-600">
                      <span>Next Follow-up:</span>
                      <span className="font-medium">
                        {new Date(assignment.nextFollowUpDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowInteractionModal(true);
                    }}
                    className="flex-1"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Add Interaction
                  </Button>
                  {assignment.transactionStatus === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleCloseAssignment(assignment.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Onboard Modal - Placeholder */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Onboard Exclusive Client</h3>
                <button
                  onClick={() => setShowOnboardModal(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 mb-4">
                Onboarding form will be implemented here. This will allow you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Search and select a client</li>
                <li>Choose service type (Property, Automotive, etc.)</li>
                <li>Set assignment title and description</li>
                <li>Configure email and SMS alerts</li>
                <li>Set estimated value and expected completion date</li>
                <li>Lock the client exclusively to you</li>
              </ul>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setShowOnboardModal(false)}>Close</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
