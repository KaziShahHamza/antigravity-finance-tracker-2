# Finance Tracker — Atomic Phased Implementation Plan

This document is the master roadmap for building, testing, and deploying the **Antigravity Finance Tracker**.

Every subphase is broken down into **numbered 2–5 minute Atomic Tasks** (`Task X.Y.Z`).

- Tests and synchronized docs are delivered in the same subphase as the feature they cover. Follow [`QUALITY.md`](QUALITY.md) and [`../AGENTS.md`](../AGENTS.md) for code style (including the 1–3 line purpose header on authored source files), test layers, security checks, and PR review workflow.
- **Execution Rule**: Work on temporary task branches (`feat/*`, `fix/*`, etc.). Execute **1 atomic task at a time** (touching 1–3 files), run relevant checks, mark `[x]`, complete the local pre-commit checklist in [`QUALITY.md`](QUALITY.md), commit at logical working checkpoints, and merge via PR into `main`.
- **Quality Gates**:
  - **Every Atomic Task**: `format:check` -> `lint` -> `typecheck` -> focused unit/integration test -> diff & secret check -> `git commit`.
  - **End of Every Subphase**: Subphase unit/integration (and applicable E2E) tests green + [`QUALITY.md`](QUALITY.md) 5-point security & fresh diff review.
  - **End of Every Phase**: Full verification suite (`format:check`, `lint`, `typecheck`, `test:unit`, `test:integration`, `build`, `audit`, plus `test:e2e` as browser flows come online) + living doc verification (`docs/DB.md`, `docs/API.md`, `docs/DEPLOYMENT.md`) + PR/CI review.

---

## Phase 1: Monorepo Scaffold, Quality Tooling, UI Primitives & Database Foundation

**Goal**: Initialize the `client/` (Next.js 15 + Tailwind) and `server/` (Express + TypeScript) workspaces with formatting, linting, and test runners, build plain-Tailwind UI primitives with dark/light mode, and implement all core Mongoose schemas.

### Subphase 1.1: Root Workspace, Quality Tooling & Express Server Setup

- [x] **Task 1.1.1 — Root Workspace, Prettier & CI Workflow**: Create root `package.json` with canonical scripts (`dev`, `build`, `format`, `format:check`, `lint`, `typecheck`, `test`, `test:unit`, `test:integration`, `test:e2e`, `audit`, `install:all`), root `.prettierrc` / `.prettierignore`, and `.github/workflows/ci.yml` for PR checks.
- [x] **Task 1.1.2 — Server Package, TypeScript, ESLint & Vitest Config**: Create `server/package.json`, `server/tsconfig.json` (`strict: true`), `server/eslint.config.mjs`, `server/vitest.config.ts`, and `server/.env.example`; install Express, Mongoose, Zod, security/auth packages, ESLint, Vitest, and Supertest.
- [x] **Task 1.1.3 — Server Env Validator, Request Validator & Unit Tests**: Implement `server/src/config/env.ts` (Zod env parser with local dev defaults), `server/src/middlewares/errorHandler.ts`, `server/src/middlewares/validateRequest.ts`, and unit tests (`server/tests/unit/validateRequest.test.ts`).
- [x] **Task 1.1.4 — Express App Entrypoint, Health Route & Integration Test**: Create `server/src/app.ts` (exported for Supertest) and `server/src/server.ts` with `helmet`, `cors`, JSON limits, and `GET /api/health`, plus `server/tests/integration/health.test.ts`.

### Subphase 1.2: Next.js 15 Client, Plain Tailwind CSS, Test Runners & UI Primitives

- [x] **Task 1.2.1 — Next.js 15 App Router, Tailwind & Client Test Config**: Initialize `client/` with Next.js 15 (App Router), TypeScript (`strict: true`), plain Tailwind CSS, `client/.env.example`, `client/vitest.config.ts`, and `client/playwright.config.ts` (Playwright strictly in `client/`); install `next-themes`, `lucide-react`, `recharts`, `jspdf`, `jspdf-autotable`, `papaparse`.
- [x] **Task 1.2.2 — Theme Provider, Semantic Style Tokens & Hydration-Safe Theme Toggle**: Create `client/src/styles/tokens.css` (semantic CSS variables), `client/src/styles/primitives.css` (`@layer components` reusable classes), `client/src/context/ThemeProvider.tsx` (`attribute="class"`), and `client/src/components/layout/ThemeToggle.tsx` (Light / Dark / System mode with `mounted` guard) and wire into `client/src/app/layout.tsx`.
- [x] **Task 1.2.3 — Core Form & Action UI Primitives**: Build `Button.tsx`, `Input.tsx`, and `Select.tsx` in `client/src/components/ui/` backed by `client/src/styles/primitives.css` with accessible focus states, error messages, and semantic theme styling.
- [x] **Task 1.2.4 — Container & Feedback UI Primitives**: Build `Card.tsx`, `Modal.tsx`, `Badge.tsx`, `Spinner.tsx`, `Toast.tsx`, and `Skeleton.tsx` in `client/src/components/ui/` backed by `client/src/styles/primitives.css`.
- [x] **Task 1.2.5 — Frontend API Client, Shared Types & Unit Tests**: Create `client/src/types/index.ts` and `client/src/lib/api.ts` (Bearer header injection + silent `/auth/refresh` retry on `401`) along with `client/src/lib/__tests__/api.test.ts`.

