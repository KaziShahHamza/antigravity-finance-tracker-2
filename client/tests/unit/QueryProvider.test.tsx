// client/tests/unit/QueryProvider.test.tsx

// Unit tests validating the React Query provider initializes and wraps children with a live QueryClient.

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { QueryProvider } from '../../src/context/QueryProvider';

const TestConsumerComponent: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['testData'],
    queryFn: async () => 'React Query Active',
  });

  if (isLoading) {
    return <span>Loading...</span>;
  }

  return <div>{data}</div>;
};

describe('QueryProvider', () => {
  it('renders children and provides functional QueryClient context', async () => {
    render(
      <QueryProvider>
        <TestConsumerComponent />
      </QueryProvider>
    );

    expect(screen.getByText('Loading...')).toBeDefined();
    const resolvedText = await screen.findByText('React Query Active');
    expect(resolvedText).toBeDefined();
  });
});
