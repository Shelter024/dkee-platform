'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Settings,
  Save,
  Database,
  Cloud,
  MessageSquare,
  Zap,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Category {
  key: string;
  label: string;
  icon: string;
  settings: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    currentValue: string | null;
    isConfigured: boolean;
  }>;
  isConfigured: boolean;
}

const iconMap: Record<string, any> = {
  Database,
  Cloud,
  MessageSquare,
  Zap,
  Mail,
  Lock,
};

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setCategories(data.categories || []);

      // Initialize form data with current values
      const initialData: Record<string, string> = {};
      data.categories?.forEach((cat: Category) => {
        cat.settings.forEach((setting) => {
          if (setting.currentValue && setting.currentValue !== '********') {
            initialData[setting.key] = setting.currentValue;
          }
        });
      });
      setFormData(initialData);
    } catch (err: any) {
      setError(err.message || 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSetting = async (key: string) => {
    setSaving(key);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: formData[key] || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save setting');
      }

      setSuccess(`${key} saved successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh to update configuration status
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to save setting');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={48} className="animate-spin text-brand-navy-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">System Configuration</h2>
          <p className="text-neutral-600 mt-1">
            Configure integrations and services (replaces .env file editing)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Settings size={24} className="text-brand-navy-600" />
        </div>
      </div>

      {error && (
        <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {categories.map((category) => {
        const IconComponent = iconMap[category.icon] || Settings;

        return (
          <Card key={category.key}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <IconComponent size={24} className="text-brand-navy-600" />
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {category.label}
                  </h3>
                </div>
                {category.isConfigured ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle size={16} />
                    Configured
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600 text-sm">
                    <AlertCircle size={16} />
                    Not Configured
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {category.settings.map((setting) => {
                  const isPassword = setting.type === 'password';
                  const showValue = !isPassword || showPasswords[setting.key];
                  const currentValue = formData[setting.key] || '';

                  return (
                    <div key={setting.key} className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700">
                        {setting.label}
                        {setting.required && (
                          <span className="text-brand-red-600 ml-1">*</span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showValue ? 'text' : 'password'}
                            value={currentValue}
                            onChange={(e) => handleChange(setting.key, e.target.value)}
                            placeholder={
                              setting.isConfigured && !currentValue
                                ? '********'
                                : `Enter ${setting.label.toLowerCase()}`
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-navy-500 focus:border-brand-navy-500"
                          />
                          {isPassword && (
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(setting.key)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                            >
                              {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          )}
                        </div>
                        <Button
                          onClick={() => handleSaveSetting(setting.key)}
                          disabled={saving === setting.key || !currentValue}
                          size="md"
                          variant="accent"
                        >
                          {saving === setting.key ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                        </Button>
                      </div>
                      {setting.isConfigured && !currentValue && (
                        <p className="text-xs text-neutral-500">
                          Currently configured. Enter new value to update.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Important Notes</h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <Lock size={16} className="mt-0.5 text-brand-navy-600" />
              <span>
                Sensitive values (passwords, secrets) are encrypted before storage
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Database size={16} className="mt-0.5 text-brand-navy-600" />
              <span>
                DATABASE_URL is required for the system to function. Configure it first.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Cloud size={16} className="mt-0.5 text-brand-navy-600" />
              <span>
                Cloudinary is required for file uploads (invoices, receipts, job cards)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 text-yellow-600" />
              <span>
                Optional services (Twilio, Pusher, Email) can be configured later
              </span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