### Subphase 1.3: MongoDB Connection & Mongoose Data Models

- [x] **Task 1.3.1 — MongoDB Connection Manager, Test DB Helper & Math Utils**: Implement `server/src/config/db.ts`, `server/src/utils/mathUtils.ts` (`roundCurrency` 2-decimal helper), and unit tests (`server/tests/unit/mathUtils.test.ts`) plus isolated `MONGODB_TEST_URI` test setup helper.
- [x] **Task 1.3.2 — `User` & `ExchangeRate` Mongoose Models**: Implement `server/src/models/User.ts` (email, password, googleId, verification/reset code hashes, `defaultCurrency`, `monthlyBudgetLimit`, `customExchangeRates`, `themePreference`) and `server/src/models/ExchangeRate.ts`.
- [x] **Task 1.3.3 — `Account` & `Category` Mongoose Models**: Implement `server/src/models/Account.ts` (`cash`, `bank`, `bkash`, `nagad`, `credit`, `other`) and `server/src/models/Category.ts` (`income`, `expense`, `isDefault`).
- [ ] **Task 1.3.4 — `Transaction` & `Budget` Mongoose Models**: Implement `server/src/models/Transaction.ts` (compound `(userId, date)` index, transfer & OCR fields) and `server/src/models/Budget.ts` (unique `(userId, categoryId, month, year)` index).
- [ ] **Task 1.3.5 — Model Validation Tests, `docs/DB.md` & Phase 1 Gate**: Add schema/index validation tests (`server/tests/integration/models.test.ts`), create `docs/DB.md`, and run Phase 1 quality gate (`format:check`, `lint`, `typecheck`, `test`, `build`, `audit`).

---

## Phase 2: Authentication, Email OTP, Google OAuth & User Settings

**Goal**: Deliver complete, secure authentication (Email/Password + 6-digit OTP, Forgot/Reset Password, Google Sign-In) plus onboarding seed defaults and User Settings.

### Subphase 2.1: Email/Password Signup, OTP Verification & JWT Session API

- [ ] **Task 2.1.1 — JWT Token Utilities, Auth Middleware & Unit Tests**: Implement `server/src/utils/tokenUtils.ts` (sign/verify access & refresh JWTs, 6-digit OTP generator/hasher), `server/src/middlewares/authMiddleware.ts`, and `server/tests/unit/tokenUtils.test.ts`.
- [ ] **Task 2.1.2 — Resend Email Service with Console/Test Fallback**: Implement `server/src/services/emailService.ts` with HTML templates for 6-digit Verification OTP and Password Reset codes, falling back to a formatted console log box when `RESEND_API_KEY` is omitted.
- [ ] **Task 2.1.3 — Onboarding Default Seed Service**: Implement `server/src/services/seedService.ts` to idempotently seed the 12 default categories and a default `'Main Checking'` account on first user verification.
- [ ] **Task 2.1.4 — Register, Verify OTP & Resend OTP Endpoints**: Implement `POST /api/auth/register`, `POST /api/auth/verify-otp` (15m expiry), and `POST /api/auth/resend-otp` (60s cooldown) with Zod schemas and auth rate limiters.
- [ ] **Task 2.1.5 — Login, Refresh & Logout Endpoints + `docs/API.md`**: Implement `POST /api/auth/login`, `POST /api/auth/refresh`, and `POST /api/auth/logout`; initialize `docs/API.md` with Auth endpoint contracts.
- [ ] **Task 2.1.6 — Auth & Onboarding Seed Integration Tests**: Add `server/tests/integration/auth.test.ts` covering register -> OTP expiry/cooldown/verify -> onboarding seed -> login -> refresh -> logout and unauthorized edge cases.

