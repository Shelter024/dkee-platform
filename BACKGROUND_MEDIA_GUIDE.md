# Background Media Feature

## Overview
You can now add background images, videos, or slideshows to any blog post or page with color overlay and visual effects.

## Features
- **Image Backgrounds**: Single static image
- **Video Backgrounds**: Looping video (MP4)
- **Slideshows**: Multiple images with automatic transitions
- **Color Overlays**: Any hex color with adjustable opacity
- **Visual Effects**: Fade, Parallax, Fixed, Zoom

## Usage

### In Blog/Page Editor
1. Use the `BackgroundMediaConfig` component in your editor
2. Select media type (Image/Video/Slideshow)
3. Enter media URL(s)
4. Choose overlay color and opacity
5. Select visual effect

### Display Component
```tsx
import { BackgroundMedia, BackgroundMediaHero } from '@/components/ui/BackgroundMedia';

// Basic usage
<BackgroundMedia
  media={post.backgroundMedia}
  type={post.backgroundType}
  overlay={post.backgroundOverlay}
  opacity={post.backgroundOpacity}
  effect={post.backgroundEffect}
>
  {/* Your content here */}
</BackgroundMedia>

// Hero section
<BackgroundMediaHero
  media="/hero-video.mp4"
  type="video"
  overlay="#1e3a8a"
  opacity={0.6}
  effect="fade"
  title="Welcome to DK Executive Engineers"
  subtitle="Automotive and Property Management Solutions"
/>
```

## Database Schema
Added to BlogPost and Page models:
- `backgroundMedia`: URL or JSON array of URLs
- `backgroundType`: 'image' | 'video' | 'slideshow'
- `backgroundOverlay`: Hex color code
- `backgroundOpacity`: Float 0-1
- `backgroundEffect`: 'fade' | 'parallax' | 'fixed' | 'zoom'

## Effects Description
- **Fade**: Smooth opacity transition
- **Parallax**: Background scrolls slower than content (creates depth)
- **Fixed**: Background stays in place while content scrolls
- **Zoom**: Slow continuous zoom animation

## Examples

### Hero with Video Background
```tsx
<BackgroundMediaHero
  media="https://example.com/company-intro.mp4"
  type="video"
  overlay="#000000"
  opacity={0.4}
  effect="fade"
  title="Innovation in Motion"
  subtitle="Leading the way in automotive excellence"
/>
```

### Page with Image Slideshow
```tsx
<BackgroundMedia
  media='["https://example.com/img1.jpg", "https://example.com/img2.jpg"]'
  type="slideshow"
  overlay="#1e40af"
  opacity={0.5}
  effect="parallax"
  className="min-h-screen"
>
  <div className="container mx-auto py-20">
    <h1>Our Services</h1>
    {/* Content */}
  </div>
</BackgroundMedia>
```

### Blog Post Hero
```tsx
<BackgroundMedia
  media={post.backgroundMedia}
  type={post.backgroundType}
  overlay={post.backgroundOverlay}
  opacity={post.backgroundOpacity}
  effect={post.backgroundEffect}
  className="py-20"
>
  <article className="container mx-auto px-4">
    <h1 className="text-white text-5xl font-bold mb-4">{post.title}</h1>
    <p className="text-white/90">{post.excerpt}</p>
  </article>
</BackgroundMedia>
```

## Integration Steps

### 1. Update Blog/Page API Routes
Add background fields to create/update operations:
```typescript
const post = await prisma.blogPost.create({
  data: {
    // ... other fields
    backgroundMedia,
    backgroundType,
    backgroundOverlay,
    backgroundOpacity,
    backgroundEffect,
  },
});
```

### 2. Update Editor Components
Import and use BackgroundMediaConfig:
```tsx
import { BackgroundMediaConfig } from '@/components/admin/BackgroundMediaConfig';

// In your form
<BackgroundMediaConfig
  initialMedia={backgroundMedia}
  initialType={backgroundType}
  initialOverlay={backgroundOverlay}
  initialOpacity={backgroundOpacity}
  initialEffect={backgroundEffect}
  onChange={(config) => {
    setBackgroundMedia(config.backgroundMedia);
    setBackgroundType(config.backgroundType);
    setBackgroundOverlay(config.backgroundOverlay);
    setBackgroundOpacity(config.backgroundOpacity);
    setBackgroundEffect(config.backgroundEffect);
  }}
/>
```

### 3. Update Display Pages
Use BackgroundMedia component:
```tsx
import { BackgroundMedia } from '@/components/ui/BackgroundMedia';

// Wrap your content
<BackgroundMedia
  media={page.backgroundMedia}
  type={page.backgroundType}
  overlay={page.backgroundOverlay}
  opacity={page.backgroundOpacity}
  effect={page.backgroundEffect}
>
  <div className="prose max-w-none">
    {page.content}
  </div>
</BackgroundMedia>
```

## Performance Tips
- Use optimized/compressed images
- Keep videos under 10MB
- Limit slideshows to 5 images max
- Use webp format for images
- Consider lazy loading for below-fold content

## Browser Support
- All modern browsers support image/video backgrounds
- Parallax effect works best on desktop
- Videos auto-mute for autoplay compliance
- Slideshow transitions use CSS transitions (hardware accelerated)
