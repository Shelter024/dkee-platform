
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ActivityTracker } from '@/components/providers/ActivityTracker';
import { ToastProvider } from '@/components/providers/ToastProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DynamicBackground from '@/components/layout/DynamicBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DK Executive Engineers',
  description: 'Automotive and Property Management Solutions',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DK Executive',
  },
};

export function generateViewport() {
  return {
    themeColor: '#0ea5e9',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  } as const;
}


// Utility: Infer pageType from route or context (can be improved for per-page granularity)
function getPageType(): string {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.includes('/loyalty')) return 'loyalty';
    if (path.includes('/inventory')) return 'inventory';
    if (path.includes('/marketing')) return 'marketing';
    if (path.includes('/payroll')) return 'payroll';
    if (path.includes('/appointments')) return 'appointments';
    if (path.includes('/admin')) return 'admin';
    if (path === '/') return 'home';
  }
  return '';
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // For SSR, fallback to default gradient; for CSR, use getPageType
  const pageType = typeof window !== 'undefined' ? getPageType() : '';
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash: inline script sets initial class before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {try {const stored = localStorage.getItem('dk-theme');const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;const theme = stored || (prefersDark ? 'dark' : 'light');if(theme==='dark'){document.documentElement.classList.add('dark');}document.documentElement.setAttribute('data-theme', theme);} catch(e) {}})();`
          }}
        />
      </head>
      <body className={`${inter.className} theme-transition`}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ActivityTracker />
              <DynamicBackground pageType={pageType}>
                <Navbar />
                <main role="main" className="flex-grow">{children}</main>
                <Footer />
              </DynamicBackground>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
