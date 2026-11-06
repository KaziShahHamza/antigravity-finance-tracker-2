# REST API Documentation (`docs/API.md`)

This document defines the REST API endpoints, schemas, authentication contracts, request/response formats, and error codes for **Antigravity Finance Tracker**.

---

## 1. General Principles & Conventions

- **Base URL**: `http://localhost:5000/api` (Local Dev) / `https://<render-service>.onrender.com/api` (Production)
- **Data Exchange Format**: JSON (`Content-Type: application/json`)
- **Standard Response Shape**:
  ```json
  {
    "success": true,
    "message": "Human readable confirmation message",
    "data": {}
  }
  ```
- **Standard Error Shape**:
  ```json
  {
    "success": false,
    "message": "Error description",
    "code": "ERROR_IDENTIFIER",
    "errors": {}
  }
  ```
- **Authorization Header**:
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```

---

## 2. Authentication API (`/api/auth`)

### 2.1 Register User

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Access**: Public (Subject to `authLimiter`: max 30 requests / 15m)
- **Request Body**:

  | Field             | Type     | Required | Description                                                      |
  | :---------------- | :------- | :------- | :--------------------------------------------------------------- |
  | `name`            | `string` | Yes      | Full name (2–100 characters)                                     |
  | `email`           | `string` | Yes      | Valid email address (lowercased, trimmed)                        |
  | `password`        | `string` | Yes      | Minimum 8 characters, must contain at least 1 letter, 1 number   |
  | `defaultCurrency` | `string` | No       | 3-letter currency code (e.g. `USD`, `BDT`, `EUR`, default `USD`) |

- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful. Please verify your email with the 6-digit code.",
    "email": "user@example.com"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` — Validation failed (invalid email format or weak password).
  - `409 Conflict` (`EMAIL_ALREADY_EXISTS`) — Email is already verified on another account.

---

### 2.2 Verify OTP

- **Method**: `POST`
- **Path**: `/api/auth/verify-otp`
- **Access**: Public (Subject to `otpLimiter`: max 10 requests / 15m)
- **Description**: Verifies the 6-digit OTP code, marks user as verified, idempotently seeds default categories and initial checking account, and returns access and refresh JWTs.
- **Request Body**:

  | Field   | Type     | Required | Description                                        |
  | :------ | :------- | :------- | :------------------------------------------------- |
  | `email` | `string` | Yes      | Registered email address                           |
  | `otp`   | `string` | Yes      | Exactly 6-digit numeric string (`000000`–`999999`) |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Account verified successfully.",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "65f1234567890abcdef12345",
      "name": "Alex Doe",
      "email": "alex@example.com",
      "defaultCurrency": "USD",
      "themePreference": "system",
      "avatarUrl": "",
      "isVerified": true
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (`OTP_EXPIRED`) — The code has exceeded its 15-minute validity.
  - `400 Bad Request` (`INVALID_OTP`) — The code does not match.
  - `400 Bad Request` (`ALREADY_VERIFIED`) — Account is already verified.
  - `404 Not Found` (`USER_NOT_FOUND`) — No account matches the provided email.

---

### 2.3 Resend OTP

- **Method**: `POST`
- **Path**: `/api/auth/resend-otp`
- **Access**: Public (Subject to `otpLimiter` + 60s cooldown)
- **Request Body**:

  | Field   | Type     | Required | Description              |
  | :------ | :------- | :------- | :----------------------- |
  | `email` | `string` | Yes      | Registered email address |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "A new verification code has been sent to your email."
  }
  ```
- **Error Responses**:
  - `404 Not Found` (`USER_NOT_FOUND`) — Account not found.
  - `400 Bad Request` (`ALREADY_VERIFIED`) — Account is already verified.
  - `429 Too Many Requests` (`RESEND_COOLDOWN`) — Cooldown active:
    ```json
    {
      "success": false,
      "message": "Please wait 45 seconds before requesting a new code.",
      "code": "RESEND_COOLDOWN",
      "retryAfterSeconds": 45
    }
    ```

---

### 2.4 Login

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Access**: Public (Subject to `authLimiter`)
- **Request Body**:

  | Field      | Type     | Required | Description      |
  | :--------- | :------- | :------- | :--------------- |
  | `email`    | `string` | Yes      | Registered email |
  | `password` | `string` | Yes      | User password    |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Sign in successful.",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "65f1234567890abcdef12345",
      "name": "Alex Doe",
      "email": "alex@example.com",
      "defaultCurrency": "USD",
      "themePreference": "system",
      "avatarUrl": "",
      "isVerified": true
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` (`INVALID_CREDENTIALS`) — Invalid email or password.
  - `403 Forbidden` (`EMAIL_NOT_VERIFIED`) — Unverified user; client should redirect to `/verify-otp`.

