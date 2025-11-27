'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SubscriptionCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    if (!reference && !trxref) {
      setStatus('error');
      setMessage('No payment reference found');
      return;
    }

    verifyPayment(reference || trxref);
  }, [searchParams]);

  const verifyPayment = async (reference: string | null) => {
    if (!reference) return;

    try {
      const response = await fetch(`/api/subscriptions/verify?reference=${reference}`);
      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Subscription activated successfully!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/customer');
          router.refresh();
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setStatus('error');
      setMessage('An error occurred while verifying payment');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {status === 'verifying' && (
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {status === 'verifying' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-8">{message}</p>

          {/* Actions */}
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Redirecting to dashboard in 3 seconds...
              </p>
              <button
                onClick={() => {
                  router.push('/dashboard/customer');
                  router.refresh();
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <button
                onClick={() => router.push('/dashboard/customer/subscription')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/contact')}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
