'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Wrench,
  Gauge,
  Package,
  Radio,
  Truck,
  CheckCircle,
  Lightbulb,
  Key,
  Paintbrush,
  TruckIcon,
} from 'lucide-react';
import { useState } from 'react';
import ServiceModal from '@/components/automotive/ServiceModal';

export default function AutomotivePage() {
  const [selectedService, setSelectedService] = useState<any>(null);
  const services = [
    {
      icon: Wrench,
      title: 'Vehicle Repairs & Maintenance',
      description: 'Comprehensive repair services and regular maintenance for all vehicle makes and models',
      fullDescription: 'Our expert technicians provide comprehensive repair and maintenance services tailored to Ghana\'s unique driving conditions. From engine overhauls to routine oil changes, we ensure your vehicle performs optimally on both urban roads and rural terrain.',
      benefits: [
        'Extended vehicle lifespan through preventive care',
        'Reduced breakdown risks on long-distance trips',
        'Improved fuel efficiency adapted to local fuel quality',
        'Warranty-backed repairs with genuine parts',
        'Detailed maintenance records for resale value'
      ],
      features: [
        'Engine diagnostics & repair',
        'Brake system service',
        'Suspension & steering',
        'Transmission service',
        'Cooling system maintenance',
        'Electrical system repair',
        'Oil changes & filters',
        'Tire rotation & balancing'
      ]
    },
    {
      icon: Gauge,
      title: 'Diagnostics',
      description: 'Advanced machine diagnosis and inspection services',
    },
    {
      icon: Package,
      title: 'Spare Parts',
      description: 'Genuine spare parts supply and installation',
    },
    {
      icon: Radio,
      title: 'Vehicle Tracking Devices',
      description: 'Vehicle tracking device installation and monitoring',
    },
    {
      icon: Truck,
      title: 'Fleet Management',
      description: 'Complete fleet management solutions for businesses',
    },
    {
      icon: Key,
      title: 'Key Programming',
      description: 'Professional key programming and transponder services for all vehicle makes',
    },
    {
      icon: Paintbrush,
      title: 'Body Works and Spraying',
      description: 'Expert panel beating, dent removal, and professional vehicle painting services',
    },
    {
      icon: TruckIcon,
      title: '24/7 Towing Service',
      description: 'Round-the-clock emergency towing and roadside assistance services',
    },
    {
      icon: Lightbulb,
      title: 'Training and Consultancy',
      description: 'Expert advice, technical training, and guidance on vehicle performance, repairs, and fleet optimization strategies',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-navy-600 to-brand-navy-800 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Automotive Services for Ghana
            </h1>
            <p className="text-xl text-brand-navy-100 mb-8">
              Tailored vehicle care for West African driving conditions—from dusty Harmattan seasons
              to coastal humidity. Supporting individuals, fleets, and institutions with localized expertise.
            </p>
            <Link href="/contact">
              <Button size="lg" variant="secondary">
                Request Service
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Comprehensive Ghana-Focused Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Preventive and diagnostic services adapted to local terrain, climate, and fuel quality realities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-stagger">
            {services.map((service, index) => {
              const Icon = service.icon;
              const gradients = [
                'from-blue-500 to-blue-600',
                'from-purple-500 to-purple-600',
                'from-green-500 to-green-600',
                'from-orange-500 to-orange-600',
                'from-pink-500 to-pink-600',
                'from-indigo-500 to-indigo-600',
                'from-yellow-500 to-yellow-600',
                'from-red-500 to-red-600',
                'from-teal-500 to-teal-600',
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <Card key={index} className="hover-lift border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>
                  <CardBody className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-5 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-brand-navy-600 transition-colors">{service.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{service.description}</p>
                    <div className="mt-4 flex items-center text-brand-navy-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Learn more →
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gray-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
                <h3 className="text-3xl sm:text-4xl font-bold mb-6">
                  Why Ghanaian Drivers Trust Us
                </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Certified Local Technicians</h3>
                    <p className="text-gray-600">
                      Skilled professionals experienced with Ghanaian road realities and vehicle import variations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Modern + Adaptive Equipment</h3>
                    <p className="text-gray-600">
                      Advanced diagnostics calibrated for regional fuel, climate, and aging drivetrain patterns.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Verified Genuine Parts</h3>
                    <p className="text-gray-600">
                      Authenticated components sourced through vetted import channels to prevent counterfeit exposure.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Transparent Warranty Support</h3>
                    <p className="text-gray-600">
                      Clear post-service assurance honoring local usage conditions and maintenance cycles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-bold">Get a Quote</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-600 mb-6">
                    Contact us today for a free consultation and quote on any automotive service.
                  </p>
                  <Link href="/contact">
                    <Button size="lg" className="w-full">
                      Contact Us Now
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
