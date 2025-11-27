import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// Extend the User type locally to include accountStatus for authorization checks
type UserWithStatus = {
  id: string;
  email: string;
  password: string | null;
  name: string;
  role: string;
  accountStatus?: string;
  otpSecret?: string | null;
  otpExpiry?: Date | null;
};

// Helper to get session settings
async function getSessionSettings() {
  try {
    let settings = await prisma.sessionSettings.findFirst();
    if (!settings) {
      // Create default if none exist
      settings = await prisma.sessionSettings.create({
        data: {
          customerRememberMe: true,
          staffSessionTimeout: 15,
          autoLogoutEnabled: true,
          customerSessionMaxAge: 2592000, // 30 days
          staffSessionMaxAge: 28800, // 8 hours
        },
      });
    }
    return settings;
  } catch (error) {
    console.error('Failed to fetch session settings:', error);
    // Return defaults on error
    return {
      customerRememberMe: true,
      staffSessionTimeout: 15,
      autoLogoutEnabled: true,
      customerSessionMaxAge: 2592000,
      staffSessionMaxAge: 28800,
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = (await prisma.user.findUnique({
          where: { email: credentials.email },
        })) as UserWithStatus | null;

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        if (user.accountStatus === 'PENDING_VERIFICATION') {
          throw new Error('Please verify your email address before logging in');
        }
        if (user.accountStatus === 'PENDING_APPROVAL') {
          throw new Error('Your account is pending admin approval. You will be notified once approved.');
        }
        if (user.accountStatus === 'REJECTED') {
          throw new Error('Your account registration was not approved. Please contact support for more information.');
        }
        if (user.accountStatus === 'SUSPENDED') {
          throw new Error('Your account has been suspended. Please contact support.');
        }

        const isCorrectPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountStatus: user.accountStatus,
          rememberMe: credentials.rememberMe === 'true',
        } as any;
      },
    }),
    CredentialsProvider({
      name: 'Phone OTP',
      id: 'phone-otp',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
        rememberMe: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          throw new Error('Phone and OTP required');
        }
        const user = (await prisma.user.findFirst({ where: { phone: credentials.phone } })) as UserWithStatus | null;
        if (!user) {
          throw new Error('Invalid credentials');
        }
        if (user.accountStatus === 'PENDING_VERIFICATION') {
          throw new Error('Email/phone verification pending');
        }
        if (user.accountStatus === 'PENDING_APPROVAL') {
          throw new Error('Account pending admin approval');
        }
        if (user.accountStatus === 'REJECTED') {
          throw new Error('Account rejected');
        }
        if (user.accountStatus === 'SUSPENDED') {
          throw new Error('Account suspended');
        }
        if (!user.otpSecret || !user.otpExpiry) {
          throw new Error('No OTP requested or expired');
        }
        if (new Date() > user.otpExpiry) {
          throw new Error('OTP expired');
        }
        if (user.otpSecret !== credentials.otp) {
          throw new Error('Invalid OTP');
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { otpSecret: null, otpExpiry: null },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountStatus: user.accountStatus,
          rememberMe: credentials.rememberMe === 'true',
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.accountStatus = (user as any).accountStatus;
        token.rememberMe = (user as any).rememberMe;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
        (session.user as any).accountStatus = token.accountStatus as string;
      }
      
      // Apply session maxAge based on role and rememberMe
      const userRole = token.role as string;
      const rememberMe = token.rememberMe as boolean;
      const settings = await getSessionSettings();
      
      // Staff always get staff session max age (no remember me option)
      if (userRole !== 'CUSTOMER') {
        (session as any).maxAge = settings.staffSessionMaxAge;
      } else {
        // Customers: if rememberMe is checked, use customer max age, else use staff max age
        (session as any).maxAge = rememberMe ? settings.customerSessionMaxAge : settings.staffSessionMaxAge;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
