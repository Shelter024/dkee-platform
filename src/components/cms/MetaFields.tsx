'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import ImageField from '@/components/media/ImageField';

interface MetaFieldsProps {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
  scheduledPublishAt: string;
  scheduledUnpublishAt: string;
  onChange: (field: string, value: string | boolean) => void;
  cloudinaryConfig?: { cloudName: string; uploadPreset: string };
  defaultTitle?: string;
  defaultDescription?: string;
}

export default function MetaFields({
  metaTitle,
  metaDescription,
  ogImage,
  canonicalUrl,
  noIndex,
  scheduledPublishAt,
  scheduledUnpublishAt,
  onChange,
  cloudinaryConfig,
  defaultTitle,
  defaultDescription,
}: MetaFieldsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">
            SEO & Metadata
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Optional
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <Input
              value={metaTitle}
              onChange={(e) => onChange('metaTitle', e.target.value)}
              placeholder={defaultTitle || 'Leave empty to use post title'}
              maxLength={60}
            />
            <div className="flex items-start gap-1 mt-1">
              <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                {metaTitle.length}/60 characters • Shown in search results and browser tabs
              </p>
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => onChange('metaDescription', e.target.value)}
              placeholder={defaultDescription || 'Leave empty to use excerpt'}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={160}
            />
            <div className="flex items-start gap-1 mt-1">
              <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                {metaDescription.length}/160 characters • Displayed in search engine results
              </p>
            </div>
          </div>

          {/* OG Image */}
          {cloudinaryConfig && (
            <div>
              <ImageField
                label="Social Share Image (OG Image)"
                value={ogImage}
                onChange={(url) => onChange('ogImage', url)}
                cloudName={cloudinaryConfig.cloudName}
                uploadPreset={cloudinaryConfig.uploadPreset}
                folder="og-images"
                cropping={true}
                aspectRatio={1.91}
                description="Recommended: 1200x630px • Shown when shared on social media"
              />
            </div>
          )}

          {/* Canonical URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canonical URL
            </label>
            <Input
              value={canonicalUrl}
              onChange={(e) => onChange('canonicalUrl', e.target.value)}
              placeholder="https://example.com/original-article"
              type="url"
            />
            <div className="flex items-start gap-1 mt-1">
              <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                Set if this content was originally published elsewhere
              </p>
            </div>
          </div>

          {/* No Index */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="noIndex"
              checked={noIndex}
              onChange={(e) => onChange('noIndex', e.target.checked)}
              className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <label htmlFor="noIndex" className="text-sm font-medium text-gray-700 cursor-pointer">
                Hide from search engines (noindex)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Prevent search engines from indexing this page
              </p>
            </div>
          </div>

          {/* Scheduling */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Scheduling</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled Publish */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Publish
                </label>
                <input
                  type="datetime-local"
                  value={scheduledPublishAt}
                  onChange={(e) => onChange('scheduledPublishAt', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically publish at this time
                </p>
              </div>

              {/* Scheduled Unpublish */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Unpublish
                </label>
                <input
                  type="datetime-local"
                  value={scheduledUnpublishAt}
                  onChange={(e) => onChange('scheduledUnpublishAt', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically unpublish at this time
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
