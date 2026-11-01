# AGENTS.md — Workspace Guidelines & Engineering Conventions

This file defines the architectural constraints, coding standards, and workflow rules for AI agents and contributors working in `antigravity-finance-tracker`.

---

## 1. Monorepo Layout & Boundaries

- **Two-Folder Architecture**:
  - `client/`: Next.js 15 (App Router) frontend in TypeScript. Deployed to **Vercel**.
  - `server/`: Node.js + Express REST API in TypeScript (`tsx` in dev, `tsc` build in prod). Deployed to **Render**.
- Each folder (`client/` and `server/`) maintains its own independent `package.json` and `tsconfig.json` so Vercel and Render can deploy directly from their respective root directories without monorepo build friction.
- A lightweight root `package.json` provides convenience scripts (`dev`, `build`, `typecheck`, `install:all`) for local development.

---

## 2. Strict Technology & Styling Rules

1. **Plain Tailwind CSS Only**:
   - Use plain Tailwind CSS utility classes, `next-themes` (`darkMode: 'class'`), and `lucide-react` icons.
   - **Do NOT** install heavy component libraries (no Material UI, Ant Design, Chakra UI, or unrequested component frameworks). Build clean, accessible, reusable UI primitives inside `client/src/components/ui/`.
2. **End-to-End TypeScript**:
   - Keep `"strict": true` enabled in both `client/tsconfig.json` and `server/tsconfig.json`.
   - Validate all incoming Express request bodies, query params, and route params using **Zod** schemas.
3. **Render Free-Tier Memory Guardrails (512MB RAM)**:
   - Never add Puppeteer, Playwright, Chromium, or heavy native C++ binaries to `server/`.
   - Keep **CSV (`papaparse`)** and **PDF (`jspdf` + `jspdf-autotable`)** generation strictly **client-side** in `client/src/lib/`.
   - Use `multer` memory storage with strict file-size limits (e.g., max `5MB` per receipt image).
4. **Next.js 15 Hydration Safety**:
   - Any component reading browser-local state—specifically the **AM/PM local time greeting** and **theme toggle**—must guard initial render (`mounted` state) so server HTML and client hydration never mismatch.

---

## 3. Authentication & Cross-Origin Rules

- Because Vercel (`*.vercel.app`) and Render (`*.onrender.com`) run on separate domains:
  - Pass short-lived JWT access tokens in the `Authorization: Bearer <token>` header.
  - Handle silent renewal via a refresh token endpoint (`POST /api/auth/refresh`).
  - Configure Express `cors` explicitly with `process.env.CLIENT_URL`.
- **Google OAuth**:
  - Use **Google Identity Services (GIS)** on the Next.js frontend to obtain a Google ID token via popup/button, and verify it on Express (`POST /api/auth/google`) using `google-auth-library`. Do **not** implement brittle cross-domain Passport redirect chains.
- **Email Verification**:
  - Newly registered email/password users start with `isVerified: false` and are immediately directed to `/verify-otp` to submit their 6-digit code (15-minute expiration, 60-second resend cooldown) before accessing dashboard routes.

---

## 4. Mandatory Local Development Fallbacks

The application must start and remain 100% testable in local development even when third-party API keys are omitted from `server/.env`:

- **Resend (`RESEND_API_KEY` missing)**: Log a formatted box in the server terminal containing the recipient email and the 6-digit OTP / password-reset code, and return a successful response.
- **Cloudinary / Gemini (`CLOUDINARY_*` or `GEMINI_API_KEY` missing)**: Return realistic structured mock OCR JSON (`{ vendor, date, totalAmount, currency, suggestedCategory, items }`) and a fallback receipt preview URL so the Receipt Upload & OCR modal flow can be tested end-to-end.
- **Exchange Rates API**: Cache fetched rates from `https://open.er-api.com/v6/latest/USD` in MongoDB for 24 hours; if network access is unavailable and cache is empty, fall back to a built-in baseline rate map (`USD`, `BDT`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`, `JPY`, etc.).

---

## 5. Financial & Database Integrity

- **Supported Wallet Types**: `'cash' | 'bank' | 'bkash' | 'nagad' | 'credit' | 'other'`.
- **Balance Consistency**:
  - Creating, editing, or deleting an `income`, `expense`, or `transfer` transaction must atomically reconcile the affected `Account` balance(s).
  - Editing a transaction must reverse its prior balance impact before applying the updated amount/type/account.
  - Use rounded 2-decimal precision helpers (`Math.round((val + Number.EPSILON) * 100) / 100`) to avoid IEEE-754 floating-point drift.
- **Onboarding Defaults**:
  - Upon first verification (email OTP verification or first Google login), automatically seed default categories (`Food & Dining`, `Rent & Housing`, `Groceries`, `Shopping`, `Transportation`, `Utilities`, `Entertainment`, `Health`, `Salary`, `Freelance`, `Investment`, `Other`) and a default `'Main Checking'` account if the user has none.

---

## 6. Phased Execution & Living Documentation

1. **Follow `docs/PROJECT_PLAN.md`**:
   - Implement work sequentially by Phase and Subphase.
   - Mark completed items (`- [x]`) in `docs/PROJECT_PLAN.md` at the end of each subphase/phase.
2. **Keep Documentation Synchronized**:
   - Create and maintain `docs/DB.md` alongside Mongoose schema changes (Phase 1+).
   - Create and maintain `docs/API.md` alongside Express route & controller implementations (Phase 2+).
   - Create `docs/DEPLOYMENT.md` with step-by-step Vercel, Render, and MongoDB Atlas instructions (Phase 6).
3. **Quality Gate per Phase**:
   - Run TypeScript checks (`tsc --noEmit`) in both `server/` and `client/` and verify zero compilation errors before closing a phase.