### Subphase 2.2: Forgot/Reset Password & Google OAuth Verification API

- [ ] **Task 2.2.1 — Forgot & Reset Password Endpoints**: Implement `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` (verifies 6-digit reset code, updates bcrypt password, invalidates old refresh token).
- [ ] **Task 2.2.2 — Google Identity Services Verification Endpoint & Tests**: Install `google-auth-library` in `server/`, implement `POST /api/auth/google` (verifies Google ID token, links/creates verified user, triggers `seedService` if new), add integration tests (`server/tests/integration/passwordAndGoogleAuth.test.ts`), and update `docs/API.md`.

### Subphase 2.3: Frontend Auth Context, Auth Screens & Dashboard Shell

- [ ] **Task 2.3.1 — Frontend AuthContext & Google OAuth Button**: Implement `client/src/context/AuthContext.tsx` (user state, login/register/verify/logout helpers) and `client/src/components/auth/GoogleSignInButton.tsx`.
- [ ] **Task 2.3.2 — Login & Register Pages**: Build `/login` and `/register` pages under `client/src/app/(auth)/` with client validation and unverified-user redirection to `/verify-otp`.
- [ ] **Task 2.3.3 — 6-Digit OTP Verification Page**: Build `/verify-otp` page with 6 auto-advancing digit inputs, clipboard paste support, and a live 60-second resend countdown timer.
- [ ] **Task 2.3.4 — Forgot & Reset Password Pages**: Build `/forgot-password` and `/reset-password` pages under `client/src/app/(auth)/`.
- [ ] **Task 2.3.5 — Responsive Protected Dashboard Shell**: Build `Sidebar.tsx`, mobile drawer navigation, `Navbar.tsx`, and `client/src/app/(dashboard)/layout.tsx` route guard.
- [ ] **Task 2.3.6 — Auth Flow Playwright E2E Test**: Add `client/e2e/auth.spec.ts` covering register -> OTP verification -> protected dashboard access -> logout -> login.

### Subphase 2.4: User Profile, Settings Page & Demo Data Seeder

- [ ] **Task 2.4.1 — User Profile & Password Change API**: Implement `GET /api/users/me`, `PATCH /api/users/profile` (name, `defaultCurrency`, `monthlyBudgetLimit`, `themePreference`, `customExchangeRates`), and `PATCH /api/users/password`.
- [ ] **Task 2.4.2 — Demo Data Seeder Endpoint & User API Integration Tests**: Implement `POST /api/users/demo-data` (sample Cash, Bank, bKash, Nagad wallets, budgets, and transactions), add `server/tests/integration/users.test.ts`, and update `docs/API.md`.
- [ ] **Task 2.4.3 — Frontend Settings Page (`/settings`) & Phase 2 Gate**: Build `/settings` page (Profile, Currency & Theme preferences, Change Password, Load Demo Data) and run Phase 2 quality gate.

---

## Phase 3: Multi-Currency Engine & Account / Wallet Management

**Goal**: Enable multi-currency conversion and complete management of Cash, Bank, bKash, Nagad, Credit Card, and Custom wallets—including atomic inter-account transfers.

### Subphase 3.1: Exchange Rates Cache & Conversion Service

- [ ] **Task 3.1.1 — Backend Exchange Rates Service, Endpoint & Unit Tests**: Implement `server/src/services/ratesService.ts` (24h MongoDB cache from `open.er-api.com`, static fallback rates, user custom rate overrides, 2-decimal conversion), `GET /api/rates`, and `server/tests/unit/ratesService.test.ts`.
- [ ] **Task 3.1.2 — Frontend CurrencyContext, Formatters & Unit Tests**: Create `client/src/context/CurrencyContext.tsx`, `client/src/lib/formatters.ts` (`formatCurrency`, `convertAmount`, date helpers), and `client/src/lib/__tests__/formatters.test.ts`.

### Subphase 3.2: Account & Wallet CRUD API

- [ ] **Task 3.2.1 — Account CRUD Controller, Routes & Docs**: Implement `GET /api/accounts` (with converted balances & aggregate Total Balance), `POST /api/accounts`, `PATCH /api/accounts/:id`, and `DELETE /api/accounts/:id` supporting `'cash' | 'bank' | 'bkash' | 'nagad' | 'credit' | 'other'`; update `docs/API.md`.

### Subphase 3.3: Atomic Inter-Account Transfer Engine

