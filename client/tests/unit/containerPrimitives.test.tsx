// client/tests/unit/containerPrimitives.test.tsx

// Unit tests for Card, Modal, Badge, Spinner, Toast, Skeleton, and EmptyState UI primitives.

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Toast } from '@/components/ui/Toast';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

describe('Card Primitive', () => {
  it('renders title, description, and children content', () => {
    render(
      <Card title="Total Balance" description="Aggregated cash & bank balance">
        <div>$4,520.00</div>
      </Card>
    );

    expect(screen.getByText('Total Balance')).toBeDefined();
    expect(screen.getByText('Aggregated cash & bank balance')).toBeDefined();
    expect(screen.getByText('$4,520.00')).toBeDefined();
  });
});

describe('Modal Primitive', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.queryByText('Modal Content')).toBeNull();
  });

  it('renders content and calls onClose on close button click and Escape key', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Add Transaction">
        <div>Form Fields</div>
      </Modal>
    );

    expect(screen.getByText('Add Transaction')).toBeDefined();
    expect(screen.getByText('Form Fields')).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});

describe('Badge Primitive', () => {
  it('renders badge with correct variant styling', () => {
    render(<Badge variant="success">Completed</Badge>);
    const badge = screen.getByText('Completed');
    expect(badge.className).toContain('badge-success');
  });
});

describe('Spinner Primitive', () => {
  it('renders accessible loading status indicator', () => {
    render(<Spinner label="Fetching wallets" />);
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('Fetching wallets')).toBeDefined();
  });
});

describe('Toast Primitive', () => {
  it('renders alert notification message', () => {
    render(<Toast variant="success" message="Transaction saved successfully" />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Transaction saved successfully')).toBeDefined();
  });
});

describe('Skeleton Primitive', () => {
  it('renders aria-hidden skeleton element with pulse effect', () => {
    const { container } = render(<Skeleton className="h-6 w-24" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton.className).toContain('skeleton');
  });
});

describe('EmptyState Primitive', () => {
  it('renders title, description, and action button', () => {
    render(
      <EmptyState
        title="No Transactions Found"
        description="Try adjusting your filter options"
        action={<button>Clear Filters</button>}
      />
    );
    expect(screen.getByText('No Transactions Found')).toBeDefined();
    expect(screen.getByText('Try adjusting your filter options')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeDefined();
  });
});
