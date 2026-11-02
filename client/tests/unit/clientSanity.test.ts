// client/tests/unit/clientSanity.test.ts

// Sanity unit test to verify Vitest JSDOM environment in client workspace.

import { describe, expect, it } from 'vitest';

describe('Client Vitest JSDOM sanity test', () => {
  it('runs browser-like DOM assertions correctly', () => {
    const div = document.createElement('div');
    div.textContent = 'Finance Tracker';
    expect(div.textContent).toBe('Finance Tracker');
  });
});
