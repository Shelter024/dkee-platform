'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Search, Eye, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyGHS } from '@/lib/utils';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  imageUrl?: string;
  description: string;
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(
    (property) =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Properties</h1>
          <p className="text-gray-600 mt-1">Browse properties for sale or rent</p>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by title, location, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </Card>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'No properties are currently available. Check back later!'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="h-48 bg-gray-200 relative">
                {property.imageUrl ? (
                  <img
                    src={property.imageUrl}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <Badge
                  variant={property.status === 'AVAILABLE' ? 'success' : 'warning'}
                  className="absolute top-2 right-2"
                >
                  {property.status}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{property.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{property.location}</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>{property.bedrooms} bed</span>
                  <span>•</span>
                  <span>{property.bathrooms} bath</span>
                  <span>•</span>
                  <span>{property.area} m²</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-xl font-bold text-brand-navy-600">
                      {formatCurrencyGHS(property.price)}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/dashboard/customer/properties/${property.id}`)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Info */}
      <Card className="p-6 bg-brand-navy-50">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">Need Help Finding a Property?</h3>
        <p className="text-gray-600 mb-4">
          Contact our property team for personalized assistance in finding your ideal property.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Phone className="w-5 h-5 text-brand-navy-600" />
            <span>+233 24 101 8947</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Mail className="w-5 h-5 text-brand-navy-600" />
            <span>properties@dkee.com</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
