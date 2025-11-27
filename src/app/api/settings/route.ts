import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/roles';
import {
  decryptSetting,
  isSensitiveSetting,
  setConfig,
  CONFIG_CATEGORIES,
} from '@/lib/config';

// GET /api/settings - List all settings with categories (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    // Get all settings from database
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    // Build settings map with decrypted values (masked for sensitive ones)
    const settingsMap: Record<string, any> = {};

    for (const setting of settings) {
      try {
        let value = setting.value;

        // Decrypt if sensitive
        if (isSensitiveSetting(setting.key)) {
          value = decryptSetting(value);
          // Mask sensitive values in response
          value = '********';
        }

        settingsMap[setting.key] = {
          key: setting.key,
          value,
          isSensitive: isSensitiveSetting(setting.key),
          updatedAt: setting.updatedAt,
        };
      } catch (error) {
        console.error(`Error processing setting ${setting.key}:`, error);
        settingsMap[setting.key] = {
          key: setting.key,
          value: '*** ERROR ***',
          isSensitive: true,
          error: 'Decryption failed',
        };
      }
    }

    // If category filter requested, return only those settings
    if (category && CONFIG_CATEGORIES[category as keyof typeof CONFIG_CATEGORIES]) {
      const categoryConfig = CONFIG_CATEGORIES[category as keyof typeof CONFIG_CATEGORIES];
      const categorySettings = categoryConfig.settings.map((s) => ({
        ...s,
        currentValue: settingsMap[s.key]?.value || null,
        isConfigured: !!settingsMap[s.key],
      }));

      return NextResponse.json({
        category,
        settings: categorySettings,
      });
    }

    // Return all categories with their configuration status
    const categories = Object.entries(CONFIG_CATEGORIES).map(([key, config]) => ({
      key,
      label: config.label,
      icon: config.icon,
      settings: config.settings.map((s) => ({
        ...s,
        currentValue: settingsMap[s.key]?.value || null,
        isConfigured: !!settingsMap[s.key],
      })),
      isConfigured: config.settings
        .filter((s) => s.required)
        .every((s) => settingsMap[s.key]),
    }));

    return NextResponse.json({
      categories,
      settingsMap,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Update or create setting (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Missing required fields: key and value' },
        { status: 400 }
      );
    }

    // Validate key exists in config categories
    const allSettingKeys = Object.values(CONFIG_CATEGORIES).flatMap((cat) =>
      cat.settings.map((s) => s.key)
    );

    if (!allSettingKeys.includes(key)) {
      return NextResponse.json(
        { error: 'Invalid setting key' },
        { status: 400 }
      );
    }

    // Store setting (will encrypt if sensitive)
    await setConfig(key, value, prisma);

    return NextResponse.json({
      message: 'Setting updated successfully',
      key,
      isSensitive: isSensitiveSetting(key),
    });
  } catch (error) {
    console.error('Update setting error:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - bulk update [{ key, value }] (kept for backward compatibility)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected array of {key,value}' }, { status: 400 });
    }

    for (const item of body) {
      await setConfig(String(item.key), String(item.value), prisma);
    }

    const settings = await prisma.setting.findMany();
    return NextResponse.json({ settings });
  } catch (e: any) {
    console.error('PUT /api/settings error', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/settings - Delete setting (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session.user)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing setting key' },
        { status: 400 }
      );
    }

    await prisma.setting.delete({
      where: { key },
    });

    return NextResponse.json({
      message: 'Setting deleted successfully',
      key,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      );
    }

    console.error('Delete setting error:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}
