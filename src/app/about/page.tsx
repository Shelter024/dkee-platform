import { prisma } from '@/lib/prisma';
import PageRenderer from '@/components/pages/PageRenderer';
import { CheckCircle, Target, Lightbulb, Shield } from 'lucide-react';

export const revalidate = 300; // cache 5m

async function getAboutPage() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'about' } });
    return page && page.published ? page : null;
  } catch {
    return null;
  }
}

const features = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'We unify automotive reliability and property management excellence across West Africa.',
    gradient: 'from-blue-600 to-cyan-600'
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Modern engineering, data-driven decision making, and customer empathy drive our solutions.',
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    icon: Shield,
    title: 'Commitment',
    description: 'We champion transparency, safety, and sustainable growth for our clients and communities.',
    gradient: 'from-green-600 to-emerald-600'
  },
];

const services = [
  'Preventive automotive care and diagnostics',
  'Secure Vehicle Tracking & service reminders',
  'Property listing, surveying, and inquiry management',
  'Integrated customer portal with real-time updates',
];

export default async function AboutPage() {
  const page = await getAboutPage();
  
  if (!page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
            <div className="text-center animate-fade-in">
              <h1 className="text-5xl sm:text-6xl font-bold mb-6 gradient-text">
                About DK Executive Engineers
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Rooted in Ghanaian values, we apply modern engineering and customer empathy to deliver 
                dependable maintenance, smart tracking, and curated property services.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16 animate-stagger">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="glossy-card p-8 hover-lift group">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 gradient-text">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* What We Deliver Section */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="glossy-card p-10 animate-fade-in">
            <h2 className="text-3xl font-bold mb-8 text-center gradient-text">What We Deliver</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {services.map((service, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-6 h-6 text-green-500 group-hover:scale-125 transition-transform duration-300" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 text-lg">{service}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heritage Section */}
        <div className="max-w-5xl mx-auto px-4 py-16 pb-24">
          <div className="metric-card p-10 text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 gradient-text">Heritage & Innovation</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
              We combine traditional Ghanaian business values with cutting-edge technology to create 
              solutions that truly serve our communities. Our approach balances respect for heritage 
              with bold innovation in automotive and property services.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
      <PageRenderer title={page.title} content={page.content} template={page.template} />
    </div>
  );
}
