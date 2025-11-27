import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch tasks
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const status = searchParams.get('status');

    const where: any = {};
    if (assignedToMe) where.assignedToId = session.user.id;
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 100,
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, taskType, category, priority, assignedToId, department, dueDate, estimatedHours, tags } = body;

    const count = await prisma.task.count();
    const taskNumber = `TSK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(5, '0')}`;

    const task = await prisma.task.create({
      data: {
        taskNumber,
        title,
        description,
        taskType,
        category,
        priority,
        status: 'TODO',
        assignedToId,
        assignedToName: 'Staff Member',
        assignedById: session.user.id,
        assignedByName: session.user.name || 'Unknown',
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        progress: 0,
        checklist: [],
      },
    });

    return NextResponse.json({ message: 'Task created', task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
