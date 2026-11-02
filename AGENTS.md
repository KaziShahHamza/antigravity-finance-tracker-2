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

## 7. Code Style, Comments & File Size

- Use the repository formatter and lint configuration once established; prefer consistent, standard formatting, clear names, small functions, and the existing project's import conventions.
- Every authored source/code file starts with a concise 1–3 line comment explaining the file's responsibility and how it works. Use the language's normal comment syntax. Keep it factual and update it when behavior changes. Do not add headers to JSON, lockfiles, generated files, or formats that do not support comments.
- Add inline comments only for non-obvious decisions, invariants, security constraints, or tricky algorithms. Explain why the code takes a non-obvious path; do not narrate what the next line already says.
- Keep files focused on one cohesive responsibility. Prefer roughly 100–300 lines; consider splitting around 300–500+ lines when responsibilities are mixed. These are guidelines, not hard limits; avoid fragmentation that makes code harder to follow.
- Keep functions focused and testable. Extract shared behavior when it has multiple real callers or a clear independent responsibility; avoid speculative abstractions.

## 8. Testing, Automation & Review Workflow

- Add tests in the same subphase as the behavior they cover; do not defer tests until the end. Use the selected test runner and document commands in root and workspace `package.json` scripts.
- **Unit tests** cover pure utilities, validation, currency math/rounding, auth helpers, and isolated service logic, including boundaries and failure paths.
- **Integration tests** cover Express routes/services with an isolated test database, auth/authorization, validation, persistence, and balance reconciliation. Clean up test data.
- **E2E tests** cover critical browser flows: register/verify/login, account setup and transfers, transaction CRUD, budget alerts, receipt OCR fallback, and exports. Mock external providers or use test credentials; never use production data.
- Run relevant tests while implementing each subphase. At each phase gate run the full suite, lint, typecheck, and production build for both workspaces. Run dependency/security audits after dependency changes and before release. Report only checks actually run and inspected.
- Provide root scripts for `test`, `test:unit`, `test:integration`, `test:e2e`, `lint`, `typecheck`, `build`, and `audit` as tooling becomes available. CI should run formatting/lint, typecheck, unit/integration tests, and builds on pull requests; run E2E checks on pull requests where CI resources permit and before release.
- Before committing, run the pre-commit checklist in `docs/QUALITY.md`, review `git diff`, check for secrets/generated files, update only affected docs and `docs/PROJECT_PLAN.md`, and run applicable checks. The project lifecycle includes focused commits, push, and PR creation; perform external actions only when authorized for the active task.
- Review every change freshly as a PR. Check correctness, maintainability, coverage, security, docs, and unnecessary complexity. Resolve findings or document accepted limitations before merge.
- Complete CI and final PR review before merge. Do not merge or publish a release unless the user authorizes it.
