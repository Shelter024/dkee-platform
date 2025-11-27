import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

// Client-side Pusher instance creator
export function getPusherClient() {
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '', {
    cluster: process.env.PUSHER_CLUSTER || 'eu',
  });
}

// Send real-time notification
export async function sendRealtimeNotification(
  userId: string,
  notification: {
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    link?: string;
  }
) {
  try {
    await pusherServer.trigger(`user-${userId}`, 'notification', notification);
    return true;
  } catch (error) {
    console.error('Pusher notification error:', error);
    return false;
  }
}

// Send real-time message
export async function sendRealtimeMessage(
  recipientId: string,
  message: {
    id: string;
    subject: string;
    content: string;
    senderId: string;
    senderName: string;
  }
) {
  try {
    await pusherServer.trigger(`user-${recipientId}`, 'new-message', message);
    return true;
  } catch (error) {
    console.error('Pusher message error:', error);
    return false;
  }
}

// Mark message as read (real-time)
export async function broadcastReadReceipt(messageId: string, userId: string) {
  try {
    await pusherServer.trigger(`message-${messageId}`, 'read-receipt', {
      messageId,
      userId,
      readAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Pusher read receipt error:', error);
    return false;
  }
}
