# Finance Tracker — Atomic Phased Implementation Plan

This document is the master roadmap for building, testing, and deploying the **Antigravity Finance Tracker**.

Every subphase is broken down into **numbered 2–5 minute Atomic Tasks** (`Task X.Y.Z`).
- **Execution Rule**: Execute **1 atomic task at a time** (touching 1–3 files), verify with typecheck/test, mark `[x]`, and make a focused Git commit before starting the next task.
- **Quality Gates**:
  - **Every Atomic Task**: Fast TypeScript check (`tsc --noEmit`) + `git commit`.
  - **End of Every Subphase**: Lightweight unit/API test + security & diff review.
  - **End of Every Phase**: Full build check (`client` & `server`) + living doc verification (`docs/DB.md`, `docs/API.md`, `docs/DEPLOYMENT.md`).

---

## Phase 1: Monorepo Scaffold, Design Primitives & Database Foundation

**Goal**: Initialize the `client/` (Next.js 15 + Tailwind) and `server/` (Express + TypeScript) workspaces, establish shared UI primitives with dark/light mode, and implement all core Mongoose schemas.

### Subphase 1.1: Root Workspace & Express TypeScript Server Setup
- [ ] **Task 1.1.1 — Root Workspace & Pre-Commit Setup**: Create root `package.json` with convenience scripts (`dev`, `build`, `typecheck`, `lint`, `install:all` using `concurrently`) and `.github/workflows/ci.yml` for PR checks.
- [ ] **Task 1.1.2 — Server Package & TypeScript Config**: Create `server/package.json`, `server/tsconfig.json` (`strict: true`), and `server/.env.example`, then install Express, Mongoose, TypeScript, `tsx`, `zod`, `cors`, `helmet`, `dotenv`, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`, `multer`.
- [ ] **Task 1.1.3 — Server Env Validator & Error Middlewares**: Implement `server/src/config/env.ts` (Zod environment validation with local dev defaults), `server/src/middlewares/errorHandler.ts`, and `server/src/middlewares/validateRequest.ts`.
- [ ] **Task 1.1.4 — Express App Entrypoint & Health Endpoint**: Create `server/src/app.ts` and `server/src/server.ts` with `helmet`, `cors`, JSON parsing, and `GET /api/health`; verify server starts and passes `tsc --noEmit`.

### Subphase 1.2: Next.js 15 Client, Plain Tailwind CSS & Theme System
- [ ] **Task 1.2.1 — Next.js 15 App Router & Tailwind Scaffold**: Initialize `client/` with Next.js 15 (App Router), TypeScript (`strict: true`), plain Tailwind CSS, and `client/.env.example`; install `next-themes`, `lucide-react`, `recharts`, `jspdf`, `jspdf-autotable`, `papaparse`.
- [ ] **Task 1.2.2 — Theme Provider & Hydration-Safe Theme Toggle**: Create `client/src/context/ThemeProvider.tsx` (`attribute="class"`) and `client/src/components/layout/ThemeToggle.tsx` (Light / Dark / System mode) and wire into `client/src/app/layout.tsx`.
- [ ] **Task 1.2.3 — Core Form & Action UI Primitives**: Build plain-Tailwind `Button.tsx`, `Input.tsx`, and `Select.tsx` in `client/src/components/ui/` with accessible focus states, error messages, and dark mode styling.
- [ ] **Task 1.2.4 — Container & Feedback UI Primitives**: Build plain-Tailwind `Card.tsx`, `Modal.tsx`, `Badge.tsx`, `Spinner.tsx`, and `Toast.tsx` in `client/src/components/ui/`.
- [ ] **Task 1.2.5 — Frontend API Client & Shared TypeScript Interfaces**: Create `client/src/types/index.ts` (User, Account, Category, Transaction, Budget, ExchangeRate) and `client/src/lib/api.ts` (fetch wrapper with `Authorization: Bearer` header injection and silent `/auth/refresh` retry).

### Subphase 1.3: MongoDB Connection & Mongoose Data Models
- [ ] **Task 1.3.1 — MongoDB Connection Manager & Precision Helpers**: Implement `server/src/config/db.ts` and `server/src/utils/mathUtils.ts` (`roundCurrency` 2-decimal helper).
- [ ] **Task 1.3.2 — `User` & `ExchangeRate` Mongoose Models**: Implement `server/src/models/User.ts` (email, password, googleId, verification/reset code hashes, `defaultCurrency`, `monthlyBudgetLimit`, `customExchangeRates`, `themePreference`) and `server/src/models/ExchangeRate.ts`.
- [ ] **Task 1.3.3 — `Account` & `Category` Mongoose Models**: Implement `server/src/models/Account.ts` (`cash`, `bank`, `bkash`, `nagad`, `credit`, `other`) and `server/src/models/Category.ts` (`income`, `expense`, `isDefault`).
- [ ] **Task 1.3.4 — `Transaction` & `Budget` Mongoose Models**: Implement `server/src/models/Transaction.ts` (compound `(userId, date)` index, transfer & OCR fields) and `server/src/models/Budget.ts` (unique `(userId, categoryId, month, year)` index).
- [ ] **Task 1.3.5 — Database Documentation & Phase 1 Check**: Create `docs/DB.md` documenting all schemas and indexes; run `tsc --noEmit` across `server/` and `client/`.

---

## Phase 2: Authentication, Email OTP, Google OAuth & User Settings

**Goal**: Deliver complete, secure authentication (Email/Password + 6-digit OTP, Forgot/Reset Password, Google Sign-In) plus onboarding seed defaults and User Settings.

### Subphase 2.1: Email/Password Signup, OTP Verification & JWT Session API
- [ ] **Task 2.1.1 — JWT Token Utilities & Auth Middleware**: Implement `server/src/utils/tokenUtils.ts` (sign/verify access & refresh JWTs, 6-digit OTP generator/hasher) and `server/src/middlewares/authMiddleware.ts`.
- [ ] **Task 2.1.2 — Resend Email Service with Console Fallback**: Implement `server/src/services/emailService.ts` with HTML templates for 6-digit Verification OTP and Password Reset codes, falling back to a formatted console log box when `RESEND_API_KEY` is omitted.
- [ ] **Task 2.1.3 — Onboarding Default Seed Service**: Implement `server/src/services/seedService.ts` to seed the 12 default categories (`Food & Dining`, `Rent & Housing`, `Groceries`, `Shopping`, `Transportation`, `Utilities`, `Entertainment`, `Health`, `Salary`, `Freelance`, `Investment`, `Other`) and a default `'Main Checking'` account on first user verification.
- [ ] **Task 2.1.4 — Register, Verify OTP & Resend OTP Endpoints**: Implement `POST /api/auth/register`, `POST /api/auth/verify-otp` (15m expiry), and `POST /api/auth/resend-otp` (60s cooldown) with Zod schemas and auth rate limiters.
- [ ] **Task 2.1.5 — Login, Refresh & Logout Endpoints + `docs/API.md`**: Implement `POST /api/auth/login`, `POST /api/auth/refresh`, and `POST /api/auth/logout`; initialize `docs/API.md` with Auth endpoint specs.

### Subphase 2.2: Forgot/Reset Password & Google OAuth Verification API
- [ ] **Task 2.2.1 — Forgot & Reset Password Endpoints**: Implement `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` (verifies 6-digit reset code, updates bcrypt password, clears old refresh token).
- [ ] **Task 2.2.2 — Google Identity Services Verification Endpoint**: Install `google-auth-library` in `server/` and implement `POST /api/auth/google` (verifies Google ID token, links or creates verified user, triggers `seedService` on first login); update `docs/API.md`.

### Subphase 2.3: Frontend Auth Context, Auth Screens & Dashboard Shell
- [ ] **Task 2.3.1 — Frontend AuthContext & Google OAuth Button**: Implement `client/src/context/AuthContext.tsx` (user state, login/register/verify/logout helpers) and `client/src/components/auth/GoogleSignInButton.tsx`.
- [ ] **Task 2.3.2 — Login & Register Pages**: Build `/login` and `/register` pages under `client/src/app/(auth)/` with validation and unverified-user redirection to `/verify-otp`.
- [ ] **Task 2.3.3 — 6-Digit OTP Verification Page**: Build `/verify-otp` page with 6 auto-advancing digit inputs, clipboard paste support, and a live 60-second resend countdown timer.
- [ ] **Task 2.3.4 — Forgot & Reset Password Pages**: Build `/forgot-password` and `/reset-password` pages under `client/src/app/(auth)/`.
- [ ] **Task 2.3.5 — Responsive Protected Dashboard Shell**: Build `Sidebar.tsx`, mobile drawer navigation, `Navbar.tsx`, and `client/src/app/(dashboard)/layout.tsx` route guard.

### Subphase 2.4: User Profile, Settings Page & Demo Data Seeder
- [ ] **Task 2.4.1 — User Profile & Password Change API**: Implement `GET /api/users/me`, `PATCH /api/users/profile` (name, `defaultCurrency`, `monthlyBudgetLimit`, `themePreference`, `customExchangeRates`), and `PATCH /api/users/password`.
- [ ] **Task 2.4.2 — Demo Data Seeder Endpoint**: Implement `POST /api/users/demo-data` to populate sample wallets (Cash, Bank, bKash, Nagad), categories, budgets, and realistic multi-month income/expense transactions; update `docs/API.md`.
- [ ] **Task 2.4.3 — Frontend Settings Page (`/settings`)**: Build `/settings` page with Profile editor, Default Currency & Theme preferences, Change Password form, and "Load Demo Transactions" button.

---

## Phase 3: Multi-Currency Engine & Account / Wallet Management

**Goal**: Enable multi-currency conversion and complete management of Cash, Bank, bKash, Nagad, Credit Card, and Custom wallets—including atomic inter-account transfers.

### Subphase 3.1: Exchange Rates Cache & Conversion Service
- [ ] **Task 3.1.1 — Backend Exchange Rates Service & Endpoint**: Implement `server/src/services/ratesService.ts` (fetches `open.er-api.com/v6/latest/USD`, caches 24h in MongoDB, falls back to baseline rates for `USD`, `BDT`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`, `JPY`, etc.) and `GET /api/rates`.
- [ ] **Task 3.1.2 — Frontend CurrencyContext & Formatter**: Create `client/src/context/CurrencyContext.tsx` and `client/src/lib/formatters.ts` (`formatCurrency`, `convertAmount`, date formatters).

