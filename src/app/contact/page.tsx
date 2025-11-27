"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, TextArea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

function ContactContent() {
  const searchParams = useSearchParams();
  const [selectedService, setSelectedService] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const service = searchParams.get('service');
    const type = searchParams.get('type');
    if (service) {
      setSelectedService(type || 'other');
      setMessage(`I'm interested in your ${service} service. Please provide more information.`);
    }
  }, [searchParams]);

  return (
    <div className="py-12 sm:py-16 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get in touch with our team. We're here to help with all your automotive
            and property management needs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6 animate-slide-in-left">
            <Card className="hover-lift border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
              <CardBody className="p-6">
                <div className="flex items-start space-x-3 mb-6 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">Visit Us</h3>
                    <p className="text-gray-600">Pawpaw Street, East Legon<br />Accra, Ghana</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 mb-6 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">Call Us</h3>
                    <p className="text-gray-600">+233 XX XXX XXXX<br />+233 XX XXX XXXY</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 mb-6 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">Email Us</h3>
                    <p className="text-gray-600">info@dkengineers.com<br />support@dkengineers.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-lg">Business Hours</h3>
                    <p className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM<br />Saturday: 9:00 AM - 4:00 PM<br />Sunday: Closed</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          <div className="lg:col-span-2 animate-slide-in-right">
            <Card className="hover-lift border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-600" />
              <CardHeader>
                <h2 className="text-2xl font-bold">Send Us a Message</h2>
              </CardHeader>
              <CardBody>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="transform transition-all duration-300 hover:scale-105">
                      <Input label="First Name" type="text" placeholder="John" required className="transition-all duration-300" />
                    </div>
                    <div className="transform transition-all duration-300 hover:scale-105">
                      <Input label="Last Name" type="text" placeholder="Doe" required className="transition-all duration-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="transform transition-all duration-300 hover:scale-105">
                      <Input label="Email" type="email" placeholder="john@example.com" required className="transition-all duration-300" />
                    </div>
                    <div className="transform transition-all duration-300 hover:scale-105">
                      <Input label="Phone" type="tel" placeholder="+233 XX XXX XXXX" required className="transition-all duration-300" />
                    </div>
                  </div>
                  <div className="transform transition-all duration-300 hover:scale-105">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Interest</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 focus:scale-105"
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                    >
                      <option value="">Select a service</option>
                      <option value="automotive">Automotive Services</option>
                      <option value="property">Property Management</option>
                      <option value="consultation">Consultation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="transform transition-all duration-300 hover:scale-105">
                    <TextArea
                      label="Message"
                      placeholder="Tell us about your inquiry..."
                      rows={6}
                      required
                      className="transition-all duration-300"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    Send Message
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Loading contact form...</div>}>
      <ContactContent />
    </Suspense>
  );
}
