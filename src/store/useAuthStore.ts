import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/types/database.types';

interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Tables<'profiles'> | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signup: (email: string, password: string, username: string, fullName: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setProfile: (profile: Tables<'profiles'>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (data.user) {
          set({ user: { id: data.user.id, email: data.user.email || '' } });
          await get().fetchProfile();
        }

        set({ isLoading: false });
        return { error, data };
      },

      signup: async (email: string, password: string, username: string, fullName: string) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (data.user) {
          // Create profile after successful signup
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            username,
            full_name: fullName,
            avatar_url: null,
            bio: null,
            website: null,
          });

          if (!profileError) {
            set({ user: { id: data.user.id, email: data.user.email || '' } });
            await get().fetchProfile();
          }
        }

        set({ isLoading: false });
        return { error, data };
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
      },

      fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          set({ profile: data });
        }
      },
      
      setProfile: (profile: Tables<'profiles'>) => {
        set({ profile });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
