'use client';

import { useState, useEffect } from 'react';
import CloudinaryUploader from './CloudinaryUploader';
import { Input } from '@/components/ui/Input';

interface UploadedImage {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  alt?: string;
}

interface ImageFieldProps {
  label: string;
  value?: string;
  onChange: (url: string, alt?: string) => void;
  cloudName: string;
  uploadPreset: string;
  folder?: string;
  required?: boolean;
  description?: string;
  cropping?: boolean;
  aspectRatio?: number;
}

export default function ImageField({
  label,
  value,
  onChange,
  cloudName,
  uploadPreset,
  folder,
  required = false,
  description,
  cropping = false,
  aspectRatio,
}: ImageFieldProps) {
  const [imageUrl, setImageUrl] = useState(value || '');
  const [altText, setAltText] = useState('');
  const [showUploader, setShowUploader] = useState(!value);

  useEffect(() => {
    setImageUrl(value || '');
    setShowUploader(!value);
  }, [value]);

  const handleUpload = (images: UploadedImage[]) => {
    if (images.length > 0) {
      const image = images[0];
      setImageUrl(image.url);
      setAltText(image.alt || '');
      onChange(image.url, image.alt);
      setShowUploader(false);
    }
  };

  const handleRemove = () => {
    setImageUrl('');
    setAltText('');
    onChange('');
    setShowUploader(true);
  };

  const handleAltChange = (newAlt: string) => {
    setAltText(newAlt);
    onChange(imageUrl, newAlt);
  };

  const existingImages: UploadedImage[] = imageUrl
    ? [
        {
          publicId: imageUrl.split('/').pop()?.split('.')[0] || '',
          url: imageUrl,
          width: 0,
          height: 0,
          format: imageUrl.split('.').pop() || 'jpg',
          bytes: 0,
          alt: altText,
        },
      ]
    : [];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && <p className="text-sm text-gray-500">{description}</p>}

      {showUploader ? (
        <CloudinaryUploader
          cloudName={cloudName}
          uploadPreset={uploadPreset}
          onUpload={handleUpload}
          folder={folder}
          accept="image"
          cropping={cropping}
          aspectRatio={aspectRatio}
        />
      ) : (
        <div className="space-y-2">
          <div className="relative group">
            <img src={imageUrl} alt={altText || label} className="w-full h-48 object-cover rounded-lg" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Remove
            </button>
          </div>
          <Input
            label="Alt Text (for accessibility)"
            value={altText}
            onChange={(e) => handleAltChange(e.target.value)}
            placeholder="Describe this image for screen readers"
          />
        </div>
      )}
    </div>
  );
}
