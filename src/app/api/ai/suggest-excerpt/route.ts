import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCompletion } from '@/lib/ai';
import { hasPermission } from '@/lib/permissions';

// POST /api/ai/suggest-excerpt - Generate excerpt suggestion from content
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user.role, 'cms:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { content, title } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    // Strip HTML tags for analysis
    const textContent = content.replace(/<[^>]*>/g, ' ').trim();
    const preview = textContent.substring(0, 1000); // Limit to first 1000 chars

    const prompt = `Based on the following blog post content, write a compelling 2-3 sentence excerpt that summarizes the main points and encourages readers to read more.

Title: ${title || 'Untitled'}

Content:
${preview}

Write only the excerpt, no additional commentary.`;

    const response = await generateCompletion(prompt, {
      maxTokens: 200,
      temperature: 0.7,
    });

    return NextResponse.json({
      excerpt: response.text.trim(),
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('POST /api/ai/suggest-excerpt error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}
