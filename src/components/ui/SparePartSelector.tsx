'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { SPARE_PARTS_CATEGORIES, getPartsForCategory } from '@/lib/vehicle-data';

interface SparePartSelectorProps {
  defaultCategory?: string;
  defaultPartName?: string;
  onCategoryChange: (category: string) => void;
  onPartNameChange: (partName: string) => void;
  categoryError?: string;
  partNameError?: string;
}

export function SparePartSelector({
  defaultCategory = '',
  defaultPartName = '',
  onCategoryChange,
  onPartNameChange,
  categoryError,
  partNameError,
}: SparePartSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedPartName, setSelectedPartName] = useState(defaultPartName);
  const [customPartName, setCustomPartName] = useState('');
  const [availableParts, setAvailableParts] = useState<string[]>([]);

  useEffect(() => {
    if (selectedCategory) {
      const parts = getPartsForCategory(selectedCategory);
      setAvailableParts(parts);
    } else {
      setAvailableParts([]);
    }
  }, [selectedCategory]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedPartName('');
    setCustomPartName('');
    onCategoryChange(category);
    onPartNameChange('');
  };

  const handlePartNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const partName = e.target.value;
    setSelectedPartName(partName);
    setCustomPartName('');
    onPartNameChange(partName === 'Other' ? '' : partName);
  };

  const handleCustomPartNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomPartName(value);
    onPartNameChange(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Category Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-600">*</span>
        </label>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy-500 focus:border-transparent"
          required
        >
          <option value="">Select Category</option>
          {SPARE_PARTS_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {categoryError && <p className="text-red-600 text-sm mt-1">{categoryError}</p>}
      </div>

      {/* Part Name Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Part Name <span className="text-red-600">*</span>
        </label>
        <select
          value={selectedPartName}
          onChange={handlePartNameChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy-500 focus:border-transparent"
          disabled={!selectedCategory}
          required
        >
          <option value="">Select Part</option>
          {availableParts.map((part) => (
            <option key={part} value={part}>
              {part}
            </option>
          ))}
        </select>
        {selectedPartName === 'Other' && (
          <Input
            type="text"
            placeholder="Enter custom part name"
            value={customPartName}
            onChange={handleCustomPartNameChange}
            className="mt-2"
            required
          />
        )}
        {partNameError && <p className="text-red-600 text-sm mt-1">{partNameError}</p>}
      </div>
    </div>
  );
}