### Subphase 3.2: Account & Wallet CRUD API
- [ ] **Task 3.2.1 — Account CRUD Controller & Routes**: Implement `GET /api/accounts` (with converted balances & aggregate Total Balance), `POST /api/accounts`, `PATCH /api/accounts/:id`, and `DELETE /api/accounts/:id` supporting `'cash' | 'bank' | 'bkash' | 'nagad' | 'credit' | 'other'`; update `docs/API.md`.

### Subphase 3.3: Atomic Inter-Account Transfer Engine
- [ ] **Task 3.3.1 — Inter-Account Transfer Service & Endpoint**: Implement `POST /api/accounts/transfer` to atomically deduct from source wallet, apply currency conversion (or manual rate override), credit destination wallet, and create a linked `transfer` transaction record; update `docs/API.md`.

### Subphase 3.4: Wallets & Accounts Frontend (`/accounts`)
- [ ] **Task 3.4.1 — Wallet Cards & Accounts Page Layout**: Build `AccountCard.tsx` (with distinct badges/styling for Cash, Bank, bKash, Nagad, Credit Card) and `/accounts` overview page with Total Balance header.
- [ ] **Task 3.4.2 — Add/Edit Wallet Modal & Transfer Modal**: Build `AccountModal.tsx` (create/edit wallet, currency, icon, color) and `TransferModal.tsx` (source/destination selector with live exchange rate preview).

