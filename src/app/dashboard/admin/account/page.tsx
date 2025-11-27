'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/providers/ToastProvider';
import CloudinaryUploader from '@/components/media/CloudinaryUploader';

export default function StaffAccountSettingsPage() {
  const { data: session } = useSession();
  const { success, error } = useToast();
  const [form, setForm] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: (session?.user as any)?.phone || '',
    image: (session?.user as any)?.image || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const updateField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([_, v]) => v));
      const res = await fetch('/api/users/me/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      success('Profile updated');
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleWidgetUpload(images: { url: string }[]) {
    const img = images[images.length - 1];
    if (!img) return;
    updateField('image', img.url);
    fetch('/api/users/me/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: img.url }),
    }).then(async (r) => {
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        error(j.error || 'Failed to save avatar');
      } else {
        success('Avatar updated');
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Staff Account Settings</h1>
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profile Image</label>
              <div className="mt-2 flex items-center gap-3">
                {form.image && <img src={form.image} alt="avatar" className="w-12 h-12 rounded-full object-cover border" />}
                <div className="flex-1">
                  <CloudinaryUploader
                    cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string}
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string}
                    onUpload={handleWidgetUpload as any}
                    multiple={false}
                    maxFiles={1}
                    folder="avatars/staff"
                    accept="image"
                    cropping
                    aspectRatio={1}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password (optional)</label>
              <Input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} />
              <p className="text-xs text-textMuted mt-1">Leave blank to keep existing password.</p>
            </div>
            <Button disabled={loading} type="submit" variant="primary" className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
