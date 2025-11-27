import React from 'react';

// Utility: Choose background gradient based on page type/content
const getGradient = (pageType: string) => {
  switch (pageType) {
    case 'loyalty':
      return 'bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-700';
    case 'inventory':
      return 'bg-gradient-to-br from-blue-700 via-green-500 to-teal-400';
    case 'marketing':
      return 'bg-gradient-to-br from-purple-700 via-pink-500 to-fuchsia-400';
    case 'payroll':
      return 'bg-gradient-to-br from-teal-700 via-green-400 to-emerald-300';
    case 'appointments':
      return 'bg-gradient-to-br from-cyan-700 via-sky-500 to-indigo-400';
    case 'admin':
      return 'bg-gradient-to-br from-gray-900 via-slate-700 to-zinc-800';
    case 'white':
      return 'bg-white';
    default:
      return 'bg-gradient-to-br from-slate-900 via-gray-800 to-indigo-900';
  }
};

interface DynamicBackgroundProps {
  pageType?: string;
  children: React.ReactNode;
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ pageType = '', children }) => {
  const gradientClass = getGradient(pageType);
  return (
    <div className={`min-h-screen w-full ${gradientClass} transition-colors duration-700`}>
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
      {/* Optional: Add animated overlays, SVGs, or blur effects for extra polish */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        {/* Example: SVG overlay or animated shapes */}
      </div>
    </div>
  );
};

export default DynamicBackground;
