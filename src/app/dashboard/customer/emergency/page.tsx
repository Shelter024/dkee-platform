'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, Phone, MapPin, Clock, CheckCircle, Loader2 } from 'lucide-react';

interface EmergencyRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  user: {
    name: string;
    email: string;
    phone?: string | null;
  };
}

export default function CustomerEmergency() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState('MEDIUM');
  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    description: '',
    phone: '',
  });

  useEffect(() => {
    fetchEmergencyRequests();
  }, []);

  const fetchEmergencyRequests = async () => {
    try {
      const res = await fetch('/api/emergency');
      if (res.ok) {
        const data = await res.json();
        setEmergencyRequests(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch emergency requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <Badge variant="danger">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="danger">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Medium</Badge>;
      case 'LOW':
        return <Badge variant="info">Low</Badge>;
      default:
        return <Badge>{urgency}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">In Progress</Badge>;
      case 'ASSIGNED':
        return <Badge variant="info">Assigned</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="w-5 h-5 text-brand-navy-600" />;
      case 'IN_PROGRESS':
      case 'ASSIGNED':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'PENDING':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.type,
          description: formData.description,
          location: formData.location,
          priority: urgencyLevel,
          contactPhone: formData.phone,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(result.message || 'Emergency request submitted successfully!');
        setShowRequestForm(false);
        setFormData({ type: '', location: '', description: '', phone: '' });
        setUrgencyLevel('MEDIUM');
        fetchEmergencyRequests(); // Refresh list
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to submit emergency request');
      }
    } catch (error) {
      console.error('Error submitting emergency request:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Emergency Banner */}
      <Card className="bg-gradient-to-r from-brand-red-50 to-brand-red-100 border-brand-red-200">
        <CardBody>
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-brand-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-brand-red-900 mb-2">
                Emergency Assistance
              </h2>
              <p className="text-brand-red-800 mb-4">
                Need immediate help? Request emergency assistance and our team will respond quickly.
              </p>
              <div className="flex items-center space-x-4 text-sm text-brand-red-800">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span className="font-semibold">Emergency Hotline: +233 XX XXX XXXX</span>
                </div>
                <span>•</span>
                <span>24/7 Available</span>
              </div>
            </div>
            <Button
              onClick={() => setShowRequestForm(!showRequestForm)}
              variant="danger"
              size="lg"
            >
              Request Help
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Emergency Request Form */}
      {showRequestForm && (
        <Card className="border-brand-red-200 bg-brand-red-50">
          <CardHeader>
            <h3 className="text-lg font-semibold text-brand-red-900">
              Emergency Assistance Request
            </h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="">Select emergency type...</option>
                  <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                  <option value="Roadside Assistance">Roadside Assistance</option>
                  <option value="Accident">Accident</option>
                  <option value="Flat Tire">Flat Tire</option>
                  <option value="Battery Dead">Battery Dead</option>
                  <option value="Engine Overheating">Engine Overheating</option>
                  <option value="Property Emergency">Property Emergency</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setUrgencyLevel(level)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        urgencyLevel === level
                          ? 'border-brand-red-600 bg-brand-red-50 text-brand-red-900 font-semibold'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Your Location"
                placeholder="Enter your current location..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />

              <TextArea
                label="Description"
                placeholder="Describe your emergency in detail..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />

              <Input
                label="Contact Phone"
                type="tel"
                placeholder="+233 XX XXX XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />

              <div className="flex items-center space-x-3 pt-2">
                <Button type="submit" variant="danger" className="flex-1" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  {submitting ? 'Submitting...' : 'Submit Emergency Request'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Active Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Emergency Request History</h3>
            <Badge variant="info">{emergencyRequests.length} Total</Badge>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600">Loading requests...</span>
            </div>
          ) : emergencyRequests.length > 0 ? (
            <div className="space-y-4 animate-stagger">
              {emergencyRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        request.status === 'RESOLVED'
                          ? 'bg-brand-navy-100'
                          : request.priority === 'CRITICAL'
                          ? 'bg-brand-red-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{request.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {getUrgencyBadge(request.priority)}
                          {getStatusBadge(request.status)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{request.location}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Reported: {formatTime(request.createdAt)}</span>
                        </div>
                        {request.resolvedAt && (
                          <span className="text-brand-navy-600 font-medium">
                            Resolved: {formatTime(request.resolvedAt)}
                          </span>
                        )}
                      </div>

                      {request.status === 'IN_PROGRESS' && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900 font-medium">
                            🚗 Help is on the way! Our team has been dispatched to your location.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Emergency Requests</h3>
              <p className="text-gray-600">
                You haven't made any emergency requests. We hope you never need to!
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