---

### 2.5 Refresh Session Token

- **Method**: `POST`
- **Path**: `/api/auth/refresh`
- **Access**: Public
- **Request Body**:

  | Field          | Type     | Required | Description          |
  | :------------- | :------- | :------- | :------------------- |
  | `refreshToken` | `string` | Yes      | Active refresh token |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` (`INVALID_REFRESH_TOKEN` / `REVOKED_REFRESH_TOKEN`) — Token expired, malformed, or revoked.

---

### 2.6 Logout

- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Access**: Optional Bearer token or `{ "refreshToken": "..." }` body
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

---

### 2.7 Forgot Password

- **Method**: `POST`
- **Path**: `/api/auth/forgot-password`
- **Access**: Public (Subject to `authLimiter` + 60s cooldown)
- **Request Body**:

  | Field   | Type     | Required | Description              |
  | :------ | :------- | :------- | :----------------------- |
  | `email` | `string` | Yes      | Registered email address |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "If an account exists with this email, a password reset code has been sent."
  }
  ```
- **Error Responses**:
  - `400 Bad Request` — Invalid email format.
  - `429 Too Many Requests` (`RESEND_COOLDOWN`) — Cooldown active before requesting a new code.

---

### 2.8 Reset Password

- **Method**: `POST`
- **Path**: `/api/auth/reset-password`
- **Access**: Public (Subject to `authLimiter`)
- **Request Body**:

  | Field         | Type     | Required | Description                                    |
  | :------------ | :------- | :------- | :--------------------------------------------- |
  | `email`       | `string` | Yes      | Registered email address                       |
  | `otp`         | `string` | Yes      | Exactly 6-digit numeric reset code             |
  | `newPassword` | `string` | Yes      | Min 8 characters, at least 1 letter & 1 number |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password reset successful. Please sign in with your new password."
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (`INVALID_OTP`) — Code does not match.
  - `400 Bad Request` (`OTP_EXPIRED`) — Code has expired.
  - `400 Bad Request` (`INVALID_RESET_CODE`) — No reset requested or code already used.

---

### 2.9 Google OAuth Sign-In

- **Method**: `POST`
- **Path**: `/api/auth/google`
- **Access**: Public (Subject to `authLimiter`)
- **Description**: Verifies Google Identity Services ID token, links or creates verified user, seeds defaults if first signup, and returns session tokens.
- **Request Body**:

  | Field        | Type     | Required | Description                               |
  | :----------- | :------- | :------- | :---------------------------------------- |
  | `credential` | `string` | Yes      | Google ID token (JWT) from GIS button/pop |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Google authentication successful.",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "65f1234567890abcdef12345",
      "name": "Alex Doe",
      "email": "alex@gmail.com",
      "defaultCurrency": "USD",
      "themePreference": "system",
      "avatarUrl": "https://lh3.googleusercontent.com/...",
      "isVerified": true
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` (`INVALID_GOOGLE_TOKEN`) — Invalid, tampered, or expired token.
  - `501 Not Implemented` (`GOOGLE_AUTH_NOT_CONFIGURED`) — Server missing `GOOGLE_CLIENT_ID`.

---

## 3. User Profile, Preferences & Demo Data API (`/api/users`)

All endpoints in this section require an authenticated user access token:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### 3.1 Get Current User Profile

- **Method**: `GET`
- **Path**: `/api/users/me`
- **Access**: Private (Authenticated)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "65f1234567890abcdef12345",
      "name": "Alex Doe",
      "email": "alex@example.com",
      "avatarUrl": "",
      "isVerified": true,
      "defaultCurrency": "USD",
      "monthlyBudgetLimit": 3000,
      "customExchangeRates": {
        "BDT": 130.5,
        "EUR": 0.92
      },
      "themePreference": "system",
      "createdAt": "2026-11-04T12:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` (`UNAUTHORIZED` / `TOKEN_EXPIRED`) — Missing or invalid Bearer token.
  - `404 Not Found` (`USER_NOT_FOUND`) — Account not found.

