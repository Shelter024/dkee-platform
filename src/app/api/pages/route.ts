import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/roles';

function canEditPages(role?: string) {
  return !!role && ['ADMIN','CEO','MANAGER','HR','CONTENT_EDITOR'].includes(role);
}

export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      where: { published: true },
      select: { id:true, title:true, slug:true, published:true, updatedAt:true, createdAt:true }
    });
    return NextResponse.json({ pages });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canEditPages(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const data = await req.json();
    const { title, slug, content, published, category, template } = data;
    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content,
        published: !!published,
        publishedAt: published ? new Date() : null,
        category: category || null,
        template: template || 'default',
      }
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
