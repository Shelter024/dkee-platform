'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { VEHICLE_MAKES, VEHICLE_YEARS, getModelsForMake } from '@/lib/vehicle-data';

interface VehicleSelectorProps {
  defaultMake?: string;
  defaultModel?: string;
  defaultYear?: string;
  onMakeChange: (make: string) => void;
  onModelChange: (model: string) => void;
  onYearChange: (year: string) => void;
  makeError?: string;
  modelError?: string;
  yearError?: string;
}

export function VehicleSelector({
  defaultMake = '',
  defaultModel = '',
  defaultYear = '',
  onMakeChange,
  onModelChange,
  onYearChange,
  makeError,
  modelError,
  yearError,
}: VehicleSelectorProps) {
  const [selectedMake, setSelectedMake] = useState(defaultMake);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [customMake, setCustomMake] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    if (selectedMake && selectedMake !== 'Other') {
      const models = getModelsForMake(selectedMake);
      setAvailableModels(models);
    } else {
      setAvailableModels(['Other']);
    }
  }, [selectedMake]);

  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const make = e.target.value;
    setSelectedMake(make);
    setSelectedModel('');
    setCustomMake('');
    onMakeChange(make === 'Other' ? '' : make);
    onModelChange('');
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    setSelectedModel(model);
    setCustomModel('');
    onModelChange(model === 'Other' ? '' : model);
  };

  const handleCustomMakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomMake(value);
    onMakeChange(value);
  };

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomModel(value);
    onModelChange(value);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    setSelectedYear(year);
    onYearChange(year);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Make Selector */}
      <div>
        <label htmlFor="vehicle-make" className="block text-sm font-medium text-gray-700 mb-1">
          Make <span className="text-red-600">*</span>
        </label>
        <select
          id="vehicle-make"
          value={selectedMake}
          onChange={handleMakeChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy-500 focus:border-transparent"
          required
        >
          <option value="">Select Make</option>
          {VEHICLE_MAKES.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
        {selectedMake === 'Other' && (
          <Input
            type="text"
            placeholder="Enter custom make"
            value={customMake}
            onChange={handleCustomMakeChange}
            className="mt-2"
            required
          />
        )}
        {makeError && <p className="text-red-600 text-sm mt-1">{makeError}</p>}
      </div>

      {/* Model Selector */}
      <div>
        <label htmlFor="vehicle-model" className="block text-sm font-medium text-gray-700 mb-1">
          Model <span className="text-red-600">*</span>
        </label>
        <select
          id="vehicle-model"
          value={selectedModel}
          onChange={handleModelChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy-500 focus:border-transparent"
          disabled={!selectedMake}
          required
        >
          <option value="">Select Model</option>
          {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
        {selectedModel === 'Other' && (
          <Input
            type="text"
            placeholder="Enter custom model"
            value={customModel}
            onChange={handleCustomModelChange}
            className="mt-2"
            required
          />
        )}
        {modelError && <p className="text-red-600 text-sm mt-1">{modelError}</p>}
      </div>

      {/* Year Selector */}
      <div>
        <label htmlFor="vehicle-year" className="block text-sm font-medium text-gray-700 mb-1">
          Year <span className="text-red-600">*</span>
        </label>
        <select
          id="vehicle-year"
          value={selectedYear}
          onChange={handleYearChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy-500 focus:border-transparent"
          required
        >
          <option value="">Select Year</option>
          {VEHICLE_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {yearError && <p className="text-red-600 text-sm mt-1">{yearError}</p>}
      </div>
    </div>
  );
}
