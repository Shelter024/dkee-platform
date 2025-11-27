import { prisma } from '@/lib/prisma';
import PageRenderer from '@/components/pages/PageRenderer';
import { Users, Briefcase, Heart, Wrench, Home, TrendingUp } from 'lucide-react';

export const revalidate = 300;

async function getTeamPage() {
  try {
    const page = await prisma.page.findUnique({ where: { slug: 'team' } });
    return page && page.published ? page : null;
  } catch {
    return null;
  }
}

const teamMembers = [
  { 
    name: 'Chief Executive Officer', 
    role: 'Vision & Strategy', 
    icon: TrendingUp,
    gradient: 'from-blue-600 to-cyan-600',
    description: 'Leading strategic direction and company growth'
  },
  { 
    name: 'Operations Manager', 
    role: 'Process Optimization', 
    icon: Briefcase,
    gradient: 'from-purple-600 to-pink-600',
    description: 'Streamlining workflows and service delivery'
  },
  { 
    name: 'Human Resources', 
    role: 'People & Culture', 
    icon: Heart,
    gradient: 'from-red-600 to-orange-600',
    description: 'Building exceptional teams and workplace culture'
  },
  { 
    name: 'Automotive Manager', 
    role: 'Workshop Excellence', 
    icon: Wrench,
    gradient: 'from-green-600 to-emerald-600',
    description: 'Ensuring top-tier automotive service quality'
  },
  { 
    name: 'Property Manager', 
    role: 'Portfolio Growth', 
    icon: Home,
    gradient: 'from-indigo-600 to-purple-600',
    description: 'Managing property listings and client relationships'
  },
];

const principles = [
  { title: 'Integrity', description: 'Honesty and transparency in every interaction' },
  { title: 'Reliability', description: 'Consistent excellence in service delivery' },
  { title: 'Innovation', description: 'Forward-thinking solutions guided by local context' },
  { title: 'Collaboration', description: 'Cross-functional teamwork for client success' },
];

export default async function TeamPage() {
  const page = await getTeamPage();
  
  if (!page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-pink-600/10 dark:from-purple-600/20 dark:via-blue-600/20 dark:to-pink-600/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-6 shadow-2xl">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold mb-6 gradient-text">
                Meet the Team
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                We are a multidisciplinary group aligning engineering, service operations, and customer success 
                to deliver exceptional automotive and property solutions.
              </p>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-stagger">
            {teamMembers.map((member, index) => {
              const Icon = member.icon;
              return (
                <div key={index} className="glossy-card p-8 hover-lift group">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 gradient-text">{member.name}</h3>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {member.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leadership Principles */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="glossy-card p-10 animate-fade-in">
            <h2 className="text-3xl font-bold mb-8 text-center gradient-text">Leadership Principles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {principles.map((principle, index) => (
                <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-lg font-bold mb-3 text-blue-600 dark:text-blue-400">
                    {principle.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collaborative Focus */}
        <div className="max-w-5xl mx-auto px-4 py-16 pb-24">
          <div className="metric-card p-10 text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 gradient-text">Collaborative Focus</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
              We work cross-functionally to ensure automotive services and property solutions reinforce 
              each other for long-term client value. Our integrated approach delivers seamless experiences 
              across all touchpoints.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10 animate-fade-in">
      <PageRenderer title={page.title} content={page.content} template={page.template} />
    </div>
  );
}
