
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  listing_id: string | null;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  read: boolean;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  recipient_id: string;
  recipient_name?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    fetchConversations();
    setupRealtimeSubscription();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // For now, let's get conversations by querying messages directly
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name),
          recipient:profiles!messages_recipient_id_fkey(full_name)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data to create conversations
      const conversationMap = new Map<string, Conversation>();
      
      data?.forEach((message) => {
        const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        const otherUserName = message.sender_id === user.id 
          ? (message.recipient as any)?.full_name 
          : (message.sender as any)?.full_name;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            recipient_id: otherUserId,
            recipient_name: otherUserName || 'Unknown User',
            last_message: message.content,
            last_message_at: message.created_at,
            unread_count: message.recipient_id === user.id && !message.read ? 1 : 0,
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (recipientId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages((data || []) as Message[]);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', recipientId)
        .eq('recipient_id', user.id)
        .eq('read', false);

    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Update conversations
          fetchConversations();
          
          // Show toast for new message
          toast({
            title: "New message",
            description: "You have received a new message",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev =>
            prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (
    recipientId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'system' = 'text',
    listingId?: string
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          message_type: messageType,
          listing_id: listingId || null,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data as Message]);
      return data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    messages,
    conversations,
    loading,
    fetchMessages,
    sendMessage,
    refetch: fetchConversations,
  };
};
