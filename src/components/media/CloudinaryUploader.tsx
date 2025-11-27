'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: CloudinaryUploadOptions,
        callback: (error: Error | null, result: CloudinaryUploadResult) => void
      ) => CloudinaryWidget;
    };
  }
}

interface CloudinaryUploadOptions {
  cloudName: string;
  uploadPreset: string;
  sources?: string[];
  multiple?: boolean;
  maxFiles?: number;
  resourceType?: string;
  clientAllowedFormats?: string[];
  maxFileSize?: number;
  folder?: string;
  tags?: string[];
  context?: Record<string, string>;
  cropping?: boolean;
  croppingAspectRatio?: number;
  showSkipCropButton?: boolean;
  styles?: {
    palette?: {
      window?: string;
      windowBorder?: string;
      tabIcon?: string;
      menuIcons?: string;
      textDark?: string;
      textLight?: string;
      link?: string;
      action?: string;
      inactiveTabIcon?: string;
      error?: string;
      inProgress?: string;
      complete?: string;
      sourceBg?: string;
    };
    fonts?: {
      default?: string | null;
      "'Poppins', sans-serif"?: string;
    };
  };
}

interface CloudinaryUploadResult {
  event: 'success' | 'queues-end' | 'close' | 'display-changed';
  info: {
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    resource_type: string;
    width: number;
    height: number;
    bytes: number;
    original_filename: string;
    created_at: string;
    etag: string;
    thumbnail_url: string;
    access_mode?: string;
    type?: string;
  };
}

interface CloudinaryWidget {
  open: () => void;
  close: () => void;
  destroy: () => void;
}

interface UploadedImage {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  alt?: string;
}

interface CloudinaryUploaderProps {
  cloudName: string;
  uploadPreset: string;
  onUpload: (images: UploadedImage[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  folder?: string;
  existingImages?: UploadedImage[];
  onRemove?: (publicId: string) => void;
  accept?: 'image' | 'video' | 'all';
  cropping?: boolean;
  aspectRatio?: number;
}

export default function CloudinaryUploader({
  cloudName,
  uploadPreset,
  onUpload,
  multiple = false,
  maxFiles = 10,
  folder = 'dkee-cms',
  existingImages = [],
  onRemove,
  accept = 'image',
  cropping = false,
  aspectRatio,
}: CloudinaryUploaderProps) {
  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(existingImages);

  // Load Cloudinary script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } else if (window.cloudinary) {
      setIsScriptLoaded(true);
    }
  }, []);

  // Initialize widget
  useEffect(() => {
    if (isScriptLoaded && window.cloudinary && !widgetRef.current) {
      const resourceTypes: Record<string, string[]> = {
        image: ['image'],
        video: ['video'],
        all: ['image', 'video', 'raw'],
      };

      const formats: Record<string, string[]> = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif'],
        video: ['mp4', 'webm', 'mov', 'avi'],
        all: [],
      };

      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple,
          maxFiles,
          resourceType: accept === 'all' ? 'auto' : accept,
          clientAllowedFormats: formats[accept].length ? formats[accept] : undefined,
          maxFileSize: 10485760, // 10MB
          folder,
          tags: ['cms', 'user-upload'],
          cropping,
          croppingAspectRatio: aspectRatio,
          showSkipCropButton: true,
          styles: {
            palette: {
              window: '#FFFFFF',
              windowBorder: '#E5E7EB',
              tabIcon: '#3B82F6',
              menuIcons: '#6B7280',
              textDark: '#111827',
              textLight: '#FFFFFF',
              link: '#3B82F6',
              action: '#3B82F6',
              inactiveTabIcon: '#9CA3AF',
              error: '#EF4444',
              inProgress: '#F59E0B',
              complete: '#10B981',
              sourceBg: '#F9FAFB',
            },
            fonts: {
              default: null,
              "'Poppins', sans-serif": 'https://fonts.googleapis.com/css?family=Poppins',
            },
          },
        },
        (error, result) => {
          if (error) {
            console.error('Upload error:', error);
            return;
          }

          if (result.event === 'success' && result.info) {
            const newImage: UploadedImage = {
              publicId: result.info.public_id,
              url: result.info.secure_url,
              width: result.info.width,
              height: result.info.height,
              format: result.info.format,
              bytes: result.info.bytes,
              alt: result.info.original_filename,
            };

            setUploadedImages((prev) => {
              const updated = multiple ? [...prev, newImage] : [newImage];
              return updated;
            });
          }

          if (result.event === 'queues-end') {
            // All uploads complete
            const images = multiple ? uploadedImages : uploadedImages.slice(-1);
            onUpload(images);
          }
        }
      );
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
    };
  }, [isScriptLoaded, cloudName, uploadPreset, multiple, maxFiles, folder, accept, cropping, aspectRatio]);

  // Sync external changes
  useEffect(() => {
    setUploadedImages(existingImages);
  }, [existingImages]);

  const handleOpenWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };

  const handleRemoveImage = (publicId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.publicId !== publicId));
    if (onRemove) {
      onRemove(publicId);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handleOpenWidget}
        disabled={!isScriptLoaded}
        variant="outline"
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {uploadedImages.length > 0 ? 'Upload More' : 'Upload Media'}
      </Button>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {uploadedImages.map((image) => (
            <div key={image.publicId} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img
                src={image.url}
                alt={image.alt || 'Uploaded image'}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image.publicId)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 bg-gray-50 text-xs text-gray-600 truncate">
                {image.format.toUpperCase()} · {(image.bytes / 1024).toFixed(0)}KB
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadedImages.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No media uploaded yet</p>
        </div>
      )}
    </div>
  );
}
