'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare, Send, User, Clock, CheckCheck, RefreshCw } from 'lucide-react';
import { ExportButtons } from '@/components/admin/ExportButtons';
import Pusher from 'pusher-js';

export default function AdminMessagesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ id: string; name: string; role: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [custRes, msgRes, meRes] = await Promise.all([
        fetch('/api/customers?limit=100'),
        fetch('/api/messages'),
        fetch('/api/users/me'),
      ]);
      const [custData, msgData, meData] = await Promise.all([
        custRes.json(),
        msgRes.json(),
        meRes.json(),
      ]);
      if (!custRes.ok) throw new Error(custData?.error || 'Failed to load customers');
      if (!msgRes.ok) throw new Error(msgData?.error || 'Failed to load messages');
      if (!meRes.ok) throw new Error(meData?.error || 'Failed to load user');
      setCustomers(custData.customers || []);
      setMessages(msgData.messages || []);
      setMe(meData.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!me?.id) return;
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY as string;
    const cluster = process.env.PUSHER_CLUSTER as string;
    if (!key) return;
    const pusher = new Pusher(key, { cluster: cluster || 'eu' });
    const channel = pusher.subscribe(`user-${me.id}`);
    const onNew = (payload: any) => {
      setMessages((prev) => [
        {
          id: payload.id,
          subject: payload.subject,
          content: payload.content,
          userId: payload.senderId,
          recipientId: me.id,
          createdAt: new Date().toISOString(),
          user: { id: payload.senderId, name: payload.senderName },
        },
        ...prev,
      ]);
    };
    channel.bind('new-message', onNew);
    return () => {
      channel.unbind('new-message', onNew);
      pusher.unsubscribe(`user-${me.id}`);
      pusher.disconnect();
    };
  }, [me?.id]);

  const markAsRead = async (messageIds: string[]) => {
    for (const id of messageIds) {
      try {
        await fetch(`/api/messages/${id}/read`, { method: 'PUT' });
      } catch (e) {}
    }
  };

  const selectThread = (threadId: string) => {
    const [otherId, subj] = threadId.split('|');
    const threadMessages = messages.filter((m) => {
      const oId = m.userId === me?.id ? m.recipientId : m.userId;
      return `${oId}|${m.subject || 'General'}` === threadId;
    });
    const unreadIds = threadMessages.filter(m => m.recipientId === me?.id && !m.readAt).map(m => m.id);
    if (unreadIds.length > 0) markAsRead(unreadIds);
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter((c:any)=> 
      c.user?.name?.toLowerCase().includes(q) || c.user?.email?.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const threads = useMemo(() => {
    const map = new Map<string, { id: string; subject: string; customerName: string; last: string; at: string; unread: number }>();
    for (const m of messages) {
      const otherId = m.userId === me?.id ? m.recipientId : m.userId;
      const subject = m.subject || 'General';
      const key = `${otherId}|${subject}`;
      const name = m.userId === me?.id ? (customers.find((c:any)=>c.user?.id===m.recipientId)?.user?.name || 'Customer') : (m.user?.name || 'Customer');
      if (!map.has(key)) {
        map.set(key, { id: key, subject, customerName: name, last: m.content?.slice(0,80) || '', at: m.createdAt, unread: 0 });
      } else {
        const ex = map.get(key)!;
        if (new Date(m.createdAt) > new Date(ex.at)) {
          ex.last = m.content?.slice(0,80) || '';
          ex.at = m.createdAt;
        }
      }
    }
    return Array.from(map.values()).sort((a,b)=> new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [messages, customers, me?.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !subject.trim() || !body.trim()) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: selectedCustomerId, subject, content: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send');
      setMessages((prev)=>[data.data, ...prev]);
      setBody('');
    } catch (e:any) {
      setError(e.message);
    }
  };

  const formatTime = (s: string) => new Date(s).toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-2xl shadow-xl p-8 border-t-4 border-indigo-500">
          <div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">Messages</h2>
            <p className="text-gray-600 text-lg">Send messages to customers and view replies</p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButtons type="messages" />
            <button onClick={load} className="inline-flex items-center px-4 py-3 text-sm rounded-xl border-2 border-indigo-200 hover:bg-indigo-50 font-medium">
              <RefreshCw className="w-4 h-4 mr-2"/> Refresh
            </button>
          </div>
        </div>

      {/* Compose */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardHeader>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Compose Message</h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={sendMessage} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <label className="block text-sm text-gray-700 mb-1">Recipient</label>
              <input
                type="text"
                placeholder="Search customers…"
                value={searchQuery}
                onChange={(e)=>setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 mb-2 border rounded-lg"
              />
              <select
                value={selectedCustomerId}
                onChange={(e)=>setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select customer…</option>
                {filteredCustomers.map((c:any)=> (
                  <option key={c.id} value={c.user?.id}>{c.user?.name} ({c.user?.email})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <Input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject" required />
            </div>
            <div className="md:col-span-4">
              <TextArea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="Type your message…" required />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit"><Send className="w-4 h-4 mr-2"/>Send</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Threads list */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Threads</h3>
        </CardHeader>
        <CardBody>
          {loading && <p className="text-gray-600">Loading…</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && threads.length === 0 && (
            <p className="text-gray-600">No messages yet.</p>
          )}
          <div className="divide-y">
            {threads.map((t)=> (
              <button
                key={t.id}
                onClick={() => selectThread(t.id)}
                className="w-full py-3 flex items-start justify-between hover:bg-gray-50 rounded transition-colors"
              >
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{t.subject}</div>
                  <div className="text-sm text-gray-600">{t.customerName}</div>
                  <div className="text-sm text-gray-600 mt-1">{t.last}</div>
                </div>
                <div className="text-right text-xs text-gray-500">{formatTime(t.at)}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
      </div>
    </div>
  );
}
