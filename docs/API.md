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
