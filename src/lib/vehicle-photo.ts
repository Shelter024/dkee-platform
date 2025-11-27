export type VehiclePhotoInput = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
};

/**
 * Build a Cloudinary fetch URL that pulls a representative vehicle photo
 * using a query like "2019 Honda Accord silver". Falls back to Unsplash
 * direct source URL if Cloudinary config is missing.
 */
export function buildVehicleUnsplashUrl({ make, model, year, color }: VehiclePhotoInput): string {
  const q = [year, make, model, color].filter(Boolean).join(' ').trim().replace(/\s+/g, '%20');
  return `https://source.unsplash.com/1600x600/?${q}%20car`;
}

export function buildVehiclePhotoUrl({ make, model, year, color }: VehiclePhotoInput): string {
  const unsplash = buildVehicleUnsplashUrl({ make, model, year, color });
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return unsplash;

  const transformations = [
    'f_auto,q_auto',
    'w_1600,h_360,c_fill,g_auto',
    'e_vignette:20',
  ].join(',');

  const remote = encodeURIComponent(unsplash);
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transformations}/${remote}`;
}
