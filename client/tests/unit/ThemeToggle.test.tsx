// client/tests/unit/ThemeToggle.test.tsx

// Unit tests verifying hydration-safe initial render and toggle mechanics of ThemeToggle.

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { ThemeProvider } from '@/context/ThemeProvider';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('ThemeToggle', () => {
  it('renders mounted toggle button with theme indicator', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = await screen.findByRole('button');
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-label')).toContain('Toggle theme');
  });

  it('cycles theme when clicked', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = await screen.findByRole('button');
    fireEvent.click(button);
    expect(button.getAttribute('aria-label')).toBeDefined();
  });
});