---

### 3.2 Update User Profile & Preferences

- **Method**: `PATCH`
- **Path**: `/api/users/profile`
- **Access**: Private (Authenticated)
- **Request Body**:

  | Field                 | Type                        | Required | Description                                                  |
  | :-------------------- | :-------------------------- | :------- | :----------------------------------------------------------- |
  | `name`                | `string`                    | No       | Full name (2–100 characters)                                 |
  | `defaultCurrency`     | `string`                    | No       | 3-letter ISO code (e.g. `USD`, `BDT`, `EUR`, `GBP`)          |
  | `monthlyBudgetLimit`  | `number \| null`            | No       | Optional monthly overall spending threshold ($\ge 0$)        |
  | `themePreference`     | `'light'\|'dark'\|'system'` | No       | UI color scheme preference                                   |
  | `customExchangeRates` | `Record<string, number>`    | No       | Map of target currency codes to custom user conversion rates |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "user": {
      "id": "65f1234567890abcdef12345",
      "name": "Alex Doe",
      "email": "alex@example.com",
      "avatarUrl": "",
      "isVerified": true,
      "defaultCurrency": "BDT",
      "monthlyBudgetLimit": 50000,
      "customExchangeRates": {
        "USD": 0.0083
      },
      "themePreference": "dark",
      "createdAt": "2026-11-04T12:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` — Validation failed (e.g., negative budget limit, invalid currency code length).
  - `401 Unauthorized` (`UNAUTHORIZED`) — Missing or invalid token.

---

### 3.3 Change Password

- **Method**: `PATCH`
- **Path**: `/api/users/password`
- **Access**: Private (Authenticated)
- **Description**: Verifies the current password, updates to a new bcrypt hash, and invalidates existing refresh tokens.
- **Request Body**:

  | Field             | Type     | Required | Description                                                    |
  | :---------------- | :------- | :------- | :------------------------------------------------------------- |
  | `currentPassword` | `string` | Yes      | Existing password                                              |
  | `newPassword`     | `string` | Yes      | Min 8 characters, at least 1 letter and 1 number (must differ) |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password updated successfully. Please sign in with your new password on other devices."
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (`INVALID_CURRENT_PASSWORD`) — Provided current password does not match.
  - `400 Bad Request` (`PASSWORD_NOT_SET`) — Google OAuth user without local password credentials.
  - `400 Bad Request` — Validation error (weak password or same as current password).
  - `401 Unauthorized` (`UNAUTHORIZED`) — Missing or invalid token.

---

### 3.4 Seed Demo Financial Data

- **Method**: `POST`
- **Path**: `/api/users/demo-data`
- **Access**: Private (Authenticated)
- **Description**: Populates realistic sample Cash, Bank, bKash, and Credit Card accounts, monthly budgets, and 12+ categorized transactions for the authenticated user.
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Demo financial data loaded successfully.",
    "data": {
      "accountsCreated": 4,
      "budgetsCreated": 4,
      "transactionsCreated": 12
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` (`UNAUTHORIZED`) — Missing or invalid token.

---

## 4. Exchange Rates API (`/api/rates`)

### 4.1 Get Multi-Currency Exchange Rates

- **Method**: `GET`
- **Path**: `/api/rates`
- **Access**: Public / Optional Authentication (merges user `customExchangeRates` if authenticated)
- **Description**: Returns foreign exchange rates against USD, cached for 24h from `open.er-api.com` with baseline fallback rates when offline.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "baseCurrency": "USD",
      "rates": {
        "USD": 1.0,
        "BDT": 110.0,
        "EUR": 0.92,
        "GBP": 0.79,
        "INR": 83.0,
        "CAD": 1.36,
        "AUD": 1.52,
        "JPY": 155.0
      },
      "fetchedAt": "2026-11-06T12:00:00.000Z",
      "isFallback": false
    }
  }
  ```

---

## 5. Accounts & Wallets API (`/api/accounts`)

### 5.1 List Accounts & Total Balance Summary

- **Method**: `GET`
- **Path**: `/api/accounts`
- **Access**: Private (Authenticated)
- **Query Parameters**:
  - `includeArchived` (`boolean`, optional, default: `false`)
- **Description**: Fetches all user wallets/accounts, with each account balance converted to the user's `defaultCurrency` and an aggregated `totalBalance`.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "accounts": [
        {
          "id": "64f1a2b3c4d5e6f7a8b9c0d1",
          "name": "Main Checking",
          "type": "bank",
          "balance": 1500.0,
          "currency": "USD",
          "convertedBalance": 1500.0,
          "color": "#10b981",
          "icon": "Building",
          "isArchived": false,
          "createdAt": "2026-11-06T12:00:00.000Z",
          "updatedAt": "2026-11-06T12:00:00.000Z"
        }
      ],
      "totalBalance": 1500.0,
      "currency": "USD"
    }
  }
  ```

### 5.2 Get Account by ID

- **Method**: `GET`
- **Path**: `/api/accounts/:id`
- **Access**: Private (Authenticated)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "bKash Personal",
      "type": "bkash",
      "balance": 12500.0,
      "currency": "BDT",
      "color": "#e11d48",
      "icon": "Smartphone",
      "isArchived": false
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found` — Account not found or unauthorized.

