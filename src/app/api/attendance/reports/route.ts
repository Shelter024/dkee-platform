import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Generate attendance report
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    const canGenerate = ['CEO', 'ADMIN', 'HR', 'MANAGER'].includes(userRole);

    if (!canGenerate) {
      const permissions = await prisma.staffPermission.findUnique({
        where: { userId: session.user.id },
      });

      if (!permissions?.canGenerateAttendanceReports) {
        return NextResponse.json(
          { error: 'You do not have permission to generate reports' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'MONTHLY';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const departments = searchParams.get('departments');
    const staffIds = searchParams.get('staffIds');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const where: any = {
      logDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (departments) {
      const deptArray = departments.split(',');
      where.staff = {
        department: { in: deptArray },
      };
    }

    if (staffIds) {
      where.staffId = { in: staffIds.split(',') };
    }

    // Fetch logs
    const logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            staffId: true,
            department: true,
          },
        },
      },
      orderBy: [{ logDate: 'desc' }, { staff: { name: 'asc' } }],
    });

    // Calculate statistics
    const uniqueStaffIds = new Set(logs.map((log: any) => log.staffId));
    const totalStaff = uniqueStaffIds.size;

    const presentCount = logs.filter((log: any) =>
      ['PRESENT', 'LATE'].includes(log.status)
    ).length;
    const absentCount = logs.filter((log: any) => log.status === 'ABSENT').length;
    const lateCount = logs.filter((log: any) => log.isLate).length;
    const onLeaveCount = logs.filter((log: any) => log.status === 'ON_LEAVE').length;

    const totalWorkHours = logs.reduce((sum: number, log: any) => sum + (log.totalWorkHours || 0), 0);
    const averageWorkHours = totalStaff > 0 ? totalWorkHours / totalStaff : 0;

    const punctualityRate =
      presentCount > 0 ? ((presentCount - lateCount) / presentCount) * 100 : 0;
    const attendanceRate =
      totalStaff > 0
        ? ((presentCount + onLeaveCount) / (totalStaff * logs.length)) * 100
        : 0;

    const summary = {
      totalStaff,
      totalLogs: logs.length,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      onLeave: onLeaveCount,
      attendanceRate: attendanceRate.toFixed(2),
      punctualityRate: punctualityRate.toFixed(2),
      averageWorkHours: averageWorkHours.toFixed(2),
    };

    // Group by staff for detailed view
    const staffMap = new Map();
    logs.forEach((log) => {
      const staffId = log.staffId;
      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          staff: log.staff,
          logs: [],
          summary: {
            present: 0,
            absent: 0,
            late: 0,
            totalHours: 0,
          },
        });
      }
      const staffData = staffMap.get(staffId);
      staffData.logs.push(log);
      
      if (['PRESENT', 'LATE'].includes(log.status)) staffData.summary.present++;
      if (log.status === 'ABSENT') staffData.summary.absent++;
      if (log.isLate) staffData.summary.late++;
      staffData.summary.totalHours += log.totalWorkHours || 0;
    });

    const detailedData = Array.from(staffMap.values());

    // Generate report number
    const count = await prisma.attendanceReport.count();
    const reportNumber = `ATT-RPT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    // Create report
    const report = await prisma.attendanceReport.create({
      data: {
        reportNumber,
        reportType,
        title: `Attendance Report - ${reportType}`,
        periodStart: new Date(startDate),
        periodEnd: new Date(endDate),
        staffIds: staffIds ? staffIds.split(',') : undefined,
        departments: departments ? departments.split(',') : undefined,
        summary,
        detailedData,
        statistics: {
          averageWorkHours: averageWorkHours.toFixed(2),
          punctualityRate: punctualityRate.toFixed(2),
          attendanceRate: attendanceRate.toFixed(2),
        },
        generatedById: session.user.id,
        isExported: false,
      },
    });

    return NextResponse.json({
      message: 'Report generated successfully',
      report,
      summary,
      detailedData,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}
