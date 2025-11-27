import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  folder: string;
  shareableLink: string;
  metadata: Record<string, any>;
}

export async function uploadFile(
  file: Buffer | string,
  options: {
    folder: string;
    filename?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<UploadResult> {
  const { folder, filename, resourceType = 'auto' } = options;

  try {
    // Convert Buffer to base64 data URI for Cloudinary
    const fileData = Buffer.isBuffer(file)
      ? `data:application/octet-stream;base64,${file.toString('base64')}`
      : file;

    const result = await cloudinary.uploader.upload(fileData, {
      folder: `dk-engineers/${folder}`,
      public_id: filename,
      resource_type: resourceType,
      overwrite: false,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      folder: result.folder || folder,
      shareableLink: result.secure_url,
      metadata: {
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
      },
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('File upload failed');
  }
}

export async function deleteFile(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

export function getOptimizedUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string | number;
}): string {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: options?.quality || 'auto',
    width: options?.width,
    height: options?.height,
    crop: options?.crop || 'fill',
    secure: true,
  });
}
