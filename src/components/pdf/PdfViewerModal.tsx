"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type PdfViewerModalProps = {
  open: boolean;
  onClose: () => void;
  url?: string | null;
  title?: string;
};

export function PdfViewerModal({ open, onClose, url, title }: PdfViewerModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-[95vw] h-[90vh] max-w-5xl rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 truncate">
            {title || 'Document Viewer'}
          </h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="w-full h-full">
          {url ? (
            <iframe
              title={title || 'PDF'}
              src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No document available
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
