'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Plus,
  Calendar,
} from 'lucide-react';
import PropertyServiceForms from '@/components/property/PropertyServiceForms';

interface PropertyRequest {
  id: string;
  requestNumber: string;
  serviceType: string;
  status: string;
  email: string;
  phone: string;
  formData: any;
  isDraft: boolean;
  submittedAt?: string;
  reviewedAt?: string;
  completedAt?: string;
  createdAt: string;
  documents: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
  }>;
}

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'SUBMITTED'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<PropertyRequest | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter === 'DRAFT') {
        params.append('isDraft', 'true');
      } else if (filter === 'SUBMITTED') {
        params.append('isDraft', 'false');
      }

      const response = await fetch(`/api/property-requests?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isDraft: boolean) => {
    if (isDraft) {
      return <Badge variant="default">DRAFT</Badge>;
    }

    const variants: any = {
      SUBMITTED: 'info',
      IN_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      COMPLETED: 'success',
      CANCELLED: 'default',
    };

    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const getStatusIcon = (status: string, isDraft: boolean) => {
    if (isDraft) {
      return <FileText className="w-5 h-5 text-gray-500" />;
    }

    const icons: any = {
      SUBMITTED: <Clock className="w-5 h-5 text-blue-500" />,
      IN_REVIEW: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      APPROVED: <CheckCircle className="w-5 h-5 text-green-500" />,
      REJECTED: <XCircle className="w-5 h-5 text-red-500" />,
      COMPLETED: <CheckCircle className="w-5 h-5 text-green-600" />,
      CANCELLED: <XCircle className="w-5 h-5 text-gray-500" />,
    };

    return icons[status] || <FileText className="w-5 h-5 text-gray-500" />;
  };

  const getServiceTypeDisplay = (serviceType: string) => {
    const mapping: any = {
      SALES: 'Property Sales',
      LEASING: 'Property Leasing',
      SURVEY: 'Property Survey',
      VALUATION: 'Property Valuation',
      CONSULTATION: 'Property Consultation',
      MANAGEMENT: 'Property Management',
    };
    return mapping[serviceType] || serviceType;
  };

  const handleViewRequest = (request: PropertyRequest) => {
    setSelectedRequest(request);
    setShowFormModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-rose-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              My Property Requests
            </h2>
            <p className="text-gray-600 text-lg">Track and manage your property service requests</p>
          </div>
          <Button 
            onClick={() => setShowNewForm(true)}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus className="w-6 h-6" />
            New Request
          </Button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <Button
            onClick={() => setFilter('ALL')}
            className={filter === 'ALL' 
              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg' 
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-rose-300 px-8 py-3 rounded-xl font-semibold'}
          >
            All Requests
          </Button>
          <Button
            onClick={() => setFilter('DRAFT')}
            className={filter === 'DRAFT' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg' 
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-300 px-8 py-3 rounded-xl font-semibold'}
          >
            Drafts
          </Button>
          <Button
            onClick={() => setFilter('SUBMITTED')}
            className={filter === 'SUBMITTED' 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg' 
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 px-8 py-3 rounded-xl font-semibold'}
          >
            Submitted
          </Button>
        </div>

        {/* Requests List */}
        {loading ? (
          <Card className="bg-white rounded-2xl shadow-xl border-0">
            <CardBody className="p-12">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-4 h-4 bg-rose-500 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-gray-600 text-center mt-4 text-lg">Loading your requests...</p>
            </CardBody>
          </Card>
        ) : requests.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-xl border-0">
            <CardBody className="text-center py-16">
              <div className="bg-gradient-to-br from-rose-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-rose-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Requests Found</h3>
              <p className="text-gray-600 mb-6 text-lg">
                {filter === 'DRAFT'
                  ? "You don't have any draft requests."
                  : filter === 'SUBMITTED'
                  ? "You haven't submitted any requests yet."
                  : 'Get started by creating a new property service request.'}
              </p>
              <Button 
                onClick={() => setShowNewForm(true)}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Request
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-rose-300 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(request.status, request.isDraft)}
                    <div>
                      <h3 className="text-lg font-semibold">{request.requestNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {getServiceTypeDisplay(request.serviceType)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status, request.isDraft)}
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {request.submittedAt && (
                    <div>
                      <p className="text-gray-500">Submitted</p>
                      <p className="font-medium">
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {request.completedAt && (
                    <div>
                      <p className="text-gray-500">Completed</p>
                      <p className="font-medium">
                        {new Date(request.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {request.documents && request.documents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Attached Documents ({request.documents.length})
                    </p>
                    <div className="space-y-2">
                      {request.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.fileName}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                            </div>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-red-600 hover:text-brand-red-700"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {!request.isDraft && (
                  <div className="border-l-2 border-gray-300 pl-4 space-y-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Request Submitted</p>
                        <p className="text-xs text-gray-500">
                          {new Date(request.submittedAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {request.reviewedAt && (
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Under Review</p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.reviewedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {request.completedAt && (
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Request Completed</p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.completedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {!request.reviewedAt && !request.completedAt && (
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Pending Review</p>
                          <p className="text-xs text-gray-500">
                            Our team will review your request soon
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleViewRequest(request)}>
                    <Eye className="w-4 h-4 mr-1" />
                    {request.isDraft ? 'Continue Editing' : 'View Details'}
                  </Button>
                  {request.isDraft && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Delete draft functionality
                        if (confirm('Are you sure you want to delete this draft?')) {
                          fetch(`/api/property-requests?requestId=${request.id}`, {
                            method: 'DELETE',
                          }).then(() => fetchRequests());
                        }
                      }}
                    >
                      Delete Draft
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal for Viewing/Editing */}
      {showFormModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <PropertyServiceForms
              isOpen={showFormModal}
              serviceType={selectedRequest.serviceType || 'Property Management'}
              onClose={() => {
                setShowFormModal(false);
                setSelectedRequest(null);
                fetchRequests();
              }}
              draftData={selectedRequest.formData}
              requestId={selectedRequest.id}
            />
          </div>
        </div>
      )}

      {/* New Form Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <PropertyServiceForms
              isOpen={showNewForm}
              serviceType="Property Management"
              onClose={() => {
                setShowNewForm(false);
                fetchRequests();
              }}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
