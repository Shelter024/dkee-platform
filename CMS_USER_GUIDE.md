# CMS User Guide

## Overview
Your custom Content Management System is now fully operational! You can manage all website content through the admin dashboard without any coding.

## Features

### 1. Blog Management
**Location**: `/dashboard/admin/blog`

**Capabilities**:
- Create blog posts with rich text editor
- Add formatting (Bold, Italic, Headings, Lists, Quotes)
- Insert images, links, and YouTube videos
- Add tags for categorization
- Set featured cover images
- Publish/unpublish posts
- Auto-generate SEO-friendly slugs

**Public View**: `/blog` (listing) and `/blog/[slug]` (individual posts)

### 2. Pages Management
**Location**: `/dashboard/admin/pages`

**Capabilities**:
- Create custom pages (About, Services, Policies, etc.)
- Build pages with flexible content blocks
- Auto-generate SEO-friendly slugs from titles
- Publish/unpublish pages

**Content Blocks**:
1. **Hero Block** - Full-width hero section with:
   - Title and subtitle
   - Background image
   - Call-to-action button with custom link
   
2. **Text Block** - Rich text content with:
   - Full WYSIWYG editor
   - Formatting options (Bold, Italic, H1-H3, Lists, Quotes)
   - Images, links, YouTube videos

3. **Image Block**:
   - Image URL
   - Alt text (for SEO and accessibility)
   - Optional caption

4. **Video Block**:
   - YouTube video URL (auto-converts to embed)
   - Optional caption

**Block Management**:
- Reorder blocks with up/down arrows
- Delete individual blocks
- Each block type has its own custom interface

**Public View**: `/{slug}` (e.g., `/about`, `/services`)

## Workflow Examples

### Creating a Blog Post
1. Go to `/dashboard/admin/blog`
2. Click "New Post"
3. Enter title (slug auto-generates)
4. Add tags (comma-separated)
5. Optional: Add cover image URL
6. Write content with rich text editor
7. Check "Publish this post" when ready
8. Click "Save Post"

### Creating an About Page
1. Go to `/dashboard/admin/pages`
2. Click "New Page"
3. Enter title "About Us" (slug becomes `about-us`)
4. Add Hero block:
   - Title: "About DK Executive Engineers"
   - Subtitle: "Engineering Excellence Since 2010"
   - Background image: Your hero image URL
   - CTA: "Contact Us" → `/contact`
5. Add Text block with company description
6. Add Image block with team photo
7. Add another Text block with mission statement
8. Check "Publish this page"
9. Click "Save Page"

### Creating a Services Page
1. Create new page with title "Our Services"
2. Add Hero block with services overview
3. Add multiple Text blocks for each service:
   - Civil Engineering
   - Automotive Services
   - Property Management
4. Add Image blocks between text sections
5. Add Video block with promotional video
6. Publish when ready

## Content Block Tips

### Hero Block Best Practices
- Use high-resolution background images (1920x1080 or larger)
- Keep titles concise (5-8 words)
- Make CTA buttons action-oriented ("Get Started", "Learn More")

### Text Block Best Practices
- Use headings (H1, H2, H3) for structure
- Break up long paragraphs
- Use lists for better readability
- Add links to relevant pages

### Image Block Best Practices
- Always include alt text for SEO and accessibility
- Use Cloudinary for image hosting and optimization
- Add captions to provide context

### Video Block Best Practices
- Use YouTube URLs (https://youtube.com/watch?v=...)
- The system automatically converts to embeds
- Add descriptive captions

## Managing Content

### Editing Content
- Click the edit icon (pencil) on any post/page
- All your previous content and blocks will load
- Make changes and save

### Publishing/Unpublishing
- Use the eye icon to toggle visibility
- Published content appears on public site
- Draft content only visible to admins

### Deleting Content
- Click the trash icon
- Confirm deletion (permanent action)

## Integration with Services

Your CMS integrates with all configured services:

### Cloudinary (Images)
- Upload images to Cloudinary dashboard
- Copy image URLs
- Paste into Image blocks or rich text editor
- Automatic optimization and CDN delivery

### SEO Benefits
- Auto-generated slugs from titles
- Clean URLs (e.g., `/about-us` not `/page?id=123`)
- Meta descriptions from excerpts
- Proper HTML structure with headings

## Public Routes

### Blog Routes
- `/blog` - List all published blog posts
- `/blog/[slug]` - Individual blog post (e.g., `/blog/our-latest-project`)

### Custom Page Routes
- `/{slug}` - Any custom page (e.g., `/about`, `/services`, `/privacy-policy`)

### Homepage (Root `/`)
- The root path `/` now checks for a published CMS page with slug `home`.
- If found and it has content blocks, those blocks will render as the homepage.
- If not found (or empty), the original static homepage design is shown as fallback.

To edit the homepage:
1. Go to `/dashboard/admin/pages`.
2. Click "New Page".
3. Set Title (e.g., "Home") and manually set Slug to `home` (important).
4. Add desired blocks (Hero first for top banner recommended).
5. Publish and save.
6. Visit `/` to see the updated homepage.

You can later edit the page with slug `home` to update live homepage content.

## Tips for Success

1. **Start with drafts**: Create content as drafts, preview, then publish
2. **Consistent slugs**: Use lowercase, hyphens, no special characters
3. **Mobile-friendly**: All content is responsive by default
4. **Image optimization**: Use Cloudinary to optimize images before adding
5. **Regular updates**: Keep blog active with regular posts
6. **Internal linking**: Link between pages using Text blocks
7. **SEO tags**: Use relevant tags on blog posts for better organization

## Common Use Cases

### Company Pages
- About Us
- Our Services
- Our Team
- Contact Information
- Privacy Policy
- Terms & Conditions

### Marketing Pages
- Landing pages for campaigns
- Service-specific pages
- Case studies
- Client testimonials

### Blog Content
- Project updates
- Industry insights
- Company news
- How-to guides
- Technical tutorials

## Next Steps

1. **Create essential pages**:
   - About Us
   - Services
   - Privacy Policy
   - Terms of Service

2. **Start blogging**:
   - Company announcements
   - Project showcases
   - Industry insights

3. **Optimize for SEO**:
   - Use descriptive titles
   - Add relevant tags
   - Include alt text on images
   - Write engaging excerpts

4. **Test on mobile**:
   - All content is responsive
   - Preview on different devices

## Support

For technical issues or questions:
- Check error messages in browser console
- Verify image URLs are accessible
- Ensure YouTube URLs are public
- Test content in draft mode before publishing

Your CMS is production-ready and integrated with all services (Cloudinary, Resend, Twilio, Pusher, Paystack, Sentry)!
