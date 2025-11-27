import axios from 'axios';

export async function sendExpoNotification(token: string, title: string, body: string, data?: Record<string, any>) {
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  };
  const res = await axios.post('https://exp.host/--/api/v2/push/send', message, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return res.data;
}/**
 * Notification utilities for content publishing
 * Sends email/SMS notifications when content is published
 */

import { sendEmail } from './email';
import { sendSMS } from './sms';
import { prisma } from './prisma';

interface NotifyPublishOptions {
  type: 'blog' | 'page';
  title: string;
  slug: string;
  authorId: string;
}

/**
 * Send notifications when content is published
 */
export async function notifyPublish(options: NotifyPublishOptions): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dkee.com';
    const url = options.type === 'blog' 
      ? `${baseUrl}/blog/${options.slug}`
      : `${baseUrl}/${options.slug}`;

    // Get author details
    const author = await prisma.user.findUnique({
      where: { id: options.authorId },
      select: { name: true, email: true },
    });

    if (!author) {
      console.warn('[NOTIFY] Author not found:', options.authorId);
      return;
    }

    // Get notification subscribers (e.g., admins, managers)
    const subscribers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'CEO', 'MANAGER'],
        },
      },
      select: {
        email: true,
        phone: true,
        name: true,
      },
    });

    // Send email notifications
    const emailPromises = subscribers.map(async (subscriber) => {
      if (!subscriber.email) return;

      await sendEmail({
        to: subscriber.email,
        subject: `New ${options.type === 'blog' ? 'Blog Post' : 'Page'} Published: ${options.title}`,
        text: `
Hello ${subscriber.name},

A new ${options.type === 'blog' ? 'blog post' : 'page'} has been published:

Title: ${options.title}
Author: ${author.name}
URL: ${url}

Visit the site to view the ${options.type === 'blog' ? 'post' : 'page'}.

Best regards,
DKee Team
        `.trim(),
        html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>New ${options.type === 'blog' ? 'Blog Post' : 'Page'} Published</h2>
  <p>Hello ${subscriber.name},</p>
  <p>A new ${options.type === 'blog' ? 'blog post' : 'page'} has been published:</p>
  <ul>
    <li><strong>Title:</strong> ${options.title}</li>
    <li><strong>Author:</strong> ${author.name}</li>
    <li><strong>URL:</strong> <a href="${url}">${url}</a></li>
  </ul>
  <p>
    <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #D4AF37; color: white; text-decoration: none; border-radius: 4px;">
      View ${options.type === 'blog' ? 'Post' : 'Page'}
    </a>
  </p>
  <p>Best regards,<br>DKee Team</p>
</div>
        `.trim(),
      });
    });

    // Send SMS notifications (optional, only if phone configured)
    const smsPromises = subscribers
      .filter((s) => s.phone)
      .map(async (subscriber) => {
        await sendSMS(
          subscriber.phone!,
          `New ${options.type === 'blog' ? 'post' : 'page'} published: "${options.title}" by ${author.name}. View: ${url}`
        );
      });

    // Execute all notifications in parallel
    await Promise.allSettled([...emailPromises, ...smsPromises]);

    console.log(`[NOTIFY] Sent notifications for ${options.type}: ${options.title}`);
  } catch (error) {
    // Don't throw - notifications should not break the application
    console.error('[NOTIFY] Failed to send publish notifications:', error);
  }
}

/**
 * Notify when a blog post is published
 */
export async function notifyBlogPublished(postId: string): Promise<void> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      title: true,
      slug: true,
      authorId: true,
    },
  });

  if (!post) {
    console.warn('[NOTIFY] Blog post not found:', postId);
    return;
  }

  await notifyPublish({
    type: 'blog',
    title: post.title,
    slug: post.slug,
    authorId: post.authorId,
  });
}

/**
 * Notify when a page is published
 */
export async function notifyPagePublished(pageId: string): Promise<void> {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      title: true,
      slug: true,
    },
  });

  if (!page) {
    console.warn('[NOTIFY] Page not found:', pageId);
    return;
  }

  // Pages don't have authorId, use system/admin
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });

  await notifyPublish({
    type: 'page',
    title: page.title,
    slug: page.slug,
    authorId: admin?.id || 'system',
  });
}