- [ ] **Task 3.3.1 — Inter-Account Transfer Service & Endpoint**: Implement `POST /api/accounts/transfer` to atomically deduct from source wallet, apply currency conversion (or manual rate override), credit destination wallet, and create a linked `transfer` transaction record; update `docs/API.md`.
- [ ] **Task 3.3.2 — Accounts & Cross-Currency Transfer Integration Tests**: Add `server/tests/integration/accountsAndTransfers.test.ts` verifying `userId` isolation, wallet CRUD, cross-currency conversion accuracy, and transfer rollback/deletion safety.

### Subphase 3.4: Wallets & Accounts Frontend (`/accounts`)

- [ ] **Task 3.4.1 — Wallet Cards & Accounts Page Layout**: Build `AccountCard.tsx` (distinct badges/styling for Cash, Bank, bKash, Nagad, Credit Card) and `/accounts` overview page with Total Balance header.
- [ ] **Task 3.4.2 — Add/Edit Wallet Modal, Transfer Modal & E2E Check**: Build `AccountModal.tsx` and `TransferModal.tsx` (with live exchange rate preview), add `client/e2e/accounts.spec.ts` for wallet creation & transfer, and run Phase 3 quality gate.

---

## Phase 4: Transaction Management, Categories & AI Receipt OCR

**Goal**: Implement full Income/Expense/Transfer management, custom Categories, Search/Filter/Sort history, and AI Receipt Upload & OCR.

### Subphase 4.1: Categories & Transaction CRUD + Search/Filter/Sort API

- [ ] **Task 4.1.1 — Category CRUD Endpoints**: Implement `GET /api/categories`, `POST /api/categories`, `PATCH /api/categories/:id`, and `DELETE /api/categories/:id` (protecting system defaults).
- [ ] **Task 4.1.2 — Transaction Create, Update & Delete with Balance Reconciliation**: Implement `POST /api/transactions`, `PATCH /api/transactions/:id` (reverses prior balance impact before applying updated amount/account/type), and `DELETE /api/transactions/:id`.
- [ ] **Task 4.1.3 — Transaction Search, Filter, Sort & Pagination Endpoint**: Implement `GET /api/transactions` supporting `search`, `type`, `accountId`, `categoryId`, `startDate`, `endDate`, `sortBy`, `sortOrder`, `page`, and `limit`; update `docs/API.md`.
- [ ] **Task 4.1.4 — Transaction & Balance Reconciliation Integration Tests**: Add `server/tests/integration/transactions.test.ts` verifying wallet balance math across create/edit/delete (including account/type switches), cross-user access denial, and search/filter pagination.

### Subphase 4.2: Cloudinary Upload & Gemini Vision OCR Service

- [ ] **Task 4.2.1 — Cloudinary & Gemini Vision OCR Service**: Install `cloudinary` and `@google/genai` in `server/`; implement `server/src/services/ocrService.ts` to upload receipt images (max 5MB) and extract `{ vendor, date, totalAmount, currency, suggestedCategory, items }` with deterministic mock fallback when keys are missing.
- [ ] **Task 4.2.2 — Receipt OCR Endpoint & Integration Tests**: Implement `POST /api/ocr/receipt` with `multer` memory storage, MIME/size validation (`image/jpeg`, `image/png`, `image/webp`, `<=5MB`), rate limiting, `server/tests/integration/ocr.test.ts` (mock fallback + invalid file rejection), and `docs/API.md` update.

### Subphase 4.3: Transactions Page (`/transactions`), Filters & OCR Modal

- [ ] **Task 4.3.1 — Receipt Uploader & AI Auto-Fill Component**: Build `ReceiptUploader.tsx` in `client/src/components/transactions/` with drag-and-drop preview, scanning indicator, and callback to populate transaction fields.
- [ ] **Task 4.3.2 — Add/Edit Transaction Modal & Custom Category Creator**: Build `TransactionModal.tsx` (Income, Expense, Transfer tabs + OCR integration + inline custom Category creation).
- [ ] **Task 4.3.3 — Transaction Filters Toolbar**: Build `FiltersBar.tsx` with debounced search input, date range filter, wallet filter, category filter, type filter, and sort selector.
- [ ] **Task 4.3.4 — Transactions Page, History Table & E2E Check**: Build `TransactionTable.tsx` and `/transactions` page, add `client/e2e/transactionsAndOcr.spec.ts` (transaction CRUD + mock receipt OCR auto-fill), and run Phase 4 quality gate.

---

## Phase 5: Dashboard Analytics, Budgets & Client-Side Exports

