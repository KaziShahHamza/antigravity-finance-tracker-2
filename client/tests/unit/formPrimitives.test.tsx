// client/tests/unit/formPrimitives.test.tsx

// Unit tests for Button, Input, and Select UI primitives verifying rendering, variants, and errors.

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

describe('Button Primitive', () => {
  it('renders children and applies variant classes', () => {
    render(<Button variant="outline">Click Me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('btn-outline');
  });

  it('handles click events and disabled state', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    const btn = screen.getByRole('button', { name: /disabled/i });
    expect(btn.hasAttribute('disabled')).toBe(true);
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner and disables button when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn.hasAttribute('disabled')).toBe(true);
  });
});

describe('Input Primitive', () => {
  it('renders label, input, and hint', () => {
    render(
      <Input
        label="Email Address"
        placeholder="you@example.com"
        hint="We will send a 6-digit OTP"
      />
    );
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByText(/we will send a 6-digit otp/i)).toBeDefined();
  });

  it('renders error state and sets aria-invalid', () => {
    render(<Input label="Password" error="Password must be at least 8 characters" />);
    const input = screen.getByLabelText(/password/i);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeDefined();
  });
});

describe('Select Primitive', () => {
  const options = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'BDT', label: 'Bangladeshi Taka (BDT)' },
    { value: 'EUR', label: 'Euro (EUR)' },
  ];

  it('renders select with options and handles selection', () => {
    render(<Select label="Default Currency" options={options} defaultValue="BDT" />);
    const select = screen.getByLabelText(/default currency/i) as HTMLSelectElement;
    expect(select.value).toBe('BDT');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('renders error message when error prop is provided', () => {
    render(<Select label="Currency" options={options} error="Currency is required" />);
    const select = screen.getByLabelText(/currency/i);
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/currency is required/i)).toBeDefined();
  });
});
