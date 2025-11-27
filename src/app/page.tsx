import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { prisma } from '@/lib/prisma';
import {
  Car,
  Building2,
  Shield,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'hero';
  content: any;
}

// Fallback static homepage content (original design)
function FallbackHome() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-navy-600 to-brand-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Engineering Excellence Rooted<br />
              <span className="text-brand-red-200">In Ghanaian Heritage</span>
            </h1>
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto text-brand-navy-100">
              From Pawpaw Street, East Legon – we power reliable automotive care and
              property stewardship across Accra and future branches nationwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/automotive">
                <Button size="lg" variant="accent">
                  <Car className="w-5 h-5 mr-2" />
                  Automotive Services
                </Button>
              </Link>
              <Link href="/property">
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                  <Building2 className="w-5 h-5 mr-2" />
                  Property Management
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-navy-900 mb-4">Our Integrated Services</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Blending modern engineering with Ghanaian resilience for vehicles and real estate assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-stagger">
            {/* Automotive Services */}
            <Card className="hover-lift border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <Car className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-navy-900 group-hover:text-brand-red-600 transition-colors">Automotive Services</h3>
                </div>
              </CardHeader>
              <CardBody>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Vehicle Repairs & Maintenance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Machine Diagnosis & Inspection</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Spare Parts Supply</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Vehicle Tracking Device Installation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Fleet Management Solutions</span>
                  </li>
                </ul>
                <Link href="/automotive" className="mt-6 inline-block">
                  <Button variant="outline">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardBody>
            </Card>

            {/* Property Management */}
            <Card className="hover-lift border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-navy-900 group-hover:text-brand-navy-600 transition-colors">Property Management</h3>
                </div>
              </CardHeader>
              <CardBody>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Property Sales & Purchase</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Leasing & Rental Services</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Property Survey & Inspection</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Real Estate Consultation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
                    <span>Property Valuation</span>
                  </li>
                </ul>
                <Link href="/property" className="mt-6 inline-block">
                  <Button variant="outline">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-neutral-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-navy-900 mb-4">Why Ghana Chooses DK</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Rooted in local knowledge—delivering sustainable, culturally aware engineering and property solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-stagger">
            <div className="text-center group hover-lift p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy-900 mb-2 group-hover:text-brand-red-600 transition-colors">Expert Team</h3>
              <p className="text-neutral-600">
                Highly skilled professionals with years of industry experience
              </p>
            </div>

            <div className="text-center group hover-lift p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy-900 mb-2 group-hover:text-brand-navy-600 transition-colors">Trusted Service</h3>
              <p className="text-neutral-600">
                Reliable solutions backed by our commitment to quality
              </p>
            </div>

            <div className="text-center group hover-lift p-6 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-brand-navy-900 mb-2 group-hover:text-green-600 transition-colors">Customer First</h3>
              <p className="text-neutral-600">
                Dedicated to exceeding your expectations every time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-navy-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-neutral-600 mb-8">
            Contact us today or create an account to access our services
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="accent">
                Contact Us
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Customer Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default async function HomePage() {
  // Attempt to load a published CMS page with slug 'home'
  let page = null;
  try {
    page = await prisma.page.findUnique({
      where: { slug: 'home', published: true },
    });
  } catch (error) {
    console.error('Error loading CMS page:', error);
  }

  if (!page) {
    // No CMS-managed homepage yet; show fallback static design
    return <FallbackHome />;
  }

  let contentBlocks: ContentBlock[] = [];
  try {
    contentBlocks = JSON.parse(page.content || '[]');
  } catch {
    contentBlocks = [];
  }

  // If CMS page exists but has no blocks, still fallback
  if (contentBlocks.length === 0) {
    return <FallbackHome />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {contentBlocks.map((block) => {
        if (block.type === 'hero') {
          return (
            <section
              key={block.id}
              className="relative h-[500px] flex items-center justify-center text-white"
              style={{
                backgroundImage: block.content.backgroundImage
                  ? `url(${block.content.backgroundImage})`
                  : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black opacity-40"></div>
              <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
                <h1 className="text-5xl md:text-6xl font-bold mb-4">
                  {block.content.title}
                </h1>
                {block.content.subtitle && (
                  <p className="text-xl md:text-2xl mb-8">
                    {block.content.subtitle}
                  </p>
                )}
                {block.content.ctaText && block.content.ctaLink && (
                  <Link href={block.content.ctaLink}>
                    <Button size="lg" variant="accent">
                      {block.content.ctaText}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </section>
          );
        }

        if (block.type === 'text') {
          return (
            <section key={block.id} className="py-12">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              </div>
            </section>
          );
        }

        if (block.type === 'image') {
          return (
            <section key={block.id} className="py-12">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <img
                  src={block.content.url}
                  alt={block.content.alt || ''}
                  className="w-full rounded-lg shadow-lg"
                />
                {block.content.caption && (
                  <p className="text-center text-gray-600 mt-4 italic">
                    {block.content.caption}
                  </p>
                )}
              </div>
            </section>
          );
        }

        if (block.type === 'video') {
          const getYouTubeEmbedUrl = (url: string) => {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            const videoId = match && match[2].length === 11 ? match[2] : null;
            return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
          };
          return (
            <section key={block.id} className="py-12">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="aspect-video">
                  <iframe
                    src={getYouTubeEmbedUrl(block.content.url)}
                    title="Video"
                    className="w-full h-full rounded-lg shadow-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {block.content.caption && (
                  <p className="text-center text-gray-600 mt-4 italic">
                    {block.content.caption}
                  </p>
                )}
              </div>
            </section>
          );
        }
        return null;
      })}
    </div>
  );
}
