'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Send, MessageSquare, Clock, CheckCheck, User } from 'lucide-react';
import Pusher from 'pusher-js';

type Message = {
  id: string;
  subject: string;
  content: string;
  userId: string; // sender
  recipientId?: string | null;
  createdAt: string;
  readAt?: string | null;
  user?: { id: string; name: string };
};

export default function CustomerMessages() {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ userId: string; name: string } | null>(null);

  const threads = useMemo(() => {
    const map = new Map<string, { id: string; subject: string; lastMessage: string; lastMessageDate: string; unreadCount: number; recipientName: string }>();
    for (const m of messages) {
      const otherId = m.userId === me?.userId ? m.recipientId || 'staff' : m.userId;
      const key = `${otherId}|${m.subject || 'General'}`;
      const existing = map.get(key);
      const recipientName = m.userId === me?.userId ? 'Staff' : (m.user?.name || 'Staff');
      const isUnread = m.userId !== me?.userId && !m.readAt;
      
      if (!existing) {
        map.set(key, {
          id: key,
          subject: m.subject || 'General',
          lastMessage: m.content.slice(0, 80),
          lastMessageDate: m.createdAt,
          unreadCount: isUnread ? 1 : 0,
          recipientName,
        });
      } else {
        if (new Date(m.createdAt) > new Date(existing.lastMessageDate)) {
          existing.lastMessage = m.content.slice(0, 80);
          existing.lastMessageDate = m.createdAt;
        }
        if (isUnread) {
          existing.unreadCount++;
        }
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  }, [messages, me]);

  const currentThreadMessages = useMemo(() => {
    if (!selectedThread) return [] as Message[];
    const [otherId, subj] = selectedThread.split('|');
    return messages.filter((m) => {
      const oId = m.userId === me?.userId ? m.recipientId || 'staff' : m.userId;
      return `${oId}|${m.subject || 'General'}` === selectedThread;
    });
  }, [selectedThread, messages, me]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [msRes, meRes] = await Promise.all([
          fetch('/api/messages'),
          fetch('/api/customers/me'),
        ]);
        const msData = await msRes.json();
        const meData = await meRes.json();
        if (!msRes.ok) throw new Error(msData?.error || 'Failed to load messages');
        if (!meRes.ok) throw new Error(meData?.error || 'Failed to load profile');
        if (mounted) {
          setMessages(msData.messages || []);
          setMe({ userId: meData.customer?.user?.id, name: meData.customer?.user?.name });
        }
      } catch (e: any) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!me?.userId) return;
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY as string;
    const cluster = process.env.PUSHER_CLUSTER as string;
    if (!key) return;
    const pusher = new Pusher(key, { cluster: cluster || 'eu' });
    const channel = pusher.subscribe(`user-${me.userId}`);
    const onNew = (payload: any) => {
      setMessages((prev) => [
        {
          id: payload.id,
          subject: payload.subject,
          content: payload.content,
          userId: payload.senderId,
          recipientId: me.userId,
          createdAt: new Date().toISOString(),
          user: { id: payload.senderId, name: payload.senderName },
        },
        ...prev,
      ]);
    };
    channel.bind('new-message', onNew);
    return () => {
      channel.unbind('new-message', onNew);
      pusher.unsubscribe(`user-${me.userId}`);
      pusher.disconnect();
    };
  }, [me?.userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      const subject = threads.find((t) => t.id === selectedThread)?.subject || 'General';
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content: messageText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send');
      setMessages((prev) => [data.data, ...prev]);
      setMessageText('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    setSelectedThread(threadId);
    
    // Mark all unread messages in this thread as read
    const [otherId, subj] = threadId.split('|');
    const unreadInThread = messages.filter((m) => {
      const oId = m.userId === me?.userId ? m.recipientId || 'staff' : m.userId;
      return `${oId}|${m.subject || 'General'}` === threadId && !m.readAt && m.userId !== me?.userId;
    });
    
    // Mark as read in parallel
    await Promise.allSettled(
      unreadInThread.map((msg) =>
        fetch(`/api/messages/${msg.id}/read`, { method: 'PUT' })
      )
    );
    
    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        unreadInThread.some((u) => u.id === m.id)
          ? { ...m, readAt: new Date().toISOString() }
          : m
      )
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-xl p-8 border-t-4 border-pink-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent mb-2">
              Messages
            </h2>
            <p className="text-gray-600 text-lg">Communicate with our service team</p>
          </div>
          <Button
            onClick={() => setShowNewMessage(!showNewMessage)}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <MessageSquare className="w-6 h-6" />
            <span>New Message</span>
          </Button>
        </div>

        {/* New Message Form */}
        {showNewMessage && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-pink-50 to-rose-50">
            <CardHeader>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">New Message</h3>
            </CardHeader>
            <CardBody>
            <form className="space-y-4">
              <Input label="Subject" placeholder="Enter message subject..." required />
              <TextArea
                label="Message"
                placeholder="Type your message here..."
                rows={4}
                required
              />
              <div className="flex items-center space-x-3">
                <Button type="submit" className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewMessage(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threads List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="text-lg font-semibold">Conversations</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedThread === thread.id ? 'bg-brand-navy-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                      {thread.subject}
                    </h4>
                    {thread.unreadCount > 0 && (
                      <Badge variant="danger" className="ml-2">
                        {thread.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                    {thread.lastMessage}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{thread.recipientName}</span>
                    <span className="text-xs text-gray-500">
                      {formatTime(thread.lastMessageDate)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          {selectedThread ? (
            <>
              <CardHeader className="border-b">
                <div>
                  <h3 className="text-lg font-semibold">
                    {threads.find((t) => t.id === selectedThread)?.subject}
                  </h3>
                  <p className="text-sm text-gray-600">
                    with {threads.find((t) => t.id === selectedThread)?.recipientName}
                  </p>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {/* Messages */}
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {currentThreadMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.userId === me?.userId ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-md ${
                          message.userId === me?.userId
                            ? 'bg-brand-navy-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        } rounded-lg p-3`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="w-3 h-3" />
                          <span className="text-xs font-medium">{message.userId === me?.userId ? 'You' : (message.user?.name || 'Staff')}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-end space-x-1 mt-2">
                          <span
                            className={`text-xs ${
                              message.userId === me?.userId
                                ? 'text-brand-navy-200'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </span>
                          {message.userId === me?.userId && (
                            <>
                              {message.readAt ? (
                                <CheckCheck className="w-3 h-3 text-brand-navy-200" />
                              ) : (
                                <Clock className="w-3 h-3 text-brand-navy-200" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                    <div className="flex-1">
                      <TextArea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <Button type="submit" className="flex-shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </CardBody>
            </>
          ) : (
            <CardBody className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose a conversation from the list to view messages
              </p>
            </CardBody>
          )}
        </Card>
      </div>

      {/* Empty State */}
      {threads.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
            <p className="text-gray-600 mb-4">
              You don't have any messages yet. Start a conversation with our team.
            </p>
            <Button onClick={() => setShowNewMessage(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Your First Message
            </Button>
          </CardBody>
        </Card>
      )}
      </div>
    </div>
  );
}