### 5.3 Create Account

- **Method**: `POST`
- **Path**: `/api/accounts`
- **Access**: Private (Authenticated)
- **Request Body**:

  | Field      | Type     | Required | Description                                                     |
  | :--------- | :------- | :------- | :-------------------------------------------------------------- |
  | `name`     | `string` | Yes      | 1–100 characters                                                |
  | `type`     | `string` | Yes      | `'cash' \| 'bank' \| 'bkash' \| 'nagad' \| 'credit' \| 'other'` |
  | `balance`  | `number` | No       | Initial balance (default 0)                                     |
  | `currency` | `string` | No       | 3-letter currency code (default `'USD'`)                        |
  | `color`    | `string` | No       | Hex color code (default `'#10b981'`)                            |
  | `icon`     | `string` | No       | Icon identifier (default `'Wallet'`)                            |

- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Nagad Wallet",
      "type": "nagad",
      "balance": 5000.0,
      "currency": "BDT",
      "color": "#ea580c",
      "icon": "Smartphone",
      "isArchived": false
    }
  }
  ```

### 5.4 Update Account

- **Method**: `PATCH`
- **Path**: `/api/accounts/:id`
- **Access**: Private (Authenticated)
- **Request Body**: All fields in `POST /api/accounts` are optional, plus `isArchived` (`boolean`).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Account updated successfully",
    "data": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Updated Wallet",
      "balance": 6000.0
    }
  }
  ```

### 5.5 Delete or Archive Account

