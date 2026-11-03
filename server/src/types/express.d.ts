// server/src/types/express.d.ts

// Custom type declarations for Express Request, adding authenticated user payload.

import { AuthTokenPayload } from '../utils/tokenUtils.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export {};
