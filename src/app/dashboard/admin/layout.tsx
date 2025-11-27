'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Car,
  Building2,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  BarChart3,
  AlertCircle,
  FileText,
  DollarSign,
  MessageSquare,
  Wrench,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile overlay open
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapsed width
  const manualToggleRef = useRef(false);

  // Load persisted collapse state + initial auto-collapse for narrow screens
  useEffect(() => {
    const stored = localStorage.getItem('dk_admin_sidebar_collapsed');
    if (stored === 'true') {
      setSidebarCollapsed(true);
    } else if (stored === null && window.innerWidth < 1280) {
      setSidebarCollapsed(true);
    }
  }, []);

  // Responsive auto-collapse (does not override manual user preference in current session)
  useEffect(() => {
    const handleResize = () => {
      if (manualToggleRef.current) return;
      if (window.innerWidth < 1280) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    manualToggleRef.current = true;
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('dk_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user.role === 'CUSTOMER') {
      router.push('/dashboard/customer');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy-600"></div>
      </div>
    );
  }

  if (!session || session.user.role === 'CUSTOMER') {
    return null;
  }

  const isAdmin = session.user.role === 'ADMIN';
  const isAutoStaff = session.user.role === 'STAFF_AUTO' || isAdmin;
  const isPropertyStaff = session.user.role === 'STAFF_PROPERTY' || isAdmin;

  const adminLinks = [
    { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard, show: true },
      { href: '/dashboard/admin/account', label: 'Account Settings', icon: User, show: true },
      { href: '/dashboard/admin/users', label: 'Users', icon: Users, show: isAdmin || session.user.role === 'CEO' || session.user.role === 'HR' },
      { href: '/dashboard/admin/automotive', label: 'Automotive', icon: Wrench, show: isAutoStaff },
      { href: '/dashboard/admin/vehicles', label: 'Vehicles', icon: Car, show: isAutoStaff },
      { href: '/dashboard/admin/properties', label: 'Properties', icon: Building2, show: isPropertyStaff },
      { href: '/dashboard/admin/inquiries', label: 'Inquiries', icon: MessageSquare, show: isPropertyStaff },
    { href: '/dashboard/admin/services', label: 'Services', icon: Wrench, show: isAutoStaff },
    { href: '/dashboard/admin/payments', label: 'Payments', icon: DollarSign, show: isAdmin || isAutoStaff || isPropertyStaff },
    { href: '/dashboard/admin/messages', label: 'Messages', icon: MessageSquare, show: isAdmin || isAutoStaff || isPropertyStaff },
    { href: '/dashboard/admin/branches', label: 'Branches', icon: Building2, show: isAdmin || session.user.role === 'CEO' || session.user.role === 'MANAGER' },
    { href: '/dashboard/admin/customers', label: 'Customers', icon: Users, show: true },
    { href: '/dashboard/admin/parts', label: 'Spare Parts', icon: Package, show: isAutoStaff },
    { href: '/dashboard/admin/blog', label: 'Blog', icon: FileText, show: isAdmin || session.user.role === 'CEO' || session.user.role === 'MANAGER' || session.user.role === 'HR' },
    { href: '/dashboard/admin/pages', label: 'Pages', icon: FileText, show: isAdmin || session.user.role === 'CEO' || session.user.role === 'MANAGER' },
    { href: '/dashboard/admin/tips', label: 'Tips', icon: AlertCircle, show: isAdmin || session.user.role === 'STAFF_AUTO' || session.user.role === 'CEO' || session.user.role === 'MANAGER' },
    { href: '/dashboard/admin/updates', label: 'Updates', icon: BarChart3, show: isAdmin || session.user.role === 'CEO' },
    { href: '/dashboard/admin/integrations', label: 'Integrations', icon: Settings, show: isAdmin || session.user.role === 'CEO' || session.user.role === 'MANAGER' },
    { href: '/dashboard/admin/emergency', label: 'Emergency', icon: AlertCircle, show: true },
    { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3, show: isAdmin },
    { href: '/dashboard/admin/export-analytics', label: 'Export Analytics', icon: BarChart3, show: isAdmin },
    { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings, show: isAdmin },
  ].filter(link => link.show);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transform transition-all duration-300 ease-in-out z-30 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-16' : 'w-64'} hidden-print`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b transition-all duration-300`}>            
            <Link href="/" className={`flex items-center ${sidebarCollapsed ? 'space-x-0' : 'space-x-2'}`}>
              <div className="w-8 h-8 bg-brand-navy-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">DK</span>
              </div>
              {!sidebarCollapsed && (
                <span className="font-bold text-gray-900 whitespace-nowrap">Admin Panel</span>
              )}
            </Link>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b bg-brand-navy-50 transition-all duration-300">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 bg-brand-navy-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <p className="font-medium text-gray-900 line-clamp-1">{session.user.name}</p>
                  <p className="text-sm text-gray-600">{session.user.role.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${sidebarCollapsed ? 'px-2' : 'px-4'} py-6 overflow-y-auto transition-all duration-300`}>            
            <div className="space-y-1">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-3'} py-2 rounded-lg transition-colors duration-200 ${
                      isActive(link.href)
                        ? 'bg-brand-navy-50 text-brand-navy-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={sidebarCollapsed ? link.label : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    {!sidebarCollapsed && <span className="truncate transition-opacity duration-200">{link.label}</span>}
                    {sidebarCollapsed && (
                      <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                        {link.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t flex flex-col gap-3 transition-all duration-300">
            <button
              onClick={toggleCollapse}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 w-full transition-colors`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronsRight className="w-5 h-5" />
              ) : (
                <ChevronsLeft className="w-5 h-5" />
              )}
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg text-brand-red-600 hover:bg-brand-red-50 w-full transition-colors`}
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-[padding] duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-6 relative">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">
              {pathname === '/dashboard/admin' && 'Admin Dashboard'}
              {pathname === '/dashboard/admin/account' && 'Staff Account Settings'}
            </h1>
          </div>
          {/* Desktop collapse toggle duplicate (quick access) */}
          <div className="hidden lg:block">
            <button
              onClick={toggleCollapse}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronsRight className="w-5 h-5" />
              ) : (
                <ChevronsLeft className="w-5 h-5" />
              )}
            </button>
          </div>
          {/* Decorative gradient underline */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60" />
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in animate-stagger">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