- **Method**: `DELETE`
- **Path**: `/api/accounts/:id`
- **Access**: Private (Authenticated)
- **Description**: Hard-deletes account if no transactions exist. If transaction history exists, safely archives it (`isArchived: true`) to preserve audit trail.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Account deleted successfully.",
    "data": { "archived": false }
  }
  ```

### 5.6 Inter-Account Fund Transfer

- **Method**: `POST`
- **Path**: `/api/accounts/transfer`
- **Access**: Private (Authenticated)
- **Description**: Atomically deducts source wallet, performs cross-currency conversion (or uses manual destination amount override), credits destination wallet, and creates a linked `transfer` transaction.
- **Request Body**:

  | Field               | Type     | Required | Description                                             |
  | :------------------ | :------- | :------- | :------------------------------------------------------ |
  | `fromAccountId`     | `string` | Yes      | 24-character ObjectId of source wallet                  |
  | `toAccountId`       | `string` | Yes      | 24-character ObjectId of destination wallet             |
  | `amount`            | `number` | Yes      | Positive amount in source currency                      |
  | `destinationAmount` | `number` | No       | Optional manual override amount in destination currency |
  | `description`       | `string` | No       | Optional description                                    |
  | `date`              | `string` | No       | ISO Date string (defaults to now)                       |

- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Transfer completed successfully",
    "data": {
      "transaction": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d9",
        "type": "transfer",
        "amount": 100.0,
        "currency": "USD",
        "destinationAmount": 11000.0,
        "destinationCurrency": "BDT"
      },
      "fromAccount": { "id": "...", "balance": 900.0 },
      "toAccount": { "id": "...", "balance": 21000.0 }
    }
  }
  ```

---

## 6. Categories API (`/api/categories`)

### 6.1 List Categories

- **Method**: `GET`
- **Path**: `/api/categories`
- **Access**: Private (Authenticated)
- **Query Parameters**:
  - `type` (`'income' | 'expense'`, optional): Filters categories by type.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65f123...",
        "name": "Food & Dining",
        "type": "expense",
        "icon": "Utensils",
        "color": "#f97316",
        "isDefault": true
      }
    ]
  }
  ```

### 6.2 Create Category

- **Method**: `POST`
- **Path**: `/api/categories`
- **Access**: Private (Authenticated)
- **Request Body**:
  | Field   | Type     | Required | Description                                    |
  | :------ | :------- | :------- | :--------------------------------------------- |
  | `name`  | `string` | Yes      | 1–100 characters, unique per type for the user |
  | `type`  | `string` | Yes      | `'income' \| 'expense'`                        |
  | `icon`  | `string` | No       | Lucide icon name (default: `'Tag'`)            |
  | `color` | `string` | No       | Hex color code (default: `'#64748b'`)          |
- **Response (201 Created)**

### 6.3 Update Category

- **Method**: `PATCH`
- **Path**: `/api/categories/:id`
- **Access**: Private (Authenticated)
- **Request Body**: `name` (string), `icon` (string), `color` (string).
- **Response (200 OK)**

### 6.4 Delete Category

- **Method**: `DELETE`
- **Path**: `/api/categories/:id`
- **Access**: Private (Authenticated)
- **Rules**: System default categories (`isDefault: true`) cannot be deleted (`400 Bad Request`). Categories with linked transactions cannot be deleted (`400 Bad Request`).
- **Response (200 OK)**

---

## 7. Transactions API (`/api/transactions`)

### 7.1 List & Filter Transactions

- **Method**: `GET`
- **Path**: `/api/transactions`
- **Access**: Private (Authenticated)
- **Query Parameters**:
  - `search` (string): Search vendor or description (case-insensitive).
  - `type` (`'income' | 'expense' | 'transfer'`): Filter by transaction type.
  - `accountId` (ObjectId): Filter transactions involving this wallet.
  - `categoryId` (ObjectId): Filter transactions by category.
  - `startDate` (ISO string): Transactions on or after date.
  - `endDate` (ISO string): Transactions on or before date.
  - `sortBy` (`'date' | 'amount' | 'convertedAmount' | 'createdAt'`): Default `'date'`.
  - `sortOrder` (`'asc' | 'desc'`): Default `'desc'`.
  - `page` (number): Page index (default: 1).
  - `limit` (number): Items per page (default: 20, max: 100).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "65f123...",
        "type": "expense",
        "amount": 24.5,
        "currency": "USD",
        "convertedAmount": 24.5,
        "description": "Starbucks Coffee",
        "vendor": "Starbucks",
        "date": "2026-11-06T10:00:00.000Z",
        "accountId": { "_id": "...", "name": "Checking", "currency": "USD" },
        "categoryId": { "_id": "...", "name": "Food & Dining", "icon": "Utensils" }
      }
    ],
    "pagination": {
      "totalCount": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "hasMore": true
    }
  }
  ```

