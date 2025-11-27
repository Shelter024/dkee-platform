'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload, X, Loader2, FileText, Image } from 'lucide-react';

interface DocumentUploadFormProps {
  /**
   * Either invoiceId or automotiveServiceId is required
   */
  invoiceId?: string;
  automotiveServiceId?: string;
  /**
   * Document type: INVOICE_SCAN, RECEIPT_SCAN, JOBCARD_SCAN
   */
  documentType: 'INVOICE_SCAN' | 'RECEIPT_SCAN' | 'JOBCARD_SCAN';
  /**
   * Called after successful upload
   */
  onUploadSuccess?: () => void;
  /**
   * Metadata fields to collect (optional)
   */
  showMetadata?: boolean;
}

export default function DocumentUploadForm({
  invoiceId,
  automotiveServiceId,
  documentType,
  onUploadSuccess,
  showMetadata = true,
}: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Metadata fields
  const [warrantyMonths, setWarrantyMonths] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Allowed: JPG, PNG, WEBP, PDF');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!invoiceId && !automotiveServiceId) {
      setError('Missing invoice or service ID');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      // Determine folder based on document type
      const folderMap = {
        INVOICE_SCAN: 'invoices/manual',
        RECEIPT_SCAN: 'receipts/manual',
        JOBCARD_SCAN: 'jobcards/manual',
      };
      formData.append('folder', folderMap[documentType]);

      if (invoiceId) {
        formData.append('invoiceId', invoiceId);
      }
      if (automotiveServiceId) {
        formData.append('automotiveServiceId', automotiveServiceId);
      }

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();

      // Update metadata if provided
      if (showMetadata && (warrantyMonths || discountPercentage || discountAmount || discountReason)) {
        const metadataPayload: any = {};

        if (warrantyMonths) metadataPayload.warrantyMonths = parseInt(warrantyMonths);
        if (discountPercentage) metadataPayload.discountPercentage = parseFloat(discountPercentage);
        if (discountAmount) metadataPayload.discountAmount = parseFloat(discountAmount);
        if (discountReason) metadataPayload.discountReason = discountReason;

        // Update invoice or service with metadata
        if (invoiceId && Object.keys(metadataPayload).length > 0) {
          await fetch(`/api/invoices/${invoiceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadataPayload),
          });
        } else if (automotiveServiceId && Object.keys(metadataPayload).length > 0) {
          await fetch(`/api/services/${automotiveServiceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadataPayload),
          });
        }
      }

      // Reset form
      setFile(null);
      setPreview(null);
      setWarrantyMonths('');
      setDiscountPercentage('');
      setDiscountAmount('');
      setDiscountReason('');

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const getDocumentLabel = () => {
    switch (documentType) {
      case 'INVOICE_SCAN':
        return 'Invoice';
      case 'RECEIPT_SCAN':
        return 'Receipt';
      case 'JOBCARD_SCAN':
        return 'Job Card';
      default:
        return 'Document';
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900">
        Upload {getDocumentLabel()} Scan
      </h3>

      {/* File Input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Select File (Image or PDF)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
          >
            <Upload size={18} />
            Choose File
          </label>
          {file && (
            <span className="text-sm text-neutral-600 flex items-center gap-2">
              {file.type.startsWith('image/') ? (
                <Image size={16} />
              ) : (
                <FileText size={16} />
              )}
              {file.name}
              <button
                onClick={handleClearFile}
                className="text-brand-red-600 hover:text-brand-red-700"
                disabled={uploading}
              >
                <X size={16} />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="border border-neutral-200 rounded-lg p-4">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-64 object-contain mx-auto"
          />
        </div>
      )}

      {/* Metadata Fields */}
      {showMetadata && (
        <div className="space-y-3 pt-2 border-t border-neutral-200">
          <h4 className="text-sm font-semibold text-neutral-800">
            Additional Information (Optional)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Warranty Period (Months)"
              placeholder="e.g. 3, 6, 12"
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value)}
              min="0"
              disabled={uploading}
            />

            <Input
              type="number"
              label="Discount Percentage (%)"
              placeholder="e.g. 10, 15"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              min="0"
              max="100"
              step="0.01"
              disabled={uploading}
            />

            <Input
              type="number"
              label="Discount Amount (GHS)"
              placeholder="e.g. 50.00"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              min="0"
              step="0.01"
              disabled={uploading}
            />

            <Input
              type="text"
              label="Discount Reason"
              placeholder="e.g. Loyalty customer, Promotional"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              disabled={uploading}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          variant="accent"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} className="mr-2" />
              Upload {getDocumentLabel()}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
