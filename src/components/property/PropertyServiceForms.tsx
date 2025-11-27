'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, TextArea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { X, Download, Send, Building2, Key, FileText, TrendingUp, Home, MapPin, Upload, Trash2, Save, CheckCircle } from 'lucide-react';

interface PropertyServiceFormsProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: string;
  draftData?: any; // Pre-fill with draft data
  requestId?: string; // Existing request ID for updates
}

export default function PropertyServiceForms({ isOpen, onClose, serviceType, draftData, requestId }: PropertyServiceFormsProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<any>(draftData || {});
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (draftData) {
      setFormData(draftData);
    }
  }, [draftData]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const getServiceTypeEnum = () => {
    const mapping: any = {
      'Property Sales': 'PROPERTY_SALES',
      'Leasing & Rental': 'LEASING_RENTAL',
      'Property Survey': 'PROPERTY_SURVEY',
      'Property Valuation': 'PROPERTY_VALUATION',
      'Consultation': 'CONSULTATION',
      'Property Management': 'PROPERTY_MANAGEMENT',
    };
    return mapping[serviceType] || 'PROPERTY_SALES';
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    
    if (isDraft) {
      setSavingDraft(true);
    } else {
      setSubmitting(true);
    }
    
    try {
      // Validate required fields for submission (not for draft)
      if (!isDraft) {
        if (!formData.fullName || !formData.email || !formData.phone) {
          setMessage({ type: 'error', text: 'Please fill in all required fields' });
          return;
        }
      }

      const payload = {
        serviceType: getServiceTypeEnum(),
        formData,
        email: formData.email || session?.user?.email || '',
        phone: formData.phone || '',
        isDraft,
        submittedBy: formData.fullName || session?.user?.name || 'Guest',
      };

      const url = requestId 
        ? '/api/property-requests'
        : '/api/property-requests';
      
      const method = requestId ? 'PUT' : 'POST';
      const body = requestId ? { id: requestId, ...payload } : payload;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setMessage({ 
        type: 'success', 
        text: isDraft 
          ? 'Draft saved successfully!' 
          : 'Form submitted successfully! We will contact you shortly.' 
      });

      // Close after 2 seconds for submissions, keep open for drafts
      if (!isDraft) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to submit form' });
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!requestId) {
      setMessage({ type: 'error', text: 'Please save as draft first before uploading files' });
      return;
    }

    setUploadingFile(true);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyRequestId', requestId);

      const response = await fetch('/api/property-requests/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setUploadedFiles(prev => [...prev, data.document]);
      setMessage({ type: 'success', text: 'File uploaded successfully' });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload file' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileDelete = async (docId: string) => {
    try {
      const response = await fetch(`/api/property-requests/documents?id=${docId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete file');
      }

      setUploadedFiles(prev => prev.filter(f => f.id !== docId));
      setMessage({ type: 'success', text: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete file' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderForm = () => {
    switch (serviceType) {
      case 'Property Sales':
        return <PropertySalesForm formData={formData} onChange={handleInputChange} />;
      case 'Leasing & Rental':
        return <LeasingRentalForm formData={formData} onChange={handleInputChange} />;
      case 'Property Survey':
        return <PropertySurveyForm formData={formData} onChange={handleInputChange} />;
      case 'Property Valuation':
        return <PropertyValuationForm formData={formData} onChange={handleInputChange} />;
      case 'Consultation':
        return <ConsultationForm formData={formData} onChange={handleInputChange} />;
      case 'Property Management':
        return <PropertyManagementForm formData={formData} onChange={handleInputChange} />;
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (serviceType) {
      case 'Property Sales':
        return Building2;
      case 'Leasing & Rental':
        return Key;
      case 'Property Survey':
        return FileText;
      case 'Property Valuation':
        return TrendingUp;
      case 'Consultation':
        return Home;
      case 'Property Management':
        return MapPin;
      default:
        return Building2;
    }
  };

  const Icon = getIcon();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-black/50 backdrop-blur-sm print:bg-white print:static print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in print:shadow-none print:max-h-none print:overflow-visible">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-brand-red-600 to-brand-red-800 text-white p-6 rounded-t-2xl flex items-center justify-between print:static print:bg-gradient-to-r print:from-brand-red-600 print:to-brand-red-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{serviceType} Request Form</h2>
              <p className="text-brand-red-100 text-sm">Please fill out all required fields</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors print:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-6">
          {/* Success/Error Message */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          )}

          {renderForm()}

          {/* File Upload Section */}
          <Card className="print:hidden">
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Supporting Documents</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload relevant documents (PDF, Images, Word) - Max 10MB per file
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-red-50 file:text-brand-red-700 hover:file:bg-brand-red-100 cursor-pointer"
                  disabled={uploadingFile || !requestId}
                />
                {!requestId && (
                  <p className="text-sm text-gray-500 mt-2">
                    Save as draft first to enable file uploads
                  </p>
                )}
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{file.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {(file.fileSize / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileDelete(file.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-6 border-t print:hidden">
            <Button
              type="submit"
              disabled={submitting || savingDraft}
              className="flex-1 bg-gradient-to-r from-brand-red-600 to-brand-red-800 hover:from-brand-red-700 hover:to-brand-red-900"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e: any) => handleSubmit(e, true)}
              disabled={submitting || savingDraft}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {savingDraft ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Print Form
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Property Sales Form
function PropertySalesForm({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Personal Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.fullName || ''}
              onChange={(e) => onChange('fullName', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              required
              value={formData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
            />
            <Input
              label="Alternative Phone"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              value={formData.altPhone || ''}
              onChange={(e) => onChange('altPhone', e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Property Details</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.transactionType || ''}
              onChange={(e) => onChange('transactionType', e.target.value)}
            >
              <option value="">Select transaction type</option>
              <option value="buying">Buying</option>
              <option value="selling">Selling</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.propertyType || ''}
              onChange={(e) => onChange('propertyType', e.target.value)}
            >
              <option value="">Select property type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="land">Land</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <Input
            label="Property Location"
            placeholder="e.g., East Legon, Accra"
            required
            value={formData.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Budget/Expected Price (GHS)"
              type="number"
              placeholder="0.00"
              required
              value={formData.budget || ''}
              onChange={(e) => onChange('budget', e.target.value)}
            />
            <Input
              label="Property Size (sq ft)"
              type="number"
              placeholder="0"
              value={formData.size || ''}
              onChange={(e) => onChange('size', e.target.value)}
            />
          </div>

          <TextArea
            label="Additional Requirements"
            placeholder="Describe any specific requirements or preferences..."
            rows={4}
            value={formData.requirements || ''}
            onChange={(e) => onChange('requirements', e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Timeline & Documentation</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Preferred Closing Date"
            type="date"
            value={formData.closingDate || ''}
            onChange={(e) => onChange('closingDate', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Do you have existing land title documentation?
            </label>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="hasDocumentation"
                  value="yes"
                  checked={formData.hasDocumentation === 'yes'}
                  onChange={(e) => onChange('hasDocumentation', e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="hasDocumentation"
                  value="no"
                  checked={formData.hasDocumentation === 'no'}
                  onChange={(e) => onChange('hasDocumentation', e.target.value)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// Leasing & Rental Form
function LeasingRentalForm({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Personal Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.fullName || ''}
              onChange={(e) => onChange('fullName', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              required
              value={formData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
            />
            <Input
              label="Ghana Card Number"
              placeholder="GHA-XXXXXXXXX-X"
              value={formData.ghanaCard || ''}
              onChange={(e) => onChange('ghanaCard', e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Rental Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              I am a <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.userType || ''}
              onChange={(e) => onChange('userType', e.target.value)}
            >
              <option value="">Select your role</option>
              <option value="tenant">Tenant (Looking for property)</option>
              <option value="landlord">Landlord (Have property to rent)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.propertyType || ''}
              onChange={(e) => onChange('propertyType', e.target.value)}
            >
              <option value="">Select property type</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="commercial">Commercial Space</option>
              <option value="office">Office</option>
            </select>
          </div>

          <Input
            label="Preferred Location"
            placeholder="e.g., East Legon, Accra"
            required
            value={formData.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monthly Budget (GHS)"
              type="number"
              placeholder="0.00"
              required
              value={formData.budget || ''}
              onChange={(e) => onChange('budget', e.target.value)}
            />
            <Input
              label="Number of Bedrooms"
              type="number"
              placeholder="0"
              value={formData.bedrooms || ''}
              onChange={(e) => onChange('bedrooms', e.target.value)}
            />
          </div>

          <Input
            label="Desired Move-in Date"
            type="date"
            required
            value={formData.moveInDate || ''}
            onChange={(e) => onChange('moveInDate', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lease Duration Preference
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              value={formData.leaseDuration || ''}
              onChange={(e) => onChange('leaseDuration', e.target.value)}
            >
              <option value="">Select duration</option>
              <option value="1-year">1 Year</option>
              <option value="2-years">2 Years</option>
              <option value="3-years">3 Years</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <TextArea
            label="Special Requirements"
            placeholder="Pet-friendly, parking, security, etc..."
            rows={4}
            value={formData.requirements || ''}
            onChange={(e) => onChange('requirements', e.target.value)}
          />
        </CardBody>
      </Card>
    </div>
  );
}

// Property Survey Form
function PropertySurveyForm({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Client Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.fullName || ''}
              onChange={(e) => onChange('fullName', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              required
              value={formData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
            />
            <Input
              label="Company Name (if applicable)"
              placeholder="ABC Company Ltd"
              value={formData.company || ''}
              onChange={(e) => onChange('company', e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Survey Details</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survey Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.surveyType || ''}
              onChange={(e) => onChange('surveyType', e.target.value)}
            >
              <option value="">Select survey type</option>
              <option value="boundary">Boundary Survey</option>
              <option value="topographical">Topographical Survey</option>
              <option value="building">Building/Structural Survey</option>
              <option value="land">Land Survey</option>
              <option value="cadastral">Cadastral Survey</option>
            </select>
          </div>

          <Input
            label="Property Location/Address"
            placeholder="Full address or plot location"
            required
            value={formData.propertyLocation || ''}
            onChange={(e) => onChange('propertyLocation', e.target.value)}
          />

          <Input
            label="Property Size (Approximate acres/hectares)"
            placeholder="0"
            value={formData.propertySize || ''}
            onChange={(e) => onChange('propertySize', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose of Survey <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.purpose || ''}
              onChange={(e) => onChange('purpose', e.target.value)}
            >
              <option value="">Select purpose</option>
              <option value="purchase">Property Purchase</option>
              <option value="development">Development Planning</option>
              <option value="legal">Legal Documentation</option>
              <option value="boundary-dispute">Boundary Dispute Resolution</option>
              <option value="subdivision">Land Subdivision</option>
            </select>
          </div>

          <Input
            label="Preferred Survey Date"
            type="date"
            required
            value={formData.surveyDate || ''}
            onChange={(e) => onChange('surveyDate', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Do you have existing survey plans?
            </label>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="hasPlans"
                  value="yes"
                  checked={formData.hasPlans === 'yes'}
                  onChange={(e) => onChange('hasPlans', e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="hasPlans"
                  value="no"
                  checked={formData.hasPlans === 'no'}
                  onChange={(e) => onChange('hasPlans', e.target.value)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>

          <TextArea
            label="Additional Information"
            placeholder="Any specific concerns, landmarks, or special requirements..."
            rows={4}
            value={formData.additionalInfo || ''}
            onChange={(e) => onChange('additionalInfo', e.target.value)}
          />
        </CardBody>
      </Card>
    </div>
  );
}

// Property Valuation Form
function PropertyValuationForm({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Client Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.fullName || ''}
              onChange={(e) => onChange('fullName', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              required
              value={formData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
            />
            <Input
              label="Organization (if applicable)"
              placeholder="Company name"
              value={formData.organization || ''}
              onChange={(e) => onChange('organization', e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Valuation Details</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose of Valuation <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.purpose || ''}
              onChange={(e) => onChange('purpose', e.target.value)}
            >
              <option value="">Select purpose</option>
              <option value="sale">Property Sale</option>
              <option value="purchase">Property Purchase</option>
              <option value="mortgage">Mortgage/Loan</option>
              <option value="insurance">Insurance</option>
              <option value="tax">Tax Assessment</option>
              <option value="investment">Investment Analysis</option>
              <option value="legal">Legal Proceedings</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.propertyType || ''}
              onChange={(e) => onChange('propertyType', e.target.value)}
            >
              <option value="">Select property type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="land">Vacant Land</option>
              <option value="mixed">Mixed Use</option>
            </select>
          </div>

          <Input
            label="Property Address"
            placeholder="Complete property address"
            required
            value={formData.propertyAddress || ''}
            onChange={(e) => onChange('propertyAddress', e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Property Size (sq ft)"
              type="number"
              placeholder="0"
              value={formData.propertySize || ''}
              onChange={(e) => onChange('propertySize', e.target.value)}
            />
            <Input
              label="Year Built"
              type="number"
              placeholder="YYYY"
              value={formData.yearBuilt || ''}
              onChange={(e) => onChange('yearBuilt', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Number of Rooms"
              type="number"
              placeholder="0"
              value={formData.rooms || ''}
              onChange={(e) => onChange('rooms', e.target.value)}
            />
            <Input
              label="Number of Bathrooms"
              type="number"
              placeholder="0"
              value={formData.bathrooms || ''}
              onChange={(e) => onChange('bathrooms', e.target.value)}
            />
          </div>

          <Input
            label="Deadline for Valuation Report"
            type="date"
            required
            value={formData.deadline || ''}
            onChange={(e) => onChange('deadline', e.target.value)}
          />

          <TextArea
            label="Property Description & Special Features"
            placeholder="Describe any unique features, recent renovations, or specific concerns..."
            rows={4}
            value={formData.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </CardBody>
      </Card>
    </div>
  );
}

// Consultation Form
function ConsultationForm({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Personal/Company Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.fullName || ''}
              onChange={(e) => onChange('fullName', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              required
              value={formData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
            />
            <Input
              label="Company Name (if applicable)"
              placeholder="Company Ltd"
              value={formData.company || ''}
              onChange={(e) => onChange('company', e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Consultation Details</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consultation Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.consultationType || ''}
              onChange={(e) => onChange('consultationType', e.target.value)}
            >
              <option value="">Select consultation type</option>
              <option value="investment">Investment Advisory</option>
              <option value="market-analysis">Market Analysis</option>
              <option value="development">Development Planning</option>
              <option value="portfolio">Portfolio Management</option>
              <option value="regulatory">Regulatory Compliance</option>
              <option value="feasibility">Feasibility Study</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area of Interest <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.areaOfInterest || ''}
              onChange={(e) => onChange('areaOfInterest', e.target.value)}
            >
              <option value="">Select area</option>
              <option value="residential">Residential Real Estate</option>
              <option value="commercial">Commercial Real Estate</option>
              <option value="industrial">Industrial Properties</option>
              <option value="land">Land Development</option>
              <option value="mixed">Mixed-Use Projects</option>
            </select>
          </div>

          <Input
            label="Investment Budget (GHS)"
            type="number"
            placeholder="0.00"
            value={formData.budget || ''}
            onChange={(e) => onChange('budget', e.target.value)}
          />

          <Input
            label="Preferred Consultation Date"
            type="date"
            required
            value={formData.consultationDate || ''}
            onChange={(e) => onChange('consultationDate', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Consultation Mode
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              value={formData.mode || ''}
              onChange={(e) => onChange('mode', e.target.value)}
            >
              <option value="">Select mode</option>
              <option value="in-person">In-Person Meeting</option>
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>

          <TextArea
            label="Describe Your Consultation Needs"
            placeholder="Tell us about your investment goals, concerns, or specific questions..."
            rows={5}
            required
            value={formData.needs || ''}
            onChange={(e) => onChange('needs', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Have you invested in real estate before?
            </label>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="hasExperience"
                  value="yes"
                  checked={formData.hasExperience === 'yes'}
                  onChange={(e) => onChange('hasExperience', e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="hasExperience"
                  value="no"
                  checked={formData.hasExperience === 'no'}
                  onChange={(e) => onChange('hasExperience', e.target.value)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// Property Management Form
function PropertyManagementForm({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Owner Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.fullName || ''}
              onChange={(e) => onChange('fullName', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
              value={formData.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              required
              value={formData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
            />
            <Input
              label="Alternative Contact"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              value={formData.altPhone || ''}
              onChange={(e) => onChange('altPhone', e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Property Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.propertyType || ''}
              onChange={(e) => onChange('propertyType', e.target.value)}
            >
              <option value="">Select property type</option>
              <option value="single-family">Single Family Home</option>
              <option value="multi-family">Multi-Family Home</option>
              <option value="apartment">Apartment Complex</option>
              <option value="commercial">Commercial Building</option>
              <option value="office">Office Space</option>
              <option value="mixed">Mixed-Use Property</option>
            </select>
          </div>

          <Input
            label="Property Address"
            placeholder="Complete address"
            required
            value={formData.propertyAddress || ''}
            onChange={(e) => onChange('propertyAddress', e.target.value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Number of Units"
              type="number"
              placeholder="0"
              required
              value={formData.units || ''}
              onChange={(e) => onChange('units', e.target.value)}
            />
            <Input
              label="Total Size (sq ft)"
              type="number"
              placeholder="0"
              value={formData.size || ''}
              onChange={(e) => onChange('size', e.target.value)}
            />
            <Input
              label="Year Built"
              type="number"
              placeholder="YYYY"
              value={formData.yearBuilt || ''}
              onChange={(e) => onChange('yearBuilt', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Occupancy Status <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              required
              value={formData.occupancyStatus || ''}
              onChange={(e) => onChange('occupancyStatus', e.target.value)}
            >
              <option value="">Select status</option>
              <option value="vacant">Vacant</option>
              <option value="partially-occupied">Partially Occupied</option>
              <option value="fully-occupied">Fully Occupied</option>
            </select>
          </div>

          <Input
            label="Expected Monthly Rent (GHS)"
            type="number"
            placeholder="0.00"
            value={formData.expectedRent || ''}
            onChange={(e) => onChange('expectedRent', e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Management Services Required</h3>
        </CardHeader>
        <CardBody className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.services?.includes('tenant-management')}
              onChange={(e) => {
                const services = formData.services || [];
                if (e.target.checked) {
                  onChange('services', [...services, 'tenant-management']);
                } else {
                  onChange('services', services.filter((s: string) => s !== 'tenant-management'));
                }
              }}
              className="rounded"
            />
            <span>Tenant Screening & Management</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.services?.includes('rent-collection')}
              onChange={(e) => {
                const services = formData.services || [];
                if (e.target.checked) {
                  onChange('services', [...services, 'rent-collection']);
                } else {
                  onChange('services', services.filter((s: string) => s !== 'rent-collection'));
                }
              }}
              className="rounded"
            />
            <span>Rent Collection</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.services?.includes('maintenance')}
              onChange={(e) => {
                const services = formData.services || [];
                if (e.target.checked) {
                  onChange('services', [...services, 'maintenance']);
                } else {
                  onChange('services', services.filter((s: string) => s !== 'maintenance'));
                }
              }}
              className="rounded"
            />
            <span>Property Maintenance & Repairs</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.services?.includes('inspections')}
              onChange={(e) => {
                const services = formData.services || [];
                if (e.target.checked) {
                  onChange('services', [...services, 'inspections']);
                } else {
                  onChange('services', services.filter((s: string) => s !== 'inspections'));
                }
              }}
              className="rounded"
            />
            <span>Regular Property Inspections</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.services?.includes('financial')}
              onChange={(e) => {
                const services = formData.services || [];
                if (e.target.checked) {
                  onChange('services', [...services, 'financial']);
                } else {
                  onChange('services', services.filter((s: string) => s !== 'financial'));
                }
              }}
              className="rounded"
            />
            <span>Financial Reporting</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.services?.includes('legal')}
              onChange={(e) => {
                const services = formData.services || [];
                if (e.target.checked) {
                  onChange('services', [...services, 'legal']);
                } else {
                  onChange('services', services.filter((s: string) => s !== 'legal'));
                }
              }}
              className="rounded"
            />
            <span>Legal Compliance & Documentation</span>
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Additional Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Desired Start Date"
            type="date"
            required
            value={formData.startDate || ''}
            onChange={(e) => onChange('startDate', e.target.value)}
          />

          <TextArea
            label="Special Requirements or Concerns"
            placeholder="Any specific concerns, current issues, or special requirements..."
            rows={4}
            value={formData.specialRequirements || ''}
            onChange={(e) => onChange('specialRequirements', e.target.value)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
