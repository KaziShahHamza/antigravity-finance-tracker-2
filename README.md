# Antigravity Finance Tracker

A modern, full-stack, multi-currency personal finance tracker built with **Next.js 15 (App Router)**, **Express**, **MongoDB Atlas (Mongoose)**, **TypeScript**, and **plain Tailwind CSS**. Designed for cross-origin production deployment on **Vercel** (frontend) and **Render** (backend) using 100% free-tier compatible external services.

---

## Key Features

### 1. Authentication & Security

- **Email & Password Registration**: Secure `bcryptjs` hashing with immediate **6-digit OTP email verification** via **Resend** (15-minute expiry, 60-second resend cooldown).
- **Google Sign-In**: Seamless popup sign-in via **Google Identity Services (GIS)** verified on the backend with `google-auth-library`.
- **Forgot & Reset Password**: Time-limited password reset codes sent via email.
- **Cross-Origin JWT Sessions**: Access token (`Authorization: Bearer`) + Refresh token rotation tailored for Vercel + Render deployments.
- **User Profile & Settings**: Manage display name, password, default display currency, light/dark/system theme, and optional demo data seeding.

### 2. Dashboard & Visual Analytics

- **Live Local Greeting**: Dynamic greeting (_"Good morning / afternoon / evening"_) paired with a real-time **12-hour AM/PM local clock**.
- **Financial Summary Cards**: Total Balance (converted to your default currency), Monthly Income, Monthly Expenses, and Net Savings Rate.
- **Interactive Charts (Recharts)**: Monthly Income vs. Expense comparison and Category Expense Breakdown donut chart.
- **Recent Transactions & Budget Alerts**: Quick overview of your latest activity and active overspending warnings.
- **Light / Dark Mode**: Instant, zero-flicker theme switching powered by Tailwind CSS and `next-themes`.

### 3. Account & Wallet Management

- **Multiple Wallet Types**: Native support for **Cash**, **Bank**, **bKash**, **Nagad**, **Credit Card**, and **Custom Wallets** with custom colors and icons.
- **Live Balances**: Automatic balance updates across all transaction creations, edits, and deletions.
- **Inter-Account Transfers**: Atomic transfers between wallets—including automatic cross-currency conversion when source and destination currencies differ.

### 4. Transaction Management & AI Receipt OCR

- **Full CRUD**: Track Income, Expenses, and Transfers with notes, dates, categories, and receipt attachments.
- **System & Custom Categories**: Pre-seeded essential categories (Food, Rent, Shopping, Salary, Transport, etc.) plus custom user categories.
- **Search, Filter & Sort**: Filter by date range, wallet, category, or transaction type; search descriptions/vendors; sort by date or amount.
- **Receipt Upload & AI OCR**: Upload receipt images to **Cloudinary** and automatically extract vendor, date, total amount, currency, and suggested category via **Google Gemini Vision API** for 1-click form auto-fill.

### 5. Budget Management & Alerts

- **Monthly Spending Targets**: Set an overall monthly budget and category-specific limits.
- **Live Progress Tracking**: Visual progress bars displaying spent vs. remaining amounts.
- **Tiered Overspending Alerts**:
  - **Normal** (`< 80%`): Healthy status
  - **Warning** (`80% – 99%`): Approaching limit badge
  - **Overspent** (`100%+`): Critical alert badge & banner

### 6. Multi-Currency & Exports

- **Multi-Currency Support**: Assign distinct ISO currencies (`USD`, `BDT`, `EUR`, `GBP`, `INR`, etc.) per wallet while viewing unified totals in your preferred display currency using daily cached rates from `open.er-api.com` (with manual override support).
- **Client-Side CSV & PDF Exports**: Instant **CSV** (`papaparse`) and formatted **PDF statements** (`jspdf` + `jspdf-autotable`) generated in the browser—zero memory overhead on Render's free tier.

---

## Tech Stack

| Layer                    | Technologies                                                                                                                                       |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend (`/client`)** | Next.js 15 (App Router), React, TypeScript, Plain Tailwind CSS, `next-themes`, `lucide-react`, `recharts`, `jspdf`, `jspdf-autotable`, `papaparse` |
| **Backend (`/server`)**  | Node.js, Express, TypeScript (`tsx` / `tsc`), Mongoose, `zod`, `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`                          |
| **Database**             | MongoDB Atlas (M0 Free Tier)                                                                                                                       |
| **External APIs**        | Resend (Email OTP/Reset), Google Identity Services (OAuth), Cloudinary (Receipts), Google Gemini Vision API (OCR), Open Exchange Rates API         |
| **Deployment**           | Vercel (`client/`), Render Web Service (`server/`)                                                                                                 |

---

## Repository Structure

```text
antigravity-finance-tracker/
├── client/                  # Next.js 15 App Router frontend (deploys to Vercel)
├── server/                  # Express + TypeScript REST API (deploys to Render)
├── docs/
│   ├── ARCHITECTURE.md      # Approved system design, schemas & workflows
│   ├── PROJECT_PLAN.md      # Atomic phased & subphased implementation roadmap
│   ├── QUALITY.md           # Testing, security, code review & CI workflow
│   ├── DB.md                # Mongoose schema & index reference (created in Phase 1)
│   ├── API.md               # REST API endpoint specification (created in Phase 2)
│   └── DEPLOYMENT.md        # Vercel, Render & Atlas deployment guide (created in Phase 6)
├── AGENTS.md                # Workspace rules & conventions for AI coding agents
└── README.md                # Project overview & quickstart guide
```

---

## Local Development & Mock Fallbacks

Built-in **local development fallbacks** allow the app to run immediately even before configuring third-party API keys:

- **No `RESEND_API_KEY`**: Verification and password-reset OTP codes are printed directly to the `server` console.
- **No `GEMINI_API_KEY` / `CLOUDINARY_*`**: Receipt upload & OCR returns realistic structured mock receipt data so you can test the full UI flow offline.
- **Exchange Rates**: Cached daily in MongoDB with static baseline fallback rates if offline.

### Getting Started (Once Scaffolded in Phase 1)

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```
2. **Configure environment variables**:
   - Copy `server/.env.example` to `server/.env` (set `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`).
   - Copy `client/.env.example` to `client/.env.local` (set `NEXT_PUBLIC_API_URL=http://localhost:5000/api`).
3. **Start both servers in development mode**:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

---

## Documentation

- [Architecture Specification](docs/ARCHITECTURE.md)
- [Phased Project Plan](docs/PROJECT_PLAN.md)
- [Quality, Testing & Review Workflow](docs/QUALITY.md)
- [Database & Mongoose Schema Reference](docs/DB.md)
- [REST API Endpoint Documentation](docs/API.md)
- [Production Deployment Guide (Vercel + Render + Atlas)](docs/DEPLOYMENT.md)
- [Agent Guidelines](AGENTS.md)
