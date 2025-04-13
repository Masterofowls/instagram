import { supabase } from './supabase';
import { Tables } from '@/types/database.types';
import { ExtendedUserProfile, MessageWithUI } from '@/types/custom.types';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
}

export type UserProfile = ExtendedUserProfile;

export interface Conversation {
  id: string;
  messages: Message[];
  otherUser: UserProfile;
  lastMessage?: Message;
  unreadCount: number;
}

// Subscribe to new messages for a specific user
export function subscribeToMessages(userId: string, callback: () => void) {
  return supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// Get all conversations for a user
export async function getConversations(userId: string): Promise<{ data: Conversation[] | null; error: Error | null }> {
  try {
    // Get all messages where the user is either the sender or recipient
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!messages || messages.length === 0) {
      return { data: [], error: null };
    }

    // Get unique user IDs from the messages
    const uniqueUserIds = Array.from(
      new Set(
        messages.map(msg => 
          msg.sender_id === userId ? msg.recipient_id : msg.sender_id
        )
      )
    );

    // Get user profiles for the unique users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', uniqueUserIds);

    if (profilesError) {
      throw profilesError;
    }

    // Group messages by conversation
    const conversationMap = new Map<string, Message[]>();
    
    messages.forEach(message => {
      // For each message, determine the conversation partner
      const partnerId = message.sender_id === userId ? message.recipient_id : message.sender_id;
      
      // Get or create the message list for this conversation
      const conversationMessages = conversationMap.get(partnerId) || [];
      
      // Add this message to the conversation
      conversationMessages.push(message);
      
      // Update the map
      conversationMap.set(partnerId, conversationMessages);
    });

    // Convert the map to an array of Conversation objects
    const conversations: Conversation[] = Array.from(conversationMap.entries()).map(([partnerId, msgs]) => {
      // Sort messages by date (newest last)
      const sortedMessages = [...msgs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const lastMessage = sortedMessages[sortedMessages.length - 1];
      
      // Get the profile of the other user
      const otherUser = profiles?.find(profile => profile.id === partnerId);
      
      if (!otherUser) {
        throw new Error(`Profile not found for user ID: ${partnerId}`);
      }
      
      // Count unread messages
      const unreadCount = sortedMessages.filter(
        msg => msg.recipient_id === userId && !msg.read
      ).length;
      
      return {
        id: partnerId,
        messages: sortedMessages,
        otherUser,
        lastMessage,
        unreadCount,
      };
    });

    // Sort conversations by the timestamp of the last message
    conversations.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return timeB - timeA; // Newest first
    });

    return { data: conversations, error: null };
  } catch (error) {
    console.error('Error getting conversations:', error);
    return { data: null, error: error as Error };
  }
}

// Send a message
export async function sendMessage(
  senderId: string,
  recipientId: string,
  text: string,
  attachmentUrl?: string
): Promise<{ data: Message | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        text,
        attachment_url: attachmentUrl,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { data: null, error: error as Error };
  }
}

// Mark all messages in a conversation as read
export async function markConversationAsRead(
  userId: string,
  conversationPartnerId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('sender_id', conversationPartnerId);

    if (error) {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return { success: false, error: error as Error };
  }
}

// Search for users
export async function searchUsers(
  query: string,
  currentUserId: string,
  limit: number = 10
): Promise<{ data: UserProfile[] | null; error: Error | null }> {
  try {
    if (!query.trim()) {
      return { data: [], error: null };
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq('id', currentUserId)
      .limit(limit);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error searching users:', error);
    return { data: null, error: error as Error };
  }
}
