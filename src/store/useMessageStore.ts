'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';
import { useAuthStore } from './useAuthStore';

type Message = Tables<'messages'> & {
  sender: Tables<'profiles'>;
  recipient: Tables<'profiles'>;
};

interface MessageState {
  conversations: Record<string, Message[]>;
  activeConversation: string | null;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  sendMessage: (recipientId: string, content: string) => Promise<boolean>;
  setActiveConversation: (userId: string) => void;
}

export const useMessageStore = create<MessageState>()((set, get) => ({
  conversations: {},
  activeConversation: null,
  isLoading: false,

  fetchConversations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoading: true });

    // Fetch messages where user is either sender or recipient
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(*),
        recipient:profiles!recipient_id(*)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (data) {
      const messages = data as unknown as Message[];

      // Group messages by conversation partner
      const conversationsMap: Record<string, Message[]> = {};
      
      messages.forEach(message => {
        const isUserSender = message.sender_id === user.id;
        const partnerId = isUserSender ? message.recipient_id : message.sender_id;
        
        if (!conversationsMap[partnerId]) {
          conversationsMap[partnerId] = [];
        }
        
        conversationsMap[partnerId].push(message);
      });
      
      // Sort messages in each conversation
      Object.keys(conversationsMap).forEach(userId => {
        conversationsMap[userId].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      set({ conversations: conversationsMap });
    }

    set({ isLoading: false });
  },

  sendMessage: async (recipientId: string, content: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return false;

    // Insert message in the database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content
      })
      .select(`
        *,
        sender:profiles!sender_id(*),
        recipient:profiles!recipient_id(*)
      `)
      .single();

    if (error || !data) return false;

    // Update local state
    const newMessage = data as unknown as Message;
    const conversations = { ...get().conversations };
    
    if (!conversations[recipientId]) {
      conversations[recipientId] = [];
    }
    
    conversations[recipientId].push(newMessage);
    set({ conversations });

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        type: 'message',
        message: 'sent you a message'
      });

    return true;
  },

  setActiveConversation: (userId: string) => {
    set({ activeConversation: userId });
  }
}));
