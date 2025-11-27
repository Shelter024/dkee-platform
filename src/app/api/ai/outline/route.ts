import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateCompletion } from '@/lib/ai';
import { hasPermission } from '@/lib/permissions';

// POST /api/ai/outline - Generate content outline from topic
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
    const { topic, keywords } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic required' }, { status: 400 });
    }

    const prompt = `Create a detailed blog post outline for the following topic:

Topic: ${topic}
${keywords ? `Keywords to include: ${keywords}` : ''}

Provide a structured outline with:
1. An engaging title
2. Introduction hook
3. 3-5 main sections with subpoints
4. Conclusion
5. Call to action suggestion

Format as a clean, hierarchical outline.`;

    const response = await generateCompletion(prompt, {
      maxTokens: 800,
      temperature: 0.8,
    });

    return NextResponse.json({
      outline: response.text.trim(),
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('POST /api/ai/outline error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal error' },
      { status: 500 }
    );
  }
}
