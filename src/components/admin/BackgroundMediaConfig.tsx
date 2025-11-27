'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Image, Video, Layers, Plus, Trash2 } from 'lucide-react';

interface BackgroundMediaConfigProps {
  initialMedia?: string | null;
  initialType?: string | null;
  initialOverlay?: string | null;
  initialOpacity?: number | null;
  initialEffect?: string | null;
  onChange: (config: {
    backgroundMedia: string | null;
    backgroundType: string | null;
    backgroundOverlay: string | null;
    backgroundOpacity: number | null;
    backgroundEffect: string | null;
  }) => void;
}

export function BackgroundMediaConfig({
  initialMedia,
  initialType = 'image',
  initialOverlay = '#000000',
  initialOpacity = 0.5,
  initialEffect = 'fade',
  onChange,
}: BackgroundMediaConfigProps) {
  const [type, setType] = useState(initialType || 'image');
  const [media, setMedia] = useState(initialMedia || '');
  const [overlay, setOverlay] = useState(initialOverlay || '#000000');
  const [opacity, setOpacity] = useState((initialOpacity || 0.5) * 100);
  const [effect, setEffect] = useState(initialEffect || 'fade');
  const [slides, setSlides] = useState<string[]>(() => {
    if (type === 'slideshow' && initialMedia) {
      try {
        return JSON.parse(initialMedia);
      } catch {
        return [initialMedia];
      }
    }
    return [''];
  });

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'slideshow') {
      setSlides(['']);
    }
    updateConfig(newType, media, overlay, opacity / 100, effect);
  };

  const updateConfig = (
    newType: string,
    newMedia: string,
    newOverlay: string,
    newOpacity: number,
    newEffect: string
  ) => {
    let finalMedia = newMedia;
    if (newType === 'slideshow') {
      finalMedia = JSON.stringify(slides.filter((s) => s.trim() !== ''));
    }

    onChange({
      backgroundMedia: finalMedia || null,
      backgroundType: newType || null,
      backgroundOverlay: newOverlay || null,
      backgroundOpacity: newOpacity || null,
      backgroundEffect: newEffect || null,
    });
  };

  const handleMediaChange = (value: string) => {
    setMedia(value);
    updateConfig(type, value, overlay, opacity / 100, effect);
  };

  const handleOverlayChange = (value: string) => {
    setOverlay(value);
    updateConfig(type, media, value, opacity / 100, effect);
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    updateConfig(type, media, overlay, value / 100, effect);
  };

  const handleEffectChange = (value: string) => {
    setEffect(value);
    updateConfig(type, media, overlay, opacity / 100, value);
  };

  const handleSlideChange = (index: number, value: string) => {
    const newSlides = [...slides];
    newSlides[index] = value;
    setSlides(newSlides);
    updateConfig(type, JSON.stringify(newSlides.filter((s) => s.trim() !== '')), overlay, opacity / 100, effect);
  };

  const addSlide = () => {
    setSlides([...slides, '']);
  };

  const removeSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    updateConfig(type, JSON.stringify(newSlides.filter((s) => s.trim() !== '')), overlay, opacity / 100, effect);
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Background Media</h3>

        {/* Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Media Type</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('image')}
              className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                type === 'image'
                  ? 'border-brand-navy-600 bg-brand-navy-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image className="w-6 h-6" />
              <span className="text-sm font-medium">Image</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('video')}
              className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                type === 'video'
                  ? 'border-brand-navy-600 bg-brand-navy-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Video className="w-6 h-6" />
              <span className="text-sm font-medium">Video</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('slideshow')}
              className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                type === 'slideshow'
                  ? 'border-brand-navy-600 bg-brand-navy-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Layers className="w-6 h-6" />
              <span className="text-sm font-medium">Slideshow</span>
            </button>
          </div>
        </div>

        {/* Media URL Input */}
        {type !== 'slideshow' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'video' ? 'Video URL (MP4)' : 'Image URL'}
            </label>
            <Input
              type="url"
              value={media}
              onChange={(e) => handleMediaChange(e.target.value)}
              placeholder={type === 'video' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'}
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Slideshow Images</label>
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="url"
                    value={slide}
                    onChange={(e) => handleSlideChange(index, e.target.value)}
                    placeholder={`Image ${index + 1} URL`}
                    className="flex-1"
                  />
                  {slides.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSlide(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSlide}>
                <Plus className="w-4 h-4 mr-1" />
                Add Slide
              </Button>
            </div>
          </div>
        )}

        {/* Overlay Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overlay Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={overlay}
              onChange={(e) => handleOverlayChange(e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              type="text"
              value={overlay}
              onChange={(e) => handleOverlayChange(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        {/* Overlay Opacity */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overlay Opacity: {opacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Effect */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Effect</label>
          <select
            value={effect}
            onChange={(e) => handleEffectChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy-500 focus:border-transparent"
          >
            <option value="fade">Fade</option>
            <option value="parallax">Parallax</option>
            <option value="fixed">Fixed</option>
            <option value="zoom">Zoom</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {effect === 'fade' && 'Smooth fade transition'}
            {effect === 'parallax' && 'Background scrolls slower than content'}
            {effect === 'fixed' && 'Background stays fixed while content scrolls'}
            {effect === 'zoom' && 'Slow zoom animation'}
          </p>
        </div>

        {/* Preview */}
        {(media || (type === 'slideshow' && slides.some((s) => s.trim()))) && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div
              className="relative h-40 rounded-lg overflow-hidden"
              style={{
                backgroundImage: type !== 'video' ? `url(${type === 'slideshow' ? slides[0] : media})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {type === 'video' && (
                <video src={media} className="w-full h-full object-cover" muted />
              )}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: overlay,
                  opacity: opacity / 100,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-lg font-semibold drop-shadow-lg">Content Preview</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
