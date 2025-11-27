import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/search - Global search
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // customers, services, invoices, messages, blog, pages, cms

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const isStaff = ['ADMIN', 'CEO', 'MANAGER', 'STAFF_AUTO', 'STAFF_PROPERTY'].includes(session.user.role);
    const results: any = {};

    // Search blog posts (CMS)
    if (!type || type === 'blog' || type === 'cms') {
      const blogPosts = await prisma.blogPost.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
            { tags: { has: query.toLowerCase() } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          tags: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      results.blog = blogPosts.map(post => ({
        ...post,
        url: `/blog/${post.slug}`,
        type: 'blog',
      }));
    }

    // Search pages (CMS)
    if (!type || type === 'pages' || type === 'cms') {
      const pages = await prisma.page.findMany({
        where: {
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { slug: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          createdAt: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      results.pages = pages.map(page => {
        // Extract preview from content
        let preview = '';
        try {
          preview = page.content.substring(0, 150);
        } catch {
          preview = '';
        }

        return {
          id: page.id,
          title: page.title,
          slug: page.slug,
          preview,
          createdAt: page.createdAt,
          url: `/${page.slug}`,
          type: 'page',
        };
      });
    }

    // Search customers
    if (!type || type === 'customers') {
      if (isStaff) {
        const customers = await prisma.customer.findMany({
          where: {
            OR: [
              { user: { name: { contains: query, mode: 'insensitive' } } },
              { user: { email: { contains: query, mode: 'insensitive' } } },
              { user: { phone: { contains: query, mode: 'insensitive' } } },
            ],
          },
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
          take: 10,
        });
        results.customers = customers;
      }
    }

    // Search services
    if (!type || type === 'services') {
      const serviceWhere: any = {
        OR: [
          { serviceType: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      };

      if (!isStaff) {
        const customer = await prisma.customer.findUnique({
          where: { userId: session.user.id },
        });
        if (customer) serviceWhere.customerId = customer.id;
      }

      const services = await prisma.automotiveService.findMany({
        where: serviceWhere,
        include: {
          customer: { include: { user: { select: { name: true } } } },
          vehicle: true,
        },
        take: 10,
      });
      results.services = services;
    }

    // Search invoices
    if (!type || type === 'invoices') {
      const invoiceWhere: any = {};

      if (!isStaff) {
        const customer = await prisma.customer.findUnique({
          where: { userId: session.user.id },
        });
        if (customer) {
          invoiceWhere.automotiveService = { customerId: customer.id };
        }
      }

      const invoices = await prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          automotiveService: {
            include: {
              customer: { include: { user: { select: { name: true } } } },
            },
          },
        },
        take: 10,
      });
      results.invoices = invoices.filter((inv: any) =>
        inv.invoiceNumber?.toLowerCase().includes(query.toLowerCase()) ||
        inv.automotiveService?.customer?.user?.name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Search messages
    if (isStaff && (!type || type === 'messages')) {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { subject: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          user: { select: { id: true, name: true } },
          recipient: { select: { id: true, name: true } },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      results.messages = messages.map(m => ({
        id: m.id,
        subject: m.subject,
        content: m.content,
        createdAt: m.createdAt,
        sender: { id: m.user.id, name: m.user.name },
        recipient: m.recipient ? { id: m.recipient.id, name: m.recipient.name } : null,
      }));
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
