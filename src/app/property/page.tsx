'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Building2,
  Home,
  MapPin,
  FileText,
  TrendingUp,
  Key,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import PropertyServiceModal from '@/components/property/PropertyServiceModal';

export default function PropertyPage() {
  const [selectedService, setSelectedService] = useState<any>(null);

  const services = [
    {
      icon: Building2,
      title: 'Property Sales',
      description: 'Expert assistance in buying and selling residential and commercial properties',
      fullDescription: 'Navigate Ghana\'s complex property market with confidence. We provide end-to-end support for buying and selling residential and commercial properties, ensuring all legal documentation and land title verifications are properly handled.',
      benefits: [
        'Verified land title documentation',
        'Market-competitive pricing analysis',
        'Negotiation support with legal backing',
        'Protection against land fraud',
        'Assistance with registration processes'
      ],
      features: [
        'Property listing services',
        'Buyer matching',
        'Price negotiation',
        'Legal documentation',
        'Title verification',
        'Site inspection',
        'Market analysis',
        'Transfer assistance'
      ]
    },
    {
      icon: Key,
      title: 'Leasing & Rental',
      description: 'Comprehensive leasing and rental management services',
      fullDescription: 'Professional rental and leasing services that protect both landlords and tenants. We handle tenant screening, lease agreements, rent collection, and property maintenance coordination.',
      benefits: [
        'Reliable tenant screening',
        'Standardized lease agreements',
        'Rent collection management',
        'Property maintenance coordination',
        'Dispute resolution support'
      ],
      features: [
        'Tenant vetting',
        'Lease preparation',
        'Rent collection',
        'Maintenance management',
        'Property inspections',
        'Tenant relations',
        'Renewal management',
        'Legal compliance'
      ]
    },
    {
      icon: FileText,
      title: 'Property Survey',
      description: 'Professional property survey and inspection services',
      fullDescription: 'Comprehensive property surveys conducted by licensed surveyors. We verify boundaries, identify encroachments, and provide detailed reports on property conditions before purchase or development.',
      benefits: [
        'Licensed surveyor verification',
        'Boundary confirmation',
        'Structural assessment',
        'Encroachment identification',
        'Development feasibility analysis'
      ],
      features: [
        'Land surveying',
        'Boundary marking',
        'Topographical surveys',
        'Building inspections',
        'Condition reports',
        'Site analysis',
        'CAD mapping',
        'Legal documentation'
      ]
    },
    {
      icon: TrendingUp,
      title: 'Property Valuation',
      description: 'Accurate property valuation and market analysis',
      fullDescription: 'Professional property valuation services for insurance, sales, taxation, or investment purposes. Our valuations are recognized by financial institutions and comply with Ghana\'s valuation standards.',
      benefits: [
        'Bank-recognized valuations',
        'Market trend analysis',
        'Investment ROI projections',
        'Tax assessment support',
        'Insurance valuation'
      ],
      features: [
        'Market value assessment',
        'Rental value estimation',
        'Investment analysis',
        'Comparative analysis',
        'Depreciation calculation',
        'Development potential',
        'Tax valuation',
        'Insurance valuation'
      ]
    },
    {
      icon: Home,
      title: 'Consultation',
      description: 'Expert real estate consultation and advisory services',
      fullDescription: 'Strategic real estate consultation services for investors, developers, and property owners. Get expert advice on market trends, investment opportunities, and property development in Ghana.',
      benefits: [
        'Local market expertise',
        'Investment opportunity identification',
        'Risk assessment and mitigation',
        'Regulatory guidance',
        'Portfolio optimization'
      ],
      features: [
        'Market analysis',
        'Investment strategy',
        'Development planning',
        'Regulatory compliance',
        'Financial modeling',
        'Risk assessment',
        'Portfolio review',
        'Growth strategies'
      ]
    },
    {
      icon: MapPin,
      title: 'Property Management',
      description: 'Full-service property management solutions',
      fullDescription: 'Complete property management services that maximize your investment returns while minimizing headaches. We handle everything from tenant management to maintenance, accounting, and compliance.',
      benefits: [
        'Maximized rental income',
        'Reduced vacancy periods',
        'Professional maintenance',
        'Financial transparency',
        'Regulatory compliance'
      ],
      features: [
        'Tenant management',
        'Rent collection',
        'Maintenance coordination',
        'Financial reporting',
        'Property inspections',
        'Vendor management',
        'Insurance coordination',
        'Emergency response'
      ]
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-red-600 to-brand-red-800 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Ghanaian Property Management
            </h1>
            <p className="text-xl text-brand-red-100 mb-8">
              Trusted stewardship of residential and commercial assets—from Accra's rapid growth corridors
              to emerging opportunities in Kumasi and Takoradi.
            </p>
            <Link href="/contact">
              <Button size="lg" variant="primary">
                Schedule Consultation
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
              Real Estate Services Adapted to Ghana
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Market-aware guidance balancing cultural context, valuation integrity, and regulatory compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-stagger">
            {services.map((service, index) => {
              const Icon = service.icon;
              const gradients = [
                'from-red-500 to-red-600',
                'from-orange-500 to-orange-600',
                'from-amber-500 to-amber-600',
                'from-emerald-500 to-emerald-600',
                'from-cyan-500 to-cyan-600',
                'from-blue-500 to-blue-600',
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <Card 
                  key={index} 
                  className="hover-lift border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden relative cursor-pointer"
                  onClick={() => setSelectedService({ ...service, gradient })}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>
                  <CardBody className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mb-5 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-brand-red-600 transition-colors">{service.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{service.description}</p>
                    <div className="mt-4 flex items-center text-brand-red-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                Trusted Property Expertise in Ghana
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Local Market Knowledge</h3>
                    <p className="text-gray-600">
                      Deep understanding of Ghana's property landscape, from Accra to Kumasi and beyond.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Legal Compliance</h3>
                    <p className="text-gray-600">
                      Full adherence to Ghana's land and property regulations with documented processes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Fraud Prevention</h3>
                    <p className="text-gray-600">
                      Rigorous verification processes to protect against land fraud and title disputes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Professional Network</h3>
                    <p className="text-gray-600">
                      Connected with lawyers, surveyors, and financial institutions for seamless transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-bold">Schedule a Consultation</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-600 mb-6">
                    Get expert advice on your property needs. Contact us today for a free consultation.
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

      {/* Service Modal */}
      {selectedService && (
        <PropertyServiceModal
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
          service={selectedService}
        />
      )}
    </div>
  );
}
