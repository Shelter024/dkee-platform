'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Link from 'next/link';
import { useToast } from '@/components/providers/ToastProvider';
import { UserPlus, Mail, Phone } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [registrationType, setRegistrationType] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [registered, setRegistered] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (registrationType === 'email') {
      if (!formData.email || !formData.password) {
        error('Email and password are required');
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        error('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        error('Passwords do not match');
        setIsLoading(false);
        return;
      }
    } else {
      if (!formData.phone) {
        error('Phone number is required');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: registrationType === 'email' ? formData.email : undefined,
          password: registrationType === 'email' ? formData.password : undefined,
          phone: registrationType === 'phone' ? formData.phone : undefined,
          registrationType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        success(data.message);
        setRegistered(true);
        setUserId(data.user.id);
      } else {
        error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-brand-navy-900">Registration Successful!</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {registrationType === 'email' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Check your email for a verification link</li>
                      <li>• Click the link to verify your email address</li>
                      <li>• Your account will then be reviewed by our admin team</li>
                      <li>• You'll receive an email once approved</li>
                    </ul>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• An OTP will be sent to your phone for verification</li>
                      <li>• After phone verification, admin will review your account</li>
                      <li>• You'll be notified once approved</li>
                    </ul>
                  </div>
                )}

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => router.push(registrationType === 'email' ? '/' : '/login')}
                >
                  {registrationType === 'email' ? 'Go to Homepage' : 'Go to Login'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="DK Executive Engineers" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-brand-navy-900">Create Account</h1>
          <p className="text-neutral-600 mt-2">Join DKee Executive Engineers</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-brand-navy-900">Register</h2>
          </CardHeader>
          <CardBody>
            {/* Registration Type Toggle */}
            <div className="flex mb-4 rounded overflow-hidden border border-neutral-300">
              <button
                type="button"
                onClick={() => setRegistrationType('email')}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                  registrationType === 'email'
                    ? 'bg-brand-navy-600 text-white'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setRegistrationType('phone')}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                  registrationType === 'phone'
                    ? 'bg-brand-navy-600 text-white'
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              {registrationType === 'email' ? (
                <>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />

                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  <p className="text-xs text-neutral-600">
                    Password must be at least 8 characters long
                  </p>
                </>
              ) : (
                <>
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+233XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                  <p className="text-xs text-neutral-600">
                    Include country code (e.g., +233 for Ghana)
                  </p>
                </>
              )}

              <div className="bg-brand-navy-50 border border-brand-navy-200 rounded-lg p-4 text-sm">
                <h3 className="font-semibold text-brand-navy-900 mb-2">Registration Process:</h3>
                <ul className="text-brand-navy-800 space-y-1">
                  <li>
                    1. {registrationType === 'email' ? 'Verify your email' : 'Verify your phone'}
                  </li>
                  <li>2. Admin reviews your account</li>
                  <li>3. Receive approval notification</li>
                  <li>4. Login and access all features</li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-600">
              <p>
                Already have an account?{' '}
                <Link href="/login" className="text-brand-red-600 hover:text-brand-red-700 font-medium">
                  Login here
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center text-sm text-neutral-600">
              <p>
                Need a staff account?{' '}
                <Link
                  href="/staff/request-account"
                  className="text-brand-navy-600 hover:text-brand-navy-700 font-medium"
                >
                  Request here
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