**Goal**: Bring together financial insights on the Dashboard (with AM/PM local greeting and Recharts), Monthly & Category Budgets with overspending alerts, and instant CSV/PDF exports.

### Subphase 5.1: Budget Management & Overspending Alerts (`/budgets`)

- [ ] **Task 5.1.1 — Budget CRUD, Monthly Progress API & Integration Tests**: Implement `GET /api/budgets?month=&year=` (computes category spend, percentage used, and alert tier: `'normal' | 'warning' | 'exceeded'`), `POST /api/budgets`, `PATCH /api/budgets/:id`, `DELETE /api/budgets/:id`, `server/tests/integration/budgets.test.ts`, and `docs/API.md` update.
- [ ] **Task 5.1.2 — Budgets Page & Overspending Alert Cards**: Build `BudgetCard.tsx` (`<80%` Emerald, `80–99%` Amber Warning, `100%+` Red Overspent alert badge), `BudgetModal.tsx`, and `/budgets` page.

### Subphase 5.2: Dashboard Aggregation API & Interactive UI (`/dashboard`)

- [ ] **Task 5.2.1 — Dashboard Summary API & Integration Tests**: Implement `GET /api/dashboard/summary` (Total Balance, Monthly Income/Expenses, Net Savings Rate, 6-month Cash Flow series, Category Breakdown, Recent Transactions, Budget Alerts), `server/tests/integration/dashboard.test.ts`, and `docs/API.md` update.
- [ ] **Task 5.2.2 — Hydration-Safe Local AM/PM Greeting & Metric Cards**: Build `TimeGreeting.tsx` (`"Good morning/afternoon/evening, [Name]"` + live `12-hour AM/PM` local time guarded against SSR mismatch) and `MetricCards.tsx`.
- [ ] **Task 5.2.3 — Recharts Cash Flow & Expense Breakdown Charts**: Build `CashFlowChart.tsx` (Income vs. Expense grouped bar chart) and `ExpenseBreakdownChart.tsx` (category donut chart) with dark/light mode tooltips.
- [ ] **Task 5.2.4 — Recent Transactions Widget & Dashboard Page Assembly**: Build `RecentTransactions.tsx` and assemble `/dashboard` with quick actions (`+ Add Transaction`, `Transfer`, `Scan Receipt`).

### Subphase 5.3: Client-Side CSV & PDF Financial Reports

- [ ] **Task 5.3.1 — Client-Side CSV & PDF Export Utilities + Unit Tests**: Implement `client/src/lib/exportCsv.ts` (`papaparse`) and `client/src/lib/exportPdf.ts` (`jspdf` + `jspdf-autotable` statement), unit tests (`client/src/lib/__tests__/exports.test.ts`), and wire export buttons into `/transactions` and `/dashboard`.
- [ ] **Task 5.3.2 — Budgets, Dashboard & Export E2E Tests + Phase 5 Gate**: Add `client/e2e/budgetsAndExports.spec.ts` verifying budget overspending alerts, AM/PM dashboard rendering, and CSV/PDF download triggers; run Phase 5 quality gate.

---

## Phase 6: Responsive Polish, Security Hardening & Deployment Readiness

**Goal**: Finalize UX polish, harden security & validation, verify full test & production builds, and prepare turnkey deployment configs for Vercel, Render, and MongoDB Atlas.

### Subphase 6.1: UX Polish, Landing Page & Empty States

- [ ] **Task 6.1.1 — Modern Landing Page & Empty/Loading Skeletons**: Build `client/src/app/page.tsx` landing page with feature highlights and auth CTAs, plus skeleton loaders and empty states across dashboard views.

### Subphase 6.2: Security Audit, Full Test Suite & Production Build Verification

- [ ] **Task 6.2.1 — Five-Point Security Review, Audits & Full Suite Gate**: Execute the [`QUALITY.md`](QUALITY.md) 5 security checks (auth/ownership, Zod validation, secret hygiene, rate/upload limits, atomic balance integrity), run `npm run audit`, `npm test`, `npm run test:e2e`, and `npm run build` across `server/` and `client/`.

### Subphase 6.3: Deployment Configuration & Final Documentation

- [ ] **Task 6.3.1 — Deployment Blueprints & `docs/DEPLOYMENT.md`**: Create `render.yaml`, verify Vercel config in `client/next.config.ts`, synchronize `docs/DB.md` and `docs/API.md`, and write `docs/DEPLOYMENT.md` with step-by-step setup for MongoDB Atlas, Resend, Google OAuth, Cloudinary, Gemini API, Render, and Vercel.
