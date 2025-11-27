'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FileText, Image as ImageIcon, Download, Trash2, Loader2, X, Calendar, Tag } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface DocumentFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  documentType?: string;
  createdAt: string;
  automotiveService?: {
    id: string;
    serviceType: string;
    warrantyMonths?: number;
    discountAmount?: number;
    discountReason?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    warrantyMonths?: number;
    discountPercentage?: number;
    discountAmount?: number;
    discountReason?: string;
    total: number;
  };
}

interface DocumentGalleryProps {
  invoiceId?: string;
  automotiveServiceId?: string;
  /**
   * Allow staff/admin to delete files
   */
  allowDelete?: boolean;
  /**
   * Called when files are updated (deleted)
   */
  onUpdate?: () => void;
}

export default function DocumentGallery({
  invoiceId,
  automotiveServiceId,
  allowDelete = false,
  onUpdate,
}: DocumentGalleryProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (invoiceId) params.append('invoiceId', invoiceId);
      if (automotiveServiceId) params.append('automotiveServiceId', automotiveServiceId);

      const response = await fetch(`/api/upload?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err.message || 'Error loading files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [invoiceId, automotiveServiceId]);

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeleting(fileId);

    try {
      const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      // Remove from local state
      setFiles((prev) => prev.filter((f) => f.id !== fileId));

      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentTypeLabel = (type?: string): string => {
    if (!type) return 'Document';
    switch (type) {
      case 'INVOICE_SCAN':
        return 'Invoice';
      case 'RECEIPT_SCAN':
        return 'Receipt';
      case 'JOBCARD_SCAN':
        return 'Job Card';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-brand-navy-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-50 border border-neutral-200 rounded-lg">
        <FileText size={48} className="mx-auto text-neutral-400 mb-3" />
        <p className="text-neutral-600">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {files.map((file) => {
          const isImage = file.mimeType.startsWith('image/');
          const metadata = file.automotiveService || file.invoice;

          return (
            <div
              key={file.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  {isImage ? (
                    <button
                      onClick={() => setSelectedImage(file.url)}
                      className="w-20 h-20 border border-neutral-200 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="w-20 h-20 border border-neutral-200 rounded-lg flex items-center justify-center bg-neutral-50">
                      <FileText size={32} className="text-neutral-400" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-medium text-neutral-900 truncate">
                        {file.originalName}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Tag size={14} />
                          {getDocumentTypeLabel(file.documentType)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(new Date(file.createdAt))}
                        </span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Button size="sm" variant="outline">
                          <Download size={16} />
                        </Button>
                      </a>
                      {allowDelete && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(file.id)}
                          disabled={deleting === file.id}
                        >
                          {deleting === file.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  {metadata && (
                    <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1 text-sm">
                      {file.invoice && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-700">Invoice:</span>
                            <span className="text-neutral-600">{file.invoice.invoiceNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-700">Total:</span>
                            <span className="text-neutral-600">{formatCurrency(file.invoice.total)}</span>
                          </div>
                        </>
                      )}
                      {file.automotiveService && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-700">Service:</span>
                          <span className="text-neutral-600">{file.automotiveService.serviceType}</span>
                        </div>
                      )}
                      {metadata.warrantyMonths && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-700">Warranty:</span>
                          <span className="text-green-600 font-medium">
                            {metadata.warrantyMonths} {metadata.warrantyMonths === 1 ? 'month' : 'months'}
                          </span>
                        </div>
                      )}
                      {('discountPercentage' in metadata || 'discountAmount' in metadata) && 
                       (('discountPercentage' in metadata && metadata.discountPercentage) || metadata.discountAmount) && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-700">Discount:</span>
                          <span className="text-brand-red-600 font-medium">
                            {'discountPercentage' in metadata && metadata.discountPercentage
                              ? `${metadata.discountPercentage}%`
                              : formatCurrency(metadata.discountAmount || 0)}
                          </span>
                          {metadata.discountReason && (
                            <span className="text-neutral-500 text-xs">({metadata.discountReason})</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-neutral-300"
            >
              <X size={32} />
            </button>
            <img
              src={selectedImage}
              alt="Document preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