---

## Phase 4: Transaction Management, Categories & AI Receipt OCR

**Goal**: Implement full Income/Expense/Transfer management, custom Categories, Search/Filter/Sort history, and AI Receipt Upload & OCR.

### Subphase 4.1: Categories & Transaction CRUD + Search/Filter/Sort API
- [ ] **Task 4.1.1 — Category CRUD Endpoints**: Implement `GET /api/categories`, `POST /api/categories`, `PATCH /api/categories/:id`, and `DELETE /api/categories/:id` (protecting system defaults from accidental deletion unless custom).
- [ ] **Task 4.1.2 — Transaction Create, Update & Delete with Balance Reconciliation**: Implement `POST /api/transactions`, `PATCH /api/transactions/:id` (reverses prior balance impact before applying new amount/account/type), and `DELETE /api/transactions/:id`.
- [ ] **Task 4.1.3 — Transaction Search, Filter, Sort & Pagination Endpoint**: Implement `GET /api/transactions` supporting `search`, `type`, `accountId`, `categoryId`, `startDate`, `endDate`, `sortBy`, `sortOrder`, `page`, and `limit`; update `docs/API.md`.

### Subphase 4.2: Cloudinary Upload & Gemini Vision OCR Service
- [ ] **Task 4.2.1 — Cloudinary & Gemini Vision OCR Service**: Install `cloudinary` and `@google/genai` in `server/`; implement `server/src/services/ocrService.ts` to upload receipt images (max 5MB) and extract `{ vendor, date, totalAmount, currency, suggestedCategory, items }` with automatic mock fallback when keys are missing.
- [ ] **Task 4.2.2 — Receipt OCR Endpoint**: Implement `POST /api/ocr/receipt` with `multer` memory storage, MIME validation (`image/jpeg`, `image/png`, `image/webp`), and rate limiting; update `docs/API.md`.

