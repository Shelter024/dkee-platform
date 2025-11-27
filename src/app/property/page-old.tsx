import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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

export default function PropertyPage() {
  const services = [
    {
      icon: Building2,
      title: 'Property Sales',
      description: 'Expert assistance in buying and selling residential and commercial properties',
    },
    {
      icon: Key,
      title: 'Leasing & Rental',
      description: 'Comprehensive leasing and rental management services',
    },
    {
      icon: FileText,
      title: 'Property Survey',
      description: 'Professional property survey and inspection services',
    },
    {
      icon: TrendingUp,
      title: 'Property Valuation',
      description: 'Accurate property valuation and market analysis',
    },
    {
      icon: Home,
      title: 'Consultation',
      description: 'Expert real estate consultation and advisory services',
    },
    {
      icon: MapPin,
      title: 'Property Management',
      description: 'Full-service property management solutions',
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
              Trusted stewardship of residential and commercial assets—from Accra’s rapid growth corridors
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
                <Card key={index} className="hover-lift border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
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

      {/* Featured Properties Section */}
      <section className="bg-gray-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Featured Ghana Listings
            </h2>
            <p className="text-xl text-gray-600">
              Sampling of prime assets—full dynamic listings available upon secure login.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Sample Property 1 */}
            <Card>
              <div className="aspect-video bg-gray-300 rounded-t-lg"></div>
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold">3 Bedroom Apartment in Lekki</h3>
                  <Badge variant="success">Available</Badge>
                </div>
                <p className="text-gray-600 mb-4">
                  Modern apartment with excellent amenities in prime location
                </p>
                <div className="flex items-center text-gray-600 space-x-4 mb-4">
                  <span className="flex items-center">
                    <Home className="w-4 h-4 mr-1" />3 Beds
                  </span>
                  <span>2.5 Baths</span>
                  <span>1,200 sqft</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary-600">
                    ₦2,500,000
                    <span className="text-sm text-gray-600 font-normal">/year</span>
                  </div>
                  <Button variant="outline">View Details</Button>
                </div>
              </CardBody>
            </Card>

            {/* Sample Property 2 */}
            <Card>
              <div className="aspect-video bg-gray-300 rounded-t-lg"></div>
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold">5 Bedroom Detached House</h3>
                  <Badge variant="success">Available</Badge>
                </div>
                <p className="text-gray-600 mb-4">
                  Spacious family home with large compound
                </p>
                <div className="flex items-center text-gray-600 space-x-4 mb-4">
                  <span className="flex items-center">
                    <Home className="w-4 h-4 mr-1" />5 Beds
                  </span>
                  <span>4 Baths</span>
                  <span>3,500 sqft</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary-600">
                    ₦85,000,000
                  </div>
                  <Button variant="outline">View Details</Button>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/login">
              <Button size="lg">View All Properties</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Investors Trust DK in Ghana
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Professional Service</h3>
              <p className="text-gray-600">
                Expert real estate professionals at your service
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Market Knowledge</h3>
              <p className="text-gray-600">
                Deep understanding of local real estate markets
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Legal Compliance</h3>
              <p className="text-gray-600">
                All transactions handled with full legal compliance
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Client Focused</h3>
              <p className="text-gray-600">
                Your needs and satisfaction are our priority
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