### 7.2 Get Transaction by ID

- **Method**: `GET`
- **Path**: `/api/transactions/:id`
- **Access**: Private (Authenticated)

### 7.3 Create Transaction

- **Method**: `POST`
- **Path**: `/api/transactions`
- **Access**: Private (Authenticated)
- **Description**: Records income, expense, or transfer and atomically adjusts account balances.
- **Request Body**:
  | Field                  | Type     | Required     | Description                                      |
  | :--------------------- | :------- | :----------- | :----------------------------------------------- |
  | `accountId`            | `string` | Yes          | Source account ObjectId                          |
  | `type`                 | `string` | Yes          | `'income' \| 'expense' \| 'transfer'`            |
  | `amount`               | `number` | Yes          | Positive number                                  |
  | `currency`             | `string` | No           | 3-letter currency (defaults to account currency) |
  | `destinationAccountId` | `string` | For transfer | Destination account ObjectId                     |
  | `destinationAmount`    | `number` | No           | Overridden destination amount for transfer       |
  | `categoryId`           | `string` | No           | Category ObjectId                                |
  | `date`                 | `string` | No           | ISO Date string (defaults to now)                |
  | `description`          | `string` | Yes          | 1–255 characters                                 |
  | `vendor`               | `string` | No           | Merchant name (max 100 characters)               |
  | `receiptUrl`           | `string` | No           | Receipt image URL                                |
  | `receiptOcrData`       | `object` | No           | Extracted OCR structured payload                 |
- **Response (201 Created)**

### 7.4 Update Transaction (with Prior Balance Reversal)

- **Method**: `PATCH`
- **Path**: `/api/transactions/:id`
- **Access**: Private (Authenticated)
- **Description**: Reverses the previous balance impact on old accounts, then applies the updated amount, type, and account balances atomically.
- **Response (200 OK)**

### 7.5 Delete Transaction (with Balance Reversal)

- **Method**: `DELETE`
- **Path**: `/api/transactions/:id`
- **Access**: Private (Authenticated)
- **Description**: Reverses the transaction's balance impact on affected accounts and removes the transaction record.
- **Response (200 OK)**

---

## 8. Receipt OCR API (`/api/ocr`)

### 8.1 Scan & Extract Receipt Data

- **Method**: `POST`
- **Path**: `/api/ocr/receipt`
- **Access**: Private (Authenticated, subject to `ocrLimiter`: max 20 scans / 15m)
- **Content-Type**: `multipart/form-data`
- **Request Parameters**:
  - `receipt`: Image file (`image/jpeg`, `image/png`, or `image/webp`), max `5MB` (enforced via in-memory multer).
- **Description**: Uploads image buffer to Cloudinary (if configured) or generates a data URI fallback, and processes receipt via Gemini Vision OCR (or returns deterministic mock fallback when `GEMINI_API_KEY` is omitted).
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Receipt parsed successfully",
    "data": {
      "vendor": "Supermarket Fresh Mart",
      "date": "2026-11-06",
      "totalAmount": 47.85,
      "currency": "USD",
      "suggestedCategory": "Groceries",
      "items": [
        { "name": "Organic Milk 1 Gallon", "price": 4.99, "quantity": 1 },
        { "name": "Whole Wheat Bread", "price": 3.49, "quantity": 1 }
      ],
      "receiptUrl": "https://...",
      "isMock": false
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` — No file uploaded or unsupported file format.
  - `413 Payload Too Large` — File exceeds 5MB memory guardrail.
  - `429 Too Many Requests` — Rate limit exceeded.
