'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false, loading: () => <Skeleton lines={8} /> });
import ImageField from '@/components/media/ImageField';
import MetaFields from '@/components/cms/MetaFields';
import { useToast } from '@/components/providers/ToastProvider';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Type,
  Image as ImageIcon,
  Video,
  Layout,
  Search,
  Filter,
} from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: string | null;
  template?: string;
}

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'hero';
  content: any;
}

export default function PagesManagement() {
  const { success, error } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [cloudinaryConfig, setCloudinaryConfig] = useState<{ cloudName: string; uploadPreset: string } | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [published, setPublished] = useState(false);
  const [category, setCategory] = useState<string>('General');
  const [template, setTemplate] = useState<string>('default');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [ogImage, setOgImage] = useState('');
    const [canonicalUrl, setCanonicalUrl] = useState('');
    const [noIndex, setNoIndex] = useState(false);
    const [scheduledPublishAt, setScheduledPublishAt] = useState('');
    const [scheduledUnpublishAt, setScheduledUnpublishAt] = useState('');

  useEffect(() => {
    fetchPages();
    fetchCloudinaryConfig();
  }, []);

  const fetchCloudinaryConfig = async () => {
    try {
      const res = await fetch('/api/cms/config');
      if (res.ok) {
        const data = await res.json();
        setCloudinaryConfig(data);
      }
    } catch (error) {
      console.error('Failed to load Cloudinary config:', error);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/cms/pages');
      if (!response.ok) throw new Error('Failed to fetch pages');
      const data = await response.json();
      setPages(data);
    } catch (err) {
      console.error('Error fetching pages:', err);
      error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!editingPage) {
      setSlug(generateSlug(value));
    }
  };

  const addContentBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? '' : type === 'image' ? { url: '', alt: '', caption: '' } : type === 'video' ? { url: '', caption: '' } : { title: '', subtitle: '', backgroundImage: '', ctaText: '', ctaLink: '' },
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateContentBlock = (id: string, content: any) => {
    setContentBlocks(
      contentBlocks.map((block) =>
        block.id === id ? { ...block, content } : block
      )
    );
  };

  const deleteContentBlock = (id: string) => {
    setContentBlocks(contentBlocks.filter((block) => block.id !== id));
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setContentBlocks(newBlocks);
  };

  const moveBlockDown = (index: number) => {
    if (index === contentBlocks.length - 1) return;
    const newBlocks = [...contentBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  const handleSubmit = async () => {
    if (!title || !slug) {
      error('Title and slug are required');
      return;
    }

    try {
      const contentString = JSON.stringify(contentBlocks);

      const response = await fetch(
        editingPage ? `/api/cms/pages/${editingPage.id}` : '/api/cms/pages',
        {
          method: editingPage ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            slug,
            content: contentString,
            published,
            category: category || 'General',
            template: template || 'default',
              metaTitle,
              metaDescription,
              ogImage,
              canonicalUrl,
              noIndex,
              scheduledPublishAt: scheduledPublishAt || null,
              scheduledUnpublishAt: scheduledUnpublishAt || null,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save page');
      }

      success(editingPage ? 'Page updated!' : 'Page created!');
      resetForm();
      setShowEditor(false);
      fetchPages();
    } catch (err: any) {
      console.error('Error saving page:', err);
      error(err.message || 'Failed to save page');
    }
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setPublished(page.published);
    setCategory(page.category || 'General');
    setTemplate(page.template || 'default');
      setMetaTitle((page as any).metaTitle || '');
      setMetaDescription((page as any).metaDescription || '');
      setOgImage((page as any).ogImage || '');
      setCanonicalUrl((page as any).canonicalUrl || '');
      setNoIndex((page as any).noIndex || false);
      setScheduledPublishAt(
        (page as any).scheduledPublishAt 
          ? new Date((page as any).scheduledPublishAt).toISOString().slice(0, 16) 
          : ''
      );
      setScheduledUnpublishAt(
        (page as any).scheduledUnpublishAt 
          ? new Date((page as any).scheduledUnpublishAt).toISOString().slice(0, 16) 
          : ''
      );

    try {
      const blocks = JSON.parse(page.content || '[]');
      setContentBlocks(blocks);
    } catch {
      setContentBlocks([]);
    }

    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const response = await fetch(`/api/cms/pages/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete page');

      success('Page deleted');
      fetchPages();
    } catch (err) {
      console.error('Error deleting page:', err);
      error('Failed to delete page');
    }
  };

  const togglePublish = async (page: Page) => {
    try {
      const response = await fetch(`/api/cms/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !page.published }),
      });

      if (!response.ok) throw new Error('Failed to update page');

      success(page.published ? 'Page unpublished' : 'Page published');
      fetchPages();
    } catch (err) {
      console.error('Error updating page:', err);
      error('Failed to update page');
    }
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setPublished(false);
    setCategory('General');
    setTemplate('default');
    setContentBlocks([]);
    setEditingPage(null);
      setMetaTitle('');
      setMetaDescription('');
      setOgImage('');
      setCanonicalUrl('');
      setNoIndex(false);
      setScheduledPublishAt('');
      setScheduledUnpublishAt('');
  };

  const handleCancel = () => {
    resetForm();
    setShowEditor(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading pages...</div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingPage ? 'Edit Page' : 'Create New Page'}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" />
              Save Page
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter page title"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-2">Slug (URL)</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="page-url-slug"
              />
            </div>

            {/* Published Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="published" className="text-sm font-medium">
                Publish this page
              </label>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="General">General</option>
                <option value="News">News</option>
                <option value="Legal">Legal</option>
                <option value="Help">Help</option>
              </select>
            </div>

            {/* Template Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="default">Default</option>
                <option value="full-width">Full Width</option>
                <option value="centered">Centered</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>

              <MetaFields
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                ogImage={ogImage}
                canonicalUrl={canonicalUrl}
                noIndex={noIndex}
                scheduledPublishAt={scheduledPublishAt}
                scheduledUnpublishAt={scheduledUnpublishAt}
                onChange={(field, value) => {
                  switch (field) {
                    case 'metaTitle': setMetaTitle(value as string); break;
                    case 'metaDescription': setMetaDescription(value as string); break;
                    case 'ogImage': setOgImage(value as string); break;
                    case 'canonicalUrl': setCanonicalUrl(value as string); break;
                    case 'noIndex': setNoIndex(value as boolean); break;
                    case 'scheduledPublishAt': setScheduledPublishAt(value as string); break;
                    case 'scheduledUnpublishAt': setScheduledUnpublishAt(value as string); break;
                  }
                }}
                cloudinaryConfig={cloudinaryConfig || undefined}
                defaultTitle={title}
              />
          </div>
        </Card>

        {/* Content Blocks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Content Blocks</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addContentBlock('hero')}
              >
                <Layout className="w-4 h-4 mr-2" />
                Hero
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addContentBlock('text')}
              >
                <Type className="w-4 h-4 mr-2" />
                Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addContentBlock('image')}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addContentBlock('video')}
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
          </div>

          {contentBlocks.length === 0 && (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <p className="mb-4">No content blocks yet</p>
                <p className="text-sm">
                  Click the buttons above to add Hero, Text, Image, or Video blocks
                </p>
              </div>
            </Card>
          )}

          {contentBlocks.map((block, index) => (
            <Card key={block.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold capitalize">{block.type} Block</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveBlockUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveBlockDown(index)}
                    disabled={index === contentBlocks.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteContentBlock(block.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Hero Block */}
              {block.type === 'hero' && (
                <div className="space-y-4">
                  <Input
                    placeholder="Hero Title"
                    value={block.content.title || ''}
                    onChange={(e) =>
                      updateContentBlock(block.id, {
                        ...block.content,
                        title: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Subtitle"
                    value={block.content.subtitle || ''}
                    onChange={(e) =>
                      updateContentBlock(block.id, {
                        ...block.content,
                        subtitle: e.target.value,
                      })
                    }
                  />
                  {cloudinaryConfig && (
                    <ImageField
                      label="Background Image"
                      value={block.content.backgroundImage || ''}
                      onChange={(url) =>
                        updateContentBlock(block.id, {
                          ...block.content,
                          backgroundImage: url,
                        })
                      }
                      cloudName={cloudinaryConfig.cloudName}
                      uploadPreset={cloudinaryConfig.uploadPreset}
                      folder="page-heroes"
                      cropping={true}
                      aspectRatio={21 / 9}
                      description="Recommended: 2100x900px (21:9 ratio)"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="CTA Button Text"
                      value={block.content.ctaText || ''}
                      onChange={(e) =>
                        updateContentBlock(block.id, {
                          ...block.content,
                          ctaText: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="CTA Link"
                      value={block.content.ctaLink || ''}
                      onChange={(e) =>
                        updateContentBlock(block.id, {
                          ...block.content,
                          ctaLink: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Text Block */}
              {block.type === 'text' && (
                <RichTextEditor
                  content={block.content}
                  onChange={(html) => updateContentBlock(block.id, html)}
                />
              )}

              {/* Image Block */}
              {block.type === 'image' && cloudinaryConfig && (
                <div className="space-y-4">
                  <ImageField
                    label="Image"
                    value={block.content.url || ''}
                    onChange={(url, alt) =>
                      updateContentBlock(block.id, {
                        ...block.content,
                        url,
                        alt: alt || block.content.alt,
                      })
                    }
                    cloudName={cloudinaryConfig.cloudName}
                    uploadPreset={cloudinaryConfig.uploadPreset}
                    folder="page-images"
                    description="Image for your page content"
                  />
                  <Input
                    placeholder="Caption (optional)"
                    value={block.content.caption || ''}
                    onChange={(e) =>
                      updateContentBlock(block.id, {
                        ...block.content,
                        caption: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {/* Video Block */}
              {block.type === 'video' && (
                <div className="space-y-4">
                  <Input
                    placeholder="YouTube Video URL"
                    value={block.content.url || ''}
                    onChange={(e) =>
                      updateContentBlock(block.id, {
                        ...block.content,
                        url: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="Caption (optional)"
                    value={block.content.caption || ''}
                    onChange={(e) =>
                      updateContentBlock(block.id, {
                        ...block.content,
                        caption: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Static Pages</h2>
        <Button onClick={() => setShowEditor(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Categories</option>
                <option value="General">General</option>
                <option value="News">News</option>
                <option value="Legal">Legal</option>
                <option value="Help">Help</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {pages.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-gray-500">
            <p className="mb-4">No pages created yet</p>
            <Button onClick={() => setShowEditor(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Page
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pages
            .filter((page) => {
              const matchesSearch = page.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
              const matchesCategory =
                categoryFilter === 'all' || page.category === categoryFilter;
              return matchesSearch && matchesCategory;
            })
            .map((page) => (
            <Card key={page.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{page.title}</h3>
                    {page.published ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        Draft
                      </span>
                    )}
                    {page.category && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs rounded">
                        {page.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">/{page.slug}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                    {page.template && page.template !== 'default' && (
                      <span className="text-xs">• {page.template}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublish(page)}
                  >
                    {page.published ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}