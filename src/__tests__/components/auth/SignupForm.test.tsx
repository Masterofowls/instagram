import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupForm from '@/components/auth/SignupForm';
import { useAuthStore } from '@/store/useAuthStore';

// Mock the auth store
jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock the next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SignupForm Component', () => {
  const mockSignup = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({
      signup: mockSignup,
      isLoading: false,
    });
  });
  
  it('renders the signup form with all elements', () => {
    render(<SignupForm />);
    
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Sign up to see photos and videos from your friends.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText('Have an account?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });
  
  it('shows validation errors for invalid inputs', async () => {
    render(<SignupForm />);
    
    // Submit the form without entering any data
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Full name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });
  
  it('validates username format', async () => {
    render(<SignupForm />);
    
    await userEvent.type(screen.getByPlaceholderText('Username'), 'user@name');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Username can only contain letters, numbers, periods, and underscores')).toBeInTheDocument();
    });
  });
  
  it('calls signup function with correct data on valid submission', async () => {
    mockSignup.mockResolvedValue({ error: null, data: { user: { id: '123', email: 'test@example.com' } } });
    
    render(<SignupForm />);
    
    await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Full Name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        'test@example.com', 
        'password123', 
        'testuser', 
        'Test User'
      );
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
  
  it('shows error message when signup fails', async () => {
    mockSignup.mockResolvedValue({ error: { message: 'Email already in use' }, data: null });
    
    render(<SignupForm />);
    
    await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Full Name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
  
  it('shows loading state when isLoading is true', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      signup: mockSignup,
      isLoading: true,
    });
    
    render(<SignupForm />);
    
    const signupButton = screen.getByRole('button', { name: /sign up/i });
    expect(signupButton).toBeDisabled();
    expect(signupButton.querySelector('.animate-spin')).toBeInTheDocument();
  });
  
  it('navigates to login page when clicking on log in link', () => {
    render(<SignupForm />);
    
    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toHaveAttribute('href', '/auth/login');
  });
});
