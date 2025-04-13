import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  it('renders input with default styles', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('border-input');
    expect(input).not.toBeDisabled();
  });

  it('renders input with error state when error prop is provided', () => {
    render(<Input placeholder="Enter text" error="This field is required" />);
    const input = screen.getByPlaceholderText('Enter text');
    const errorMessage = screen.getByText('This field is required');
    
    expect(input).toHaveClass('border-red-500');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-500');
  });

  it('renders disabled input when disabled prop is passed', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });

  it('passes additional props to the input element', () => {
    render(
      <Input
        type="email"
        placeholder="Email"
        id="email-input"
        name="email"
        autoComplete="email"
        required
      />
    );
    
    const input = screen.getByPlaceholderText('Email');
    
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('id', 'email-input');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('required');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Custom input" />);
    const input = screen.getByPlaceholderText('Custom input');
    
    expect(input).toHaveClass('custom-class');
  });
});
