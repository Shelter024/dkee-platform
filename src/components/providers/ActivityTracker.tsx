'use client';

import { useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

export function ActivityTracker() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const timeoutMinutesRef = useRef<number>(15);
  const autoLogoutEnabledRef = useRef<boolean>(true);

  useEffect(() => {
    // Only track activity for authenticated staff users
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const userRole = (session.user as any).role;
    
    // Only staff members need auto-logout
    if (userRole === 'CUSTOMER') {
      return;
    }

    // Fetch session settings
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings/session');
        if (res.ok) {
          const settings = await res.json();
          timeoutMinutesRef.current = settings.staffSessionTimeout || 15;
          autoLogoutEnabledRef.current = settings.autoLogoutEnabled !== false;
        }
      } catch (error) {
        console.error('Failed to fetch session settings:', error);
      }
    };

    fetchSettings();

    // Track user activity
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Check inactivity every 30 seconds
    checkIntervalRef.current = setInterval(() => {
      if (!autoLogoutEnabledRef.current) {
        return;
      }

      const now = Date.now();
      const inactiveTime = now - lastActivityRef.current;
      const timeoutMs = timeoutMinutesRef.current * 60 * 1000;

      if (inactiveTime >= timeoutMs) {
        // Log out due to inactivity
        toast.error(`Logged out due to ${timeoutMinutesRef.current} minutes of inactivity`);
        signOut({ callbackUrl: '/login' });
      } else {
        // Show warning 2 minutes before logout
        const timeRemaining = timeoutMs - inactiveTime;
        if (timeRemaining <= 2 * 60 * 1000 && timeRemaining > 1.5 * 60 * 1000) {
          toast('You will be logged out soon due to inactivity', {
            icon: '⚠️',
            duration: 5000,
          });
        }
      }
    }, 30000); // Check every 30 seconds

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [session, status, pathname]);

  return null; // This component doesn't render anything
}
