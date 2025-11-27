'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { 
  Home, 
  Car, 
  Building2, 
  Phone, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/automotive', label: 'Automotive', icon: Car },
    { href: '/property', label: 'Property', icon: Building2 },
    { href: '/about', label: 'About', icon: User },
    { href: '/team', label: 'Team', icon: User },
    { href: '/contact', label: 'Contact', icon: Phone },
  ];

  const isActive = (href: string) => pathname === href;

  const { theme, toggleTheme } = useTheme();

  return (
    <nav role="navigation" className="bg-[var(--color-surface)] shadow-md sticky top-0 z-50 border-b border-[var(--color-border)] backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="DK Executive Engineers"
                width={40}
                height={40}
                priority
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-brand-navy-900">DK Executive</div>
                <div className="text-xs text-brand-red-600">Engineers</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {publicLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-brand-red-50 text-brand-red-700 border-b-2 border-brand-red-500'
                      : 'text-neutral-700 hover:bg-brand-navy-50 hover:text-brand-navy-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              aria-pressed={theme === 'dark'}
              className="p-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-colors group"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 transition-transform group-hover:rotate-12" />
              ) : (
                <Moon className="w-4 h-4 transition-transform group-hover:-rotate-12" />
              )}
            </button>
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="accent">
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-border)]"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              aria-pressed={theme === 'dark'}
              className="ml-2 p-2 rounded-md text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-border)] group"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 transition-transform group-hover:rotate-12" />
              ) : (
                <Moon className="w-5 h-5 transition-transform group-hover:-rotate-12" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {publicLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.href)
                      ? 'bg-[var(--color-surface-alt)] text-[var(--color-text)] border-l-4 border-[var(--color-primary)]'
                      : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="pt-4 space-y-2">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button variant="outline" size="md" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button size="md" variant="accent" className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
