'use client';

import { X, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PropertyServiceForms from './PropertyServiceForms';

interface PropertyServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
    fullDescription: string;
    benefits: string[];
    features: string[];
  };
}

export default function PropertyServiceModal({ isOpen, onClose, service }: PropertyServiceModalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showGuestOption, setShowGuestOption] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const Icon = service.icon;
  const isAuthenticated = status === 'authenticated';

  const handleRequestService = () => {
    if (isAuthenticated) {
      // Redirect to contact with property service pre-filled
      router.push(`/contact?service=${encodeURIComponent(service.title)}&type=property`);
      onClose();
    } else {
      setShowGuestOption(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header with gradient */}
        <div className={`relative bg-gradient-to-br ${service.gradient} p-8 text-white`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
              <Icon className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold">{service.title}</h2>
          </div>
          <p className="text-lg opacity-90">{service.description}</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Full Description */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">About This Service</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {service.fullDescription}
            </p>
          </div>

          {/* Key Benefits */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Key Benefits</h3>
            <div className="space-y-3">
              {service.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className={`w-5 h-5 bg-gradient-to-br ${service.gradient} bg-clip-text text-transparent`} fill="currentColor" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What's Included */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">What's Included</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${service.gradient}`}></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className={`bg-gradient-to-br ${service.gradient} rounded-xl p-6 text-white`}>
            <h3 className="text-xl font-bold mb-3">Ready to Get Started?</h3>
            <p className="mb-4 opacity-90">
              {isAuthenticated 
                ? `Fill out our detailed form or request this service directly.`
                : `Create an account, sign in, or continue as a guest to access our service request form.`
              }
            </p>
            
            {!showGuestOption ? (
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowForm(true)}
                  size="lg" 
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Fill Service Request Form
                </Button>
                <Button 
                  onClick={handleRequestService}
                  size="lg" 
                  variant="outline"
                  className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
                >
                  Quick Request
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm mb-3">Choose how you'd like to proceed:</p>
                <Link href={`/register?service=${encodeURIComponent(service.title)}&type=property`} className="block">
                  <Button 
                    size="lg" 
                    className="w-full bg-white text-gray-900 hover:bg-gray-100"
                  >
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href={`/login?service=${encodeURIComponent(service.title)}&type=property`} className="block">
                  <Button 
                    size="lg" 
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href={`/contact?service=${encodeURIComponent(service.title)}&type=property`} className="block">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full bg-transparent border-2 border-white hover:bg-white/10 text-white"
                  >
                    Continue as Guest
                  </Button>
                </Link>
                <button 
                  onClick={() => setShowGuestOption(false)}
                  className="text-sm underline hover:opacity-80 w-full text-center mt-2"
                >
                  Go back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Request Form Modal */}
      <PropertyServiceForms
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        serviceType={service.title}
      />
    </div>
  );
}
