'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useToast } from '@/components/providers/ToastProvider';
import { Save, Settings } from 'lucide-react';

interface SessionSettings {
  id: string;
  customerRememberMe: boolean;
  staffSessionTimeout: number;
  autoLogoutEnabled: boolean;
  customerSessionMaxAge: number;
  staffSessionMaxAge: number;
  updatedAt: string;
}

export default function SessionSettingsPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SessionSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/session');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        error('Failed to load settings');
      }
    } catch (err) {
      error('Error loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        success('Session settings updated successfully');
        await fetchSettings();
      } else {
        const data = await res.json();
        error(data.error || 'Failed to update settings');
      }
    } catch (err) {
      error('Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof SessionSettings>(
    key: K,
    value: SessionSettings[K]
  ) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <p className="text-neutral-600">Failed to load session settings</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy-900 flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Session Settings
            </h1>
            <p className="text-neutral-600 mt-1">
              Configure user session and authentication behavior
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Customer Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-brand-navy-900">
                Customer Settings
              </h2>
              <p className="text-sm text-neutral-600">
                Configure session settings for customer accounts
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-brand-navy-900">
                    Allow "Keep Me Logged In"
                  </label>
                  <p className="text-sm text-neutral-600">
                    Enable customers to stay logged in for extended periods
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateSetting('customerRememberMe', !settings.customerRememberMe)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.customerRememberMe
                      ? 'bg-brand-navy-600'
                      : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.customerRememberMe ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block font-medium text-brand-navy-900 mb-2">
                  Customer Session Duration (with "Keep Me Logged In")
                </label>
                <p className="text-sm text-neutral-600 mb-2">
                  Maximum session duration in days when "Keep Me Logged In" is checked
                </p>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={Math.round(settings.customerSessionMaxAge / 86400)}
                  onChange={(e) =>
                    updateSetting(
                      'customerSessionMaxAge',
                      parseInt(e.target.value) * 86400
                    )
                  }
                  className="max-w-xs"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Current: {Math.round(settings.customerSessionMaxAge / 86400)} days
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Staff Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-brand-navy-900">
                Staff Settings
              </h2>
              <p className="text-sm text-neutral-600">
                Configure session and inactivity timeout for staff accounts
              </p>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-brand-navy-900">
                    Enable Auto-Logout
                  </label>
                  <p className="text-sm text-neutral-600">
                    Automatically log out staff after period of inactivity
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateSetting('autoLogoutEnabled', !settings.autoLogoutEnabled)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoLogoutEnabled
                      ? 'bg-brand-navy-600'
                      : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoLogoutEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block font-medium text-brand-navy-900 mb-2">
                  Inactivity Timeout (minutes)
                </label>
                <p className="text-sm text-neutral-600 mb-2">
                  Auto-logout staff after this many minutes of inactivity
                </p>
                <Input
                  type="number"
                  min="1"
                  max="480"
                  value={settings.staffSessionTimeout}
                  onChange={(e) =>
                    updateSetting('staffSessionTimeout', parseInt(e.target.value))
                  }
                  className="max-w-xs"
                  disabled={!settings.autoLogoutEnabled}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Current: {settings.staffSessionTimeout} minutes
                </p>
              </div>

              <div>
                <label className="block font-medium text-brand-navy-900 mb-2">
                  Staff Session Duration (hours)
                </label>
                <p className="text-sm text-neutral-600 mb-2">
                  Maximum session duration for staff members
                </p>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={Math.round(settings.staffSessionMaxAge / 3600)}
                  onChange={(e) =>
                    updateSetting(
                      'staffSessionMaxAge',
                      parseInt(e.target.value) * 3600
                    )
                  }
                  className="max-w-xs"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Current: {Math.round(settings.staffSessionMaxAge / 3600)} hours
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Information Panel */}
          <Card>
            <CardBody>
              <h3 className="font-semibold text-brand-navy-900 mb-2">
                ℹ️ Important Information
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
                <li>
                  Staff members cannot use "Keep Me Logged In" - they are always subject
                  to session expiration
                </li>
                <li>
                  Inactivity tracking monitors mouse movement, clicks, keyboard input,
                  scrolling, and touch events
                </li>
                <li>
                  Staff will receive a warning 2 minutes before being logged out due to
                  inactivity
                </li>
                <li>
                  Changes to these settings apply to new login sessions. Existing sessions
                  will continue with their original settings
                </li>
                <li>
                  Customer session without "Keep Me Logged In" uses the same duration as
                  staff sessions
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
