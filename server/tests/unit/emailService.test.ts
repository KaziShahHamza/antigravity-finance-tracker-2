// server/tests/unit/emailService.test.ts

// Unit tests for Resend email dispatch service and development console fallbacks.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  logEmailToConsole,
} from '../../src/services/emailService.js';

describe('emailService', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints formatted ASCII box to console via logEmailToConsole', () => {
    logEmailToConsole('Verification OTP', 'test@example.com', '123456');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const loggedOutput = consoleSpy.mock.calls[0][0];
    expect(loggedOutput).toContain('ANTIGRAVITY FINANCE EMAIL: VERIFICATION OTP');
    expect(loggedOutput).toContain('test@example.com');
    expect(loggedOutput).toContain('123456');
    expect(loggedOutput).toContain('RESEND_API_KEY omitted');
  });

  it('falls back cleanly to console log when sending verification email without RESEND_API_KEY', async () => {
    const result = await sendVerificationEmail('newuser@example.com', '654321');

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    const loggedOutput = consoleSpy.mock.calls[0][0];
    expect(loggedOutput).toContain('newuser@example.com');
    expect(loggedOutput).toContain('654321');
  });

  it('falls back cleanly to console log when sending password reset email without RESEND_API_KEY', async () => {
    const result = await sendPasswordResetEmail('forgot@example.com', '987654');

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    const loggedOutput = consoleSpy.mock.calls[0][0];
    expect(loggedOutput).toContain('forgot@example.com');
    expect(loggedOutput).toContain('987654');
    expect(loggedOutput).toContain('PASSWORD RESET CODE');
  });
});