### Subphase 4.3: Transactions Page (`/transactions`), Filters & OCR Modal
- [ ] **Task 4.3.1 — Receipt Uploader & AI Auto-Fill Component**: Build `ReceiptUploader.tsx` in `client/src/components/transactions/` with drag-and-drop preview, scanning indicator, and callback to populate transaction fields.
- [ ] **Task 4.3.2 — Add/Edit Transaction Modal & Custom Category Creator**: Build `TransactionModal.tsx` (Income, Expense, Transfer tabs + OCR integration + inline custom Category creation).
- [ ] **Task 4.3.3 — Transaction Filters Toolbar**: Build `FiltersBar.tsx` with debounced search input, date range filter, wallet filter, category filter, type filter, and sort selector.
- [ ] **Task 4.3.4 — Transactions Page & History Table**: Build `TransactionTable.tsx` (pagination, category icons, receipt lightbox preview, edit/delete actions) and assemble `/transactions` page.

---

## Phase 5: Dashboard Analytics, Budgets & Client-Side Exports

**Goal**: Bring together financial insights on the Dashboard (with AM/PM local greeting and Recharts), Monthly & Category Budgets with overspending alerts, and instant CSV/PDF exports.

### Subphase 5.1: Budget Management & Overspending Alerts (`/budgets`)
- [ ] **Task 5.1.1 — Budget CRUD & Monthly Progress Aggregation API**: Implement `GET /api/budgets?month=&year=` (calculates category spend in budget currency, percentage used, and alert tier: `'normal' | 'warning' | 'exceeded'`), `POST /api/budgets`, `PATCH /api/budgets/:id`, and `DELETE /api/budgets/:id`; update `docs/API.md`.
- [ ] **Task 5.1.2 — Budgets Page & Overspending Alert Cards**: Build `BudgetCard.tsx` (progress bar with `<80%` Emerald, `80–99%` Amber Warning, `100%+` Red Overspent alert badge), `BudgetModal.tsx`, and `/budgets` page.

### Subphase 5.2: Dashboard Aggregation API & Interactive UI (`/dashboard`)
- [ ] **Task 5.2.1 — Dashboard Summary API**: Implement `GET /api/dashboard/summary` returning Total Balance, Monthly Income, Monthly Expenses, Net Savings Rate, 6-month Income vs. Expense series, Category Expense breakdown, Recent Transactions, and active Budget Alerts; update `docs/API.md`.
- [ ] **Task 5.2.2 — Hydration-Safe Local AM/PM Greeting & Metric Cards**: Build `TimeGreeting.tsx` (`"Good morning/afternoon/evening, [Name]"` + live `12-hour AM/PM` local time) and `MetricCards.tsx`.
- [ ] **Task 5.2.3 — Recharts Cash Flow & Expense Breakdown Charts**: Build `CashFlowChart.tsx` (Income vs. Expense grouped bar chart) and `ExpenseBreakdownChart.tsx` (category donut chart) with dark/light mode tooltips.
- [ ] **Task 5.2.4 — Recent Transactions Widget & Dashboard Page Assembly**: Build `RecentTransactions.tsx` and assemble `/dashboard` with quick actions (`+ Add Transaction`, `Transfer`, `Scan Receipt`).

### Subphase 5.3: Client-Side CSV & PDF Financial Reports
- [ ] **Task 5.3.1 — Client-Side CSV & PDF Export Utilities**: Implement `client/src/lib/exportCsv.ts` (`papaparse`) and `client/src/lib/exportPdf.ts` (`jspdf` + `jspdf-autotable` executive statement with summary totals and transaction table) and wire export buttons into `/transactions` and `/dashboard`.

---

## Phase 6: Responsive Polish, Security Hardening & Deployment Readiness

**Goal**: Finalize UX polish, harden security & validation, verify full production builds, and prepare turnkey deployment configs for Vercel, Render, and MongoDB Atlas.

### Subphase 6.1: UX Polish, Landing Page & Empty States
- [ ] **Task 6.1.1 — Modern Landing Page & Empty/Loading Skeletons**: Build `client/src/app/page.tsx` landing page with feature highlights and auth CTAs, plus skeleton loaders and empty states across dashboard views.

### Subphase 6.2: Security Audit, Tests & Production Build Verification
- [ ] **Task 6.2.1 — API & Security Verification Suite**: Run security checklist (CORS, Helmet, Zod schemas, `userId` isolation in all Mongoose queries) and run `npm run build` in both `server/` and `client/` to verify zero production build errors.

### Subphase 6.3: Deployment Configuration & Final Documentation
- [ ] **Task 6.3.1 — Deployment Blueprints & `docs/DEPLOYMENT.md`**: Create `render.yaml`, verify Vercel config, and write `docs/DEPLOYMENT.md` with step-by-step instructions for MongoDB Atlas, Resend, Google OAuth, Cloudinary, Gemini API, Render, and Vercel.
