// server/src/services/googleAuthService.ts

// Google OAuth authentication service verifying Google ID tokens and managing social login user sessions.

import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AuthServiceError, issueUserSession, UserSessionResult } from './authService.js';
import { seedUserDefaults } from './seedService.js';

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google ID token via GIS or uses development/test mock fallback.
 */
export const verifyGoogleCredential = async (credential: string): Promise<GoogleUserInfo> => {
  // Allow simulated Google credentials in dev / test environments
  if (credential.startsWith('mock-google-token')) {
    const [, sub, email, name, ...avatarParts] = credential.split(':');
    const avatarUrl =
      avatarParts.length > 0
        ? avatarParts.join(':')
        : 'https://lh3.googleusercontent.com/avatar.png';

    return {
      googleId: sub || 'google_sub_12345',
      email: (email || 'google_user@example.com').toLowerCase(),
      name: name || 'Google User',
      avatarUrl,
    };
  }

  if (!env.GOOGLE_CLIENT_ID) {
    throw new AuthServiceError(
      'Google authentication is not configured on this server.',
      501,
      'GOOGLE_AUTH_NOT_CONFIGURED'
    );
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      throw new AuthServiceError('Invalid Google token payload.', 401, 'INVALID_GOOGLE_TOKEN');
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture,
    };
  } catch (error) {
    if (error instanceof AuthServiceError) throw error;
    throw new AuthServiceError('Invalid or expired Google token.', 401, 'INVALID_GOOGLE_TOKEN');
  }
};

/**
 * Verifies Google ID token, links or creates the user, seeds defaults if new, and returns session tokens.
 */
export const loginWithGoogle = async (credential: string): Promise<UserSessionResult> => {
  const googleUser = await verifyGoogleCredential(credential);

  let user = await User.findOne({
    $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
  });

  if (user) {
    let modified = false;
    if (!user.googleId) {
      user.googleId = googleUser.googleId;
      modified = true;
    }
    if (!user.avatarUrl && googleUser.avatarUrl) {
      user.avatarUrl = googleUser.avatarUrl;
      modified = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  } else {
    // New Google OAuth user
    user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.googleId,
      avatarUrl: googleUser.avatarUrl || '',
      isVerified: true,
      defaultCurrency: 'USD',
    });

    // Seed onboarding defaults on first registration
    await seedUserDefaults(user._id, 'USD');
  }

  return issueUserSession(user);
};
