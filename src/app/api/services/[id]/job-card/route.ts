import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isElevatedRole } from '@/lib/roles';
import { generateJobCardPDF } from '@/lib/pdf';
import { uploadFile } from '@/lib/cloudinary';

// GET /api/services/[id]/job-card - Generate Job Card PDF
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isElevatedRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const service = await prisma.automotiveService.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        vehicle: true,
        approvedByUser: {
          select: { name: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Service must be approved to generate job card' },
        { status: 400 }
      );
    }

    if (!service.jobCardNumber) {
      return NextResponse.json(
        { error: 'Job card number not assigned' },
        { status: 400 }
      );
    }

    // Generate Job Card PDF
    const pdfBuffer = await generateJobCardPDF({
      jobCardNumber: service.jobCardNumber,
      date: service.createdAt,
      estimatedCompletion: service.estimatedCompletion || undefined,
      customer: {
        name: service.customer.user.name,
        phone: service.customer.user.phone || 'N/A',
        email: service.customer.user.email,
      },
      vehicle: {
        make: service.vehicle.make,
        model: service.vehicle.model,
        year: service.vehicle.year,
        registrationNumber: service.vehicle.licensePlate || 'N/A',
        mileage: service.vehicle.mileage?.toString(),
      },
      serviceRequested: service.description,
      diagnosis: service.diagnosis || undefined,
      workPerformed: service.workPerformed
        ? service.workPerformed.split('\n').filter((line) => line.trim())
        : undefined,
      partsUsed: service.partsUsed
        ? JSON.parse(service.partsUsed)
        : undefined,
      laborCharges: service.laborCharges || undefined,
      recommendations: service.recommendations || undefined,
      technicianName: service.technicianName || undefined,
    });

    // Upload to Cloudinary
    const uploadResult = await uploadFile(pdfBuffer, {
      folder: 'job-cards',
      filename: `job-card-${service.jobCardNumber}`,
      resourceType: 'raw',
    });

    // Update service with job card PDF URL
    await prisma.automotiveService.update({
      where: { id: service.id },
      data: {
        jobCardPdfUrl: uploadResult.url,
      },
    });

    return NextResponse.json({
      message: 'Job card generated successfully',
      pdfUrl: uploadResult.url,
      jobCardNumber: service.jobCardNumber,
    });
  } catch (error) {
    console.error('Generate job card error:', error);
    return NextResponse.json(
      { error: 'Failed to generate job card' },
      { status: 500 }
    );
  }
}
