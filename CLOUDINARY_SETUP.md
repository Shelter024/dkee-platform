# Cloudinary Upload Widget Setup

## Overview
The CMS now includes a powerful Cloudinary upload widget that allows you to upload images directly from the admin panel with features like cropping, drag-and-drop, and URL imports.

## Setup Steps

### 1. Configure Cloudinary Upload Preset

An **upload preset** is required for the upload widget to work. This is a Cloudinary configuration that defines how uploads are handled.

#### Create Unsigned Upload Preset:

1. **Go to Cloudinary Dashboard**
   - Log in at https://cloudinary.com/console

2. **Navigate to Settings → Upload**
   - Click on your account name (top right) → Settings
   - Click "Upload" tab in the left sidebar

3. **Add Upload Preset**
   - Scroll to "Upload presets" section
   - Click "Add upload preset" button

4. **Configure the Preset**
   ```
   Preset name: dkee_unsigned_uploads
   Signing mode: Unsigned
   Folder: dkee-cms
   ```

5. **Set Upload Constraints (Optional but Recommended)**
   ```
   Allowed formats: jpg, png, gif, svg, webp, avif
   Max file size: 10 MB
   Max image width: 4000 px
   Max image height: 4000 px
   ```

6. **Enable Transformations (Optional)**
   - Auto-tagging: Enabled
   - Auto-quality: Enabled
   - Auto-format: Enabled

7. **Save the Preset**

### 2. Update Environment Variables

The upload preset name is already in your `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=dkee_unsigned_uploads
```

### 3. Add to Database Settings

Run this command to save the upload preset to your database:

```powershell
npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/setup-cloudinary-preset.ts
```

Or manually add it via the Settings page in your admin dashboard.

## Features

### In Blog Editor:
- **Featured Image Upload**: Drag-and-drop or click to upload
- **Automatic Cropping**: Images are cropped to 16:9 ratio (1200x675px recommended)
- **Alt Text**: Automatically generated from filename, editable
- **Preview**: See uploaded image before publishing

### In Page Editor:
- **Hero Background Images**: 21:9 ratio (2100x900px recommended)
- **Content Images**: Flexible sizing with alt text and captions
- **Multiple Sources**: Upload from computer, camera, or URL

### Upload Widget Features:
- Drag and drop files
- Multiple file selection
- Image cropping tool
- URL import
- Webcam capture
- File format validation
- Size limits
- Real-time preview
- Progress indicators

## Usage

### Blog Featured Image:
1. Go to **Admin → Blog**
2. Click "New Post" or edit existing post
3. Scroll to "Featured Image" section
4. Click "Upload Media" button
5. Drag file or click to browse
6. Crop if needed (16:9 ratio enforced)
7. Optionally edit alt text
8. Save post

### Page Hero/Images:
1. Go to **Admin → Pages**
2. Create or edit a page
3. Add Hero or Image block
4. Click "Upload Media" in the image field
5. Upload and crop as needed
6. Add caption or alt text
7. Save page

## Troubleshooting

### "Upload failed" Error
- Check that `CLOUDINARY_CLOUD_NAME` is correct in `.env`
- Verify upload preset exists and is set to "Unsigned"
- Check Cloudinary dashboard for error logs

### Widget Doesn't Open
- Ensure Cloudinary script is loaded (check browser console)
- Verify network connectivity
- Clear browser cache

### Images Not Uploading
- Check file format is allowed (jpg, png, gif, svg, webp)
- Ensure file size is under 10MB
- Verify folder permissions in Cloudinary

### Wrong Aspect Ratio
- Use the cropping tool before finalizing upload
- For blog: 16:9 (landscape)
- For hero: 21:9 (ultra-wide)
- For content images: Any ratio accepted

## Best Practices

1. **Image Optimization**
   - Use web-optimized formats (WebP preferred)
   - Keep file sizes reasonable (<2MB for blog, <3MB for hero)
   - Use descriptive filenames for better SEO

2. **Alt Text**
   - Always provide meaningful alt text
   - Describe the image content, not "image of"
   - Keep it concise (under 125 characters)

3. **Folder Organization**
   - Blog images: `blog-featured/`
   - Page heroes: `page-heroes/`
   - Content images: `page-images/`
   - Auto-organized by the system

4. **Performance**
   - Cloudinary auto-optimizes images
   - Lazy loading enabled by default
   - Responsive images served automatically

## Security

- Upload preset is **unsigned** (no API secret exposed to browser)
- Folder restrictions prevent unauthorized access
- File type validation prevents malicious uploads
- Size limits prevent abuse
- All uploads tagged with `cms` and `user-upload`

## API Endpoint

The CMS config endpoint provides widget settings:

```
GET /api/cms/config
Response: {
  "cloudName": "your-cloud-name",
  "uploadPreset": "dkee_unsigned_uploads"
}
```

## Components

- **CloudinaryUploader**: Base upload widget component
- **ImageField**: Form field wrapper with uploader + alt text
- Used in: Blog admin, Pages admin

## Next Steps

After setup:
1. Test upload in Blog editor
2. Try cropping feature
3. Verify images appear in Cloudinary dashboard
4. Check public pages render images correctly
5. Optimize upload preset settings based on usage

## Support

For Cloudinary-specific issues:
- Documentation: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com

For CMS integration issues:
- Check browser console for errors
- Review API logs in terminal
- Verify environment variables
