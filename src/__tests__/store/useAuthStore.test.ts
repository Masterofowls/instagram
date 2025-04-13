import { act } from 'react-dom/test-utils';
import { renderHook } from '@testing-library/react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the store state before each test
    act(() => {
      useAuthStore.setState({
        user: null,
        profile: null,
        isLoading: false,
      });
    });
  });
  
  describe('login', () => {
    it('should set user when login is successful', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockProfile = { id: '123', username: 'testuser', avatar_url: null };
      
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      (supabase.from('profiles').select().eq().single as jest.Mock).mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });
      
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      
      expect(result.current.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
      });
      
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials';
      
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: errorMessage },
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      let response;
      await act(async () => {
        response = await result.current.login('wrong@example.com', 'wrong');
      });
      
      expect(response.error).toEqual({ message: errorMessage });
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('signup', () => {
    it('should create user and profile when signup is successful', async () => {
      const mockUser = { id: '123', email: 'new@example.com' };
      const mockProfile = {
        id: '123',
        username: 'newuser',
        full_name: 'New User',
        avatar_url: null,
      };
      
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      (supabase.from('profiles').insert as jest.Mock).mockResolvedValue({
        error: null,
      });
      
      (supabase.from('profiles').select().eq().single as jest.Mock).mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.signup('new@example.com', 'password', 'newuser', 'New User');
      });
      
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
      });
      
      expect(supabase.from('profiles').insert).toHaveBeenCalledWith({
        id: mockUser.id,
        username: 'newuser',
        full_name: 'New User',
        avatar_url: null,
        bio: null,
        website: null,
      });
      
      expect(result.current.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
      });
      
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should handle signup error', async () => {
      const errorMessage = 'Email already in use';
      
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: errorMessage },
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      let response;
      await act(async () => {
        response = await result.current.signup('existing@example.com', 'password', 'existinguser', 'Existing User');
      });
      
      expect(response.error).toEqual({ message: errorMessage });
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('logout', () => {
    it('should clear user state when logout is successful', async () => {
      // Set initial state with a user
      act(() => {
        useAuthStore.setState({
          user: { id: '123', email: 'test@example.com' },
          profile: { id: '123', username: 'testuser' },
          isLoading: false,
        });
      });
      
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
    });
  });
  
  describe('fetchProfile', () => {
    it('should fetch and set user profile', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockProfile = { id: '123', username: 'testuser', bio: 'Test bio' };
      
      // Set initial state with a user but no profile
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          profile: null,
          isLoading: false,
        });
      });
      
      (supabase.from('profiles').select().eq().single as jest.Mock).mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.fetchProfile();
      });
      
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result.current.profile).toEqual(mockProfile);
    });
    
    it('should not fetch profile if user is not logged in', async () => {
      // Set initial state with no user
      act(() => {
        useAuthStore.setState({
          user: null,
          profile: null,
          isLoading: false,
        });
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.fetchProfile();
      });
      
      expect(supabase.from).not.toHaveBeenCalledWith('profiles');
      expect(result.current.profile).toBeNull();
    });
  });
});
