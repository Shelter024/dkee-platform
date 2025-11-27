'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import dynamic from 'next/dynamic';
import Skeleton from '@/components/ui/Skeleton';
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false, loading: () => <Skeleton lines={10} /> });
import ImageField from '@/components/media/ImageField';
import MetaFields from '@/components/cms/MetaFields';
import { toast } from 'react-hot-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  featuredImage?: string;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [cloudinaryConfig, setCloudinaryConfig] = useState<{ cloudName: string; uploadPreset: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: '',
    featuredImage: '',
    published: false,
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      canonicalUrl: '',
      noIndex: false,
      scheduledPublishAt: '',
      scheduledUnpublishAt: '',
  });

  useEffect(() => {
    fetchPosts();
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

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      if (data.ok) {
        setPosts(data.posts);
      }
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingPost ? `/api/blog/${editingPost.id}` : '/api/blog';
      const method = editingPost ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (data.ok) {
        toast.success(editingPost ? 'Post updated!' : 'Post created!');
        setShowEditor(false);
        setEditingPost(null);
        resetForm();
        fetchPosts();
      } else {
        toast.error(data.error || 'Failed to save post');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      tags: post.tags.join(', '),
      featuredImage: post.featuredImage || '',
      published: post.published,
        metaTitle: (post as any).metaTitle || '',
        metaDescription: (post as any).metaDescription || '',
        ogImage: (post as any).ogImage || '',
        canonicalUrl: (post as any).canonicalUrl || '',
        noIndex: (post as any).noIndex || false,
        scheduledPublishAt: (post as any).scheduledPublishAt 
          ? new Date((post as any).scheduledPublishAt).toISOString().slice(0, 16) 
          : '',
        scheduledUnpublishAt: (post as any).scheduledUnpublishAt 
          ? new Date((post as any).scheduledUnpublishAt).toISOString().slice(0, 16) 
          : '',
    });
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.ok) {
        toast.success('Post deleted');
        fetchPosts();
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      });

      const data = await res.json();

      if (data.ok) {
        toast.success(post.published ? 'Post unpublished' : 'Post published!');
        fetchPosts();
      } else {
        toast.error('Failed to update post');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      tags: '',
      featuredImage: '',
      published: false,
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
        canonicalUrl: '',
        noIndex: false,
        scheduledPublishAt: '',
        scheduledUnpublishAt: '',
    });
  };

  const handleNewPost = () => {
    setEditingPost(null);
    resetForm();
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h1>
          <Button
            variant="ghost"
            onClick={() => {
              setShowEditor(false);
              setEditingPost(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    // Auto-generate slug
                    if (!editingPost) {
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                      setFormData(prev => ({ ...prev, slug }));
                    }
                  }}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-2"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  URL: /blog/{formData.slug || 'your-post-slug'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content *</label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-2 h-24"
                  placeholder="Brief description (optional, auto-generated if empty)"
                />
              </div>

              {cloudinaryConfig && (
                <ImageField
                  label="Featured Image"
                  value={formData.featuredImage}
                  onChange={(url) => setFormData({ ...formData, featuredImage: url })}
                  cloudName={cloudinaryConfig.cloudName}
                  uploadPreset={cloudinaryConfig.uploadPreset}
                  folder="blog-featured"
                  cropping={true}
                  aspectRatio={16 / 9}
                  description="Recommended: 1200x675px (16:9 ratio)"
                />
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-2"
                  placeholder="automotive, ghana, engineering (comma-separated)"
                />
              </div>

                <MetaFields
                  metaTitle={formData.metaTitle}
                  metaDescription={formData.metaDescription}
                  ogImage={formData.ogImage}
                  canonicalUrl={formData.canonicalUrl}
                  noIndex={formData.noIndex}
                  scheduledPublishAt={formData.scheduledPublishAt}
                  scheduledUnpublishAt={formData.scheduledUnpublishAt}
                  onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                  cloudinaryConfig={cloudinaryConfig || undefined}
                  defaultTitle={formData.title}
                  defaultDescription={formData.excerpt}
                />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Publish immediately
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingPost(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Button variant="primary" onClick={handleNewPost}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : posts.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-center text-neutral-600 py-8">
              No blog posts yet. Create your first post!
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      {post.published ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Published
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>By {post.author.name}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      {post.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{post.tags.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublish(post)}
                      title={post.published ? 'Unpublish' : 'Publish'}
                    >
                      {post.published ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(post)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(post.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}