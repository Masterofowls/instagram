import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/auth/LoginForm';
import { useAuthStore } from '@/store/useAuthStore';

// Mock the auth store
jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock the next/navigation (already done in jest.setup.ts)
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginForm Component', () => {
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
  });
  
  it('renders the login form with all elements', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Log in to see photos and videos from your friends.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText('Don\'t have an account?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });
  
  it('shows validation errors for invalid inputs', async () => {
    render(<LoginForm />);
    
    // Submit the form without entering any data
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });
  
  it('calls login function with correct data on valid submission', async () => {
    mockLogin.mockResolvedValue({ error: null, data: { user: { id: '123', email: 'test@example.com' } } });
    
    render(<LoginForm />);
    
    await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
  
  it('shows error message when login fails', async () => {
    mockLogin.mockResolvedValue({ error: { message: 'Invalid credentials' }, data: null });
    
    render(<LoginForm />);
    
    await userEvent.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials. Please try again.')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
  
  it('shows loading state when isLoading is true', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: true,
    });
    
    render(<LoginForm />);
    
    const loginButton = screen.getByRole('button', { name: /log in/i });
    expect(loginButton).toBeDisabled();
    expect(loginButton.querySelector('.animate-spin')).toBeInTheDocument();
  });
  
  it('navigates to signup page when clicking on sign up link', () => {
    render(<LoginForm />);
    
    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toHaveAttribute('href', '/auth/signup');
  });
});
