'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Facebook,
  Instagram,
  Twitter,
  Music,
  Linkedin,
  Calendar,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  BarChart,
} from 'lucide-react';

type Platform = 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'TIKTOK' | 'LINKEDIN';
type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

interface Post {
  id: string;
  platform: Platform;
  content: string;
  mediaUrl?: string;
  status: PostStatus;
  scheduledFor?: string;
  publishedAt?: string;
  engagement?: any;
  createdAt: string;
}

export default function SocialMediaPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | 'ALL'>('ALL');
  const [showComposer, setShowComposer] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Composer state
  const [composerData, setComposerData] = useState({
    platform: 'FACEBOOK' as Platform,
    content: '',
    mediaUrl: '',
    status: 'DRAFT' as PostStatus,
    scheduledFor: '',
  });

  useEffect(() => {
    fetchPosts();
  }, [selectedPlatform, selectedStatus]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPlatform !== 'ALL') params.append('platform', selectedPlatform);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);

      const response = await fetch(`/api/social-media/posts?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setPosts(data.posts || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    try {
      if (!composerData.content.trim()) {
        setMessage({ type: 'error', text: 'Content is required' });
        return;
      }

      const payload = {
        ...composerData,
        scheduledFor: composerData.scheduledFor || undefined,
      };

      const response = await fetch('/api/social-media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'Post created successfully' });
      setShowComposer(false);
      resetComposer();
      fetchPosts();
    } catch (error: any) {
      console.error('Error creating post:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleUpdatePost = async (postId: string, updates: Partial<Post>) => {
    try {
      const response = await fetch('/api/social-media/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, ...updates }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'Post updated successfully' });
      fetchPosts();
    } catch (error: any) {
      console.error('Error updating post:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/social-media/posts?postId=${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'Post deleted successfully' });
      fetchPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const resetComposer = () => {
    setComposerData({
      platform: 'FACEBOOK',
      content: '',
      mediaUrl: '',
      status: 'DRAFT',
      scheduledFor: '',
    });
    setEditingPost(null);
  };

  const getPlatformIcon = (platform: Platform) => {
    const icons = {
      FACEBOOK: <Facebook className="w-5 h-5" />,
      INSTAGRAM: <Instagram className="w-5 h-5" />,
      TWITTER: <Twitter className="w-5 h-5" />,
      TIKTOK: <Music className="w-5 h-5" />,
      LINKEDIN: <Linkedin className="w-5 h-5" />,
    };
    return icons[platform];
  };

  const getPlatformColor = (platform: Platform) => {
    const colors = {
      FACEBOOK: 'bg-blue-500',
      INSTAGRAM: 'bg-pink-500',
      TWITTER: 'bg-sky-400',
      TIKTOK: 'bg-black',
      LINKEDIN: 'bg-blue-700',
    };
    return colors[platform];
  };

  const getStatusBadge = (status: PostStatus) => {
    const variants: any = {
      DRAFT: 'default',
      SCHEDULED: 'warning',
      PUBLISHED: 'success',
      FAILED: 'danger',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getStatusIcon = (status: PostStatus) => {
    const icons = {
      DRAFT: <Edit className="w-4 h-4" />,
      SCHEDULED: <Clock className="w-4 h-4" />,
      PUBLISHED: <CheckCircle className="w-4 h-4" />,
      FAILED: <XCircle className="w-4 h-4" />,
    };
    return icons[status];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Manager</h2>
          <p className="text-gray-600 mt-1">Create and schedule posts across all platforms</p>
        </div>
        <Button
          onClick={() => {
            resetComposer();
            setShowComposer(true);
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          New Post
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Composer Modal */}
      {showComposer && (
        <Card className="border-2 border-brand-red-500">
          <CardHeader>
            <h3 className="text-lg font-bold">Create New Post</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <div className="flex space-x-2">
                {(['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN'] as Platform[]).map(
                  (platform) => (
                    <button
                      key={platform}
                      onClick={() => setComposerData({ ...composerData, platform })}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        composerData.platform === platform
                          ? `${getPlatformColor(platform)} text-white`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getPlatformIcon(platform)}
                      <span className="text-sm">{platform}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={composerData.content}
                onChange={(e) => setComposerData({ ...composerData, content: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red-500"
                placeholder="Write your post content..."
              />
            </div>

            {/* Media URL */}
            <div>
              <label className="block text-sm font-medium mb-2">Media URL (Optional)</label>
              <Input
                value={composerData.mediaUrl}
                onChange={(e) => setComposerData({ ...composerData, mediaUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={composerData.status}
                onChange={(e) =>
                  setComposerData({ ...composerData, status: e.target.value as PostStatus })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PUBLISHED">Publish Now</option>
              </select>
            </div>

            {/* Scheduled Time */}
            {composerData.status === 'SCHEDULED' && (
              <div>
                <label className="block text-sm font-medium mb-2">Schedule For</label>
                <Input
                  type="datetime-local"
                  value={composerData.scheduledFor}
                  onChange={(e) =>
                    setComposerData({ ...composerData, scheduledFor: e.target.value })
                  }
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Button onClick={handleCreatePost}>
                <Send className="w-5 h-5 mr-2" />
                Create Post
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowComposer(false);
                  resetComposer();
                }}
              >
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value as Platform | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="ALL">All Platforms</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="TWITTER">Twitter</option>
          <option value="TIKTOK">TikTok</option>
          <option value="LINKEDIN">LinkedIn</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as PostStatus | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <Card>
          <CardBody>
            <p className="text-gray-600">Loading posts...</p>
          </CardBody>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts</h3>
            <p className="text-gray-600 mb-4">Create your first social media post.</p>
            <Button
              onClick={() => {
                resetComposer();
                setShowComposer(true);
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Post
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${getPlatformColor(post.platform)}`}>
                      <div className="text-white">{getPlatformIcon(post.platform)}</div>
                    </div>
                    <span className="font-semibold">{post.platform}</span>
                  </div>
                  {getStatusBadge(post.status)}
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Content */}
                <p className="text-gray-700 line-clamp-3">{post.content}</p>

                {/* Media Preview */}
                {post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}

                {/* Metadata */}
                <div className="text-sm text-gray-500 space-y-1">
                  {post.scheduledFor && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Scheduled: {new Date(post.scheduledFor).toLocaleString()}</span>
                    </div>
                  )}
                  {post.publishedAt && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Published: {new Date(post.publishedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Engagement */}
                {post.engagement && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <BarChart className="w-4 h-4" />
                      <span>{post.engagement.views || 0} views</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {post.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePost(post.id, { status: 'PUBLISHED' })}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
