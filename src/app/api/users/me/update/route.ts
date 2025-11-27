import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { name, email, phone, image, password } = body as {
      name?: string; email?: string; phone?: string; image?: string; password?: string;
    };

    const updates: Record<string, any> = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (phone) updates.phone = phone.trim();
    if (image) updates.image = image;
    if (password) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const user = await prisma.user.update({ where: { id: session.user.id }, data: updates });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, image: user.image } });
  } catch (e: any) {
    console.error('User update error', e);
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Email or phone already in use.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
