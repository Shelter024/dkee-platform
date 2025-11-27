'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  MessageSquare,
} from 'lucide-react';
import PropertyServiceForms from '@/components/property/PropertyServiceForms';

export default function PropertyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    serviceType: '',
    search: '',
  });
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.serviceType) params.append('serviceType', filter.serviceType);

      const response = await fetch(`/api/property-requests?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        let filtered = data.requests || [];
        if (filter.search) {
          filtered = filtered.filter((req: any) =>
            req.requestNumber.toLowerCase().includes(filter.search.toLowerCase()) ||
            req.email.toLowerCase().includes(filter.search.toLowerCase()) ||
            req.submittedBy?.toLowerCase().includes(filter.search.toLowerCase())
          );
        }
        setRequests(filtered);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      IN_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      COMPLETED: 'success',
      CANCELLED: 'default',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setShowForm(true);
  };

  const handlePrintRequest = (request: any) => {
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Property Request - ${request.requestNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .header { background: linear-gradient(to right, #dc2626, #b91c1c); color: white; padding: 20px; margin-bottom: 30px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Property Request Form</h1>
              <p>Request Number: ${request.requestNumber}</p>
            </div>
            <div class="field"><span class="label">Service Type:</span> ${request.serviceType}</div>
            <div class="field"><span class="label">Status:</span> ${request.status}</div>
            <div class="field"><span class="label">Submitted By:</span> ${request.submittedBy}</div>
            <div class="field"><span class="label">Email:</span> ${request.email}</div>
            <div class="field"><span class="label">Phone:</span> ${request.phone}</div>
            <h3>Form Data:</h3>
            <pre>${JSON.stringify(request.formData, null, 2)}</pre>
            <button onclick="window.print()">Print</button>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Requests</h2>
          <p className="text-gray-600 mt-1">Manage and review property service requests</p>
        </div>
        <Button onClick={() => {
          setSelectedRequest(null);
          setShowForm(true);
        }}>
          <FileText className="w-4 h-4 mr-2" />
          Create Blank Form
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Request #, email, name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                value={filter.serviceType}
                onChange={(e) => setFilter({ ...filter, serviceType: e.target.value })}
              >
                <option value="">All Services</option>
                <option value="PROPERTY_SALES">Property Sales</option>
                <option value="LEASING_RENTAL">Leasing & Rental</option>
                <option value="PROPERTY_SURVEY">Property Survey</option>
                <option value="PROPERTY_VALUATION">Property Valuation</option>
                <option value="CONSULTATION">Consultation</option>
                <option value="PROPERTY_MANAGEMENT">Property Management</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilter({ status: '', serviceType: '', search: '' })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Requests List */}
      {loading ? (
        <Card>
          <CardBody>
            <p className="text-gray-600">Loading requests...</p>
          </CardBody>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Found</h3>
            <p className="text-gray-600">
              No property requests match your filters.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover-lift">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-brand-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.requestNumber}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.serviceType.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          {getStatusBadge(request.status)}
                          {request.isDraft && <Badge variant="default">Draft</Badge>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-3">
                        <div>
                          <p className="font-medium text-gray-900">Customer</p>
                          <p>{request.submittedBy || 'Guest'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Email</p>
                          <p>{request.email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Phone</p>
                          <p>{request.phone}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Submitted</p>
                          <p>
                            {request.submittedAt
                              ? new Date(request.submittedAt).toLocaleDateString()
                              : 'Draft'}
                          </p>
                        </div>
                      </div>

                      {request.documents?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">
                            {request.documents.length} Document(s) Attached
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintRequest(request)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Print
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Comments ({request.comments?.length || 0})
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <PropertyServiceForms
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedRequest(null);
            fetchRequests();
          }}
          serviceType={selectedRequest?.serviceType.replace(/_/g, ' ') || 'Property Sales'}
          draftData={selectedRequest?.formData}
          requestId={selectedRequest?.id}
        />
      )}
    </div>
  );
}
