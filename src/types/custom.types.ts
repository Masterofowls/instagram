import { Tables } from './database.types';

// Extend the profile type with additional fields we need
export interface ExtendedUserProfile extends Tables<'profiles'> {
  last_seen?: string;
  is_online?: boolean;
}

// Message type with additions for UI interactions
export interface MessageWithUI {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
  liked?: boolean;
}
