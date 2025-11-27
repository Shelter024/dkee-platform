'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    otp: '',
    otpSent: false,
    sendingOtp: false,
    rememberMe: false,
  });

  const sendOtp = async () => {
    if (!formData.phone) {
      toast.error('Enter phone number');
      return;
    }
    setFormData(f => ({ ...f, sendingOtp: true }));
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('OTP sent');
        setFormData(f => ({ ...f, otpSent: true }));
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (e) {
      toast.error('Failed to send OTP');
    } finally {
      setFormData(f => ({ ...f, sendingOtp: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (mode === 'email') {
        result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
          redirect: false,
        });
      } else {
        result = await signIn('phone-otp', {
          phone: formData.phone,
          otp: formData.otp,
          rememberMe: formData.rememberMe,
          redirect: false,
        });
      }

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Login successful!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="DK Executive Engineers" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-brand-navy-900">Welcome Back</h1>
          <p className="text-neutral-600 mt-2">Sign in to access your account</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-brand-navy-900">Login</h2>
          </CardHeader>
          <CardBody>
            <div className="flex mb-4 rounded overflow-hidden border border-neutral-300">
              <button type="button" onClick={() => setMode('email')} className={`flex-1 py-2 text-sm font-medium ${mode==='email' ? 'bg-brand-navy-600 text-white' : 'bg-neutral-100 text-neutral-700'}`}>Email & Password</button>
              <button type="button" onClick={() => setMode('phone')} className={`flex-1 py-2 text-sm font-medium ${mode==='phone' ? 'bg-brand-navy-600 text-white' : 'bg-neutral-100 text-neutral-700'}`}>Phone & OTP</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'email' && (
                <>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </>
              )}
              {mode === 'phone' && (
                <>
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+233XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        label="OTP"
                        type="text"
                        placeholder="123456"
                        value={formData.otp}
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={formData.sendingOtp || !formData.phone}
                      onClick={sendOtp}
                    >
                      {formData.sendingOtp ? 'Sending...' : formData.otpSent ? 'Resend OTP' : 'Send OTP'}
                    </Button>
                  </div>
                  <p className="text-xs text-neutral-600 -mt-2">Request OTP then enter it to login. OTP valid 10 minutes.</p>
                </>
              )}
              
              {/* Keep me logged in - Only for customers */}
              {mode === 'email' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) =>
                      setFormData({ ...formData, rememberMe: e.target.checked })
                    }
                    className="h-4 w-4 text-brand-navy-600 border-neutral-300 rounded focus:ring-brand-navy-500"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 block text-sm text-neutral-700"
                  >
                    Keep me logged in
                  </label>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-600">
              <p>
                Don't have an account?{' '}
                <Link href="/contact" className="text-brand-red-600 hover:text-brand-red-700 font-medium">
                  Contact us
                </Link>
              </p>
            </div>

            <div className="mt-4 p-4 bg-brand-navy-50 rounded-lg border border-brand-navy-200">
              <p className="text-sm text-brand-navy-800 font-medium mb-2">Demo Accounts:</p>
              <p className="text-xs text-brand-navy-700">Admin: admin@dkexecutive.com / Admin123!</p>
              <p className="text-xs text-brand-navy-700">Customer: customer@example.com / Customer123!</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
