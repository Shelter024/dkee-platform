import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function canEditPages(role?: string) {
  return !!role && ['ADMIN','CEO','MANAGER','HR','CONTENT_EDITOR'].includes(role);
}

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const page = await prisma.page.findUnique({ where: { slug: params.slug } });
    if (!page || !page.published) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ page });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canEditPages(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const { title, content, published, category, template } = body;
    const existing = await prisma.page.findUnique({ where: { slug: params.slug } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const page = await prisma.page.update({
      where: { slug: params.slug },
      data: {
        title: title ?? existing.title,
        content: content ?? existing.content,
        published: published ?? existing.published,
        publishedAt: published && !existing.published ? new Date() : existing.publishedAt,
        category: category !== undefined ? category : existing.category,
        template: template ?? existing.template,
      }
    });
    return NextResponse.json({ page });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !canEditPages(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    await prisma.page.delete({ where: { slug: params.slug } });
    return NextResponse.json({ success: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
