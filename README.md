# Day Status Tracker

A full-stack web application designed to record, track, and visualize milestones and daily status updates across all 365 days of the year.

---

## 🏗 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React, [Tailwind CSS](https://tailwindcss.com/), Lucide Icons
- **Backend**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: JWT-based (short-lived in-memory access token + `httpOnly` refresh cookie)
- **Validation & Rate Limiting**: [Zod](https://zod.dev/) schema validation, [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)

---

## 📁 Monorepo Structure

```text
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma schema (users and day_status tables)
│   │   └── seed.ts             # Demo user and sample status milestone seed script
│   ├── src/
│   │   ├── config/env.ts       # Typed environment configuration
│   │   ├── controllers/        # authController & dayController
│   │   ├── middlewares/        # auth, rateLimiter, errorHandler
│   │   ├── routes/             # authRoutes & dayRoutes
│   │   ├── utils/              # dayValidator (month/day boundary logic)
│   │   ├── lib/prisma.ts       # Singleton PrismaClient
│   │   └── index.ts            # Express server initialization
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout with AuthProvider & Navbar
│   │   │   ├── page.tsx        # Day Status Viewer (Public Calendar landing page)
│   │   │   ├── dashboard/      # Data Input Component (12×31 Grid, protected route)
│   │   │   ├── login/          # User login page
│   │   │   └── register/       # User registration page
│   │   ├── components/         # Navbar, StatusEditModal
│   │   ├── context/            # AuthContext (in-memory access token + silent refresh)
│   │   ├── lib/api.ts          # API client with credentials & error handling
│   │   └── types/index.ts      # Shared frontend TypeScript interfaces
│   ├── .env.local.example
│   └── package.json
│
├── docker-compose.yml          # Local PostgreSQL container service
├── package.json                # Root package with monorepo scripts
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **PostgreSQL**: Local PostgreSQL instance or [Docker](https://www.docker.com/)

---

### 2. Environment Variables Setup

#### Backend (`/backend/.env`)
Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```
Default configuration values:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/day_status_tracker?schema=public"
JWT_ACCESS_SECRET="day_status_tracker_access_secret_key_123456789"
JWT_REFRESH_SECRET="day_status_tracker_refresh_secret_key_987654321"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
```

#### Frontend (`/frontend/.env.local`)
Copy the example environment file:
```bash
cp frontend/.env.local.example frontend/.env.local
```
Configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 3. Database Setup (PostgreSQL)

The project is currently connected to **Supabase PostgreSQL** via Prisma ORM:
- **Provider**: PostgreSQL
- **Schema & Tables**: `users` and `day_status` tables with unique constraint `@@unique([month, day])`
- **Connection**: Managed via `DATABASE_URL` in `backend/.env` using the IPv4-compatible pooler connection.

#### Run Database Migrations:
```bash
npm run db:push
```

#### Seed Initial Sample Data:
```bash
npm run db:seed
```
From the root directory or inside `/backend`:
```bash
# Push database schema or run migration
npm run db:push
# or from backend:
# cd backend && npx prisma db push
```

#### Seed Initial Sample Data (Optional):
Populate a demo user (`demo@example.com` / `password123`) and initial sample day milestones:
```bash
npm run db:seed
# or from backend:
# cd backend && npm run seed
```

---

### 4. Running Locally

You can run both services directly from the root monorepo scripts or individually:

#### Running from Monorepo Root:
```bash
# Terminal 1 - Start Backend API (Port 5000)
npm run dev:backend

# Terminal 2 - Start Frontend Next.js App (Port 3000)
npm run dev:frontend
```

#### Running Individually:
```bash
# Start Backend
cd backend
npm install
npm run dev
# Running on http://localhost:5000

# Start Frontend
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 API Documentation

**Base URL**: `http://localhost:5000/api`

### Authentication Endpoints (`/api/auth`)
*Rate limited to 100 requests per 15 minutes.*

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Creates a new user with bcrypt password hash, issues tokens. |
| `POST` | `/api/auth/login` | No | Verifies credentials, returns access token + sets `httpOnly` refresh cookie. |
| `POST` | `/api/auth/refresh` | No (Cookie) | Issues fresh access token using the `refreshToken` cookie. |
| `POST` | `/api/auth/logout` | No | Clears the `refreshToken` cookie. |

#### `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "c1f7b0df-...",
      "email": "user@example.com"
    },
    "accessToken": "eyJhbGciOi..."
  }
  ```

#### `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "c1f7b0df-...",
      "email": "user@example.com"
    },
    "accessToken": "eyJhbGciOi..."
  }
  ```
  *Sets cookie `refreshToken=<token>; HttpOnly; SameSite=Lax; Path=/`.*

---

### Day Status Endpoints (`/api/days`)

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/days` | No (Public) | Returns all recorded day entries. |
| `GET` | `/api/days/:month/:day` | No (Public) | Returns status for one specific day (404 if not found). |
| `PUT` | `/api/days/:month/:day` | **Yes (JWT)** | Upserts status text and color for that day. |

#### `GET /api/days`
- **Response `200 OK`**:
  ```json
  {
    "count": 1,
    "days": [
      {
        "id": 1,
        "month": 1,
        "day": 15,
        "status_text": "Q1 Project Kickoff meeting",
        "status_color": "#3b82f6",
        "updated_by": {
          "id": "c1f7b0df-...",
          "email": "user@example.com"
        },
        "updated_at": "2026-10-04T05:30:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/days/:month/:day`
- **Example**: `GET /api/days/2/14`
- **Response `200 OK`**:
  ```json
  {
    "id": 2,
    "month": 2,
    "day": 14,
    "status_text": "Sprint 3 retrospective completed",
    "status_color": "#a855f7",
    "updated_by": {
      "id": "c1f7b0df-...",
      "email": "user@example.com"
    },
    "updated_at": "2026-10-04T05:40:00.000Z"
  }
  ```
- **Response `404 Not Found`**:
  ```json
  {
    "error": "No status set for month 2, day 14.",
    "month": 2,
    "day": 14
  }
  ```

#### `PUT /api/days/:month/:day` (Protected)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Example**: `PUT /api/days/4/12`
- **Request Body**:
  ```json
  {
    "status_text": "Quarterly code freeze and security patch deployment",
    "status_color": "#f43f5e"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Day status saved successfully",
    "data": {
      "id": 3,
      "month": 4,
      "day": 12,
      "status_text": "Quarterly code freeze and security patch deployment",
      "status_color": "#f43f5e",
      "updated_by": {
        "id": "c1f7b0df-...",
        "email": "user@example.com"
      },
      "updated_at": "2026-10-04T05:45:00.000Z"
    }
  }
  ```
- **Response `400 Bad Request`** (e.g. invalid day like April 31):
  ```json
  {
    "error": "Invalid day for April (month 4). Day must be between 1 and 30."
  }
  ```
- **Response `401 Unauthorized`** (missing or expired JWT):
  ```json
  {
    "error": "Unauthorized: Access token is invalid or expired"
  }
  ```

---

## 💡 Design Decisions & Assumptions

### 1. In-Memory Access Token with httpOnly Refresh Cookie
- **Security Rationale**: Storing JWT access tokens in `localStorage` or `sessionStorage` exposes tokens to Cross-Site Scripting (XSS) attacks. By storing the short-lived access token strictly in React state/memory and storing the long-lived refresh token in a browser-managed `httpOnly; SameSite=Lax; Secure` cookie, malicious client-side scripts cannot extract credentials.
- **Silent Re-authentication**: When the user opens or refreshes the page, `AuthContext` calls `/api/auth/refresh`. If the refresh cookie is valid, a new access token is placed in memory without requiring the user to re-enter their credentials.

### 2. Month and Day Boundaries Validation
- **Days Per Month**:
  - January, March, May, July, August, October, December: **31 days**
  - April, June, September, November: **30 days**
  - February: Capped strictly at **28 days** (per project specification: no leap-year logic needed).
- **Backend & Database Integrity**:
  - `validateMonthAndDay` utility rejects invalid dates (e.g. month 13, month 0, April 31, February 30) before query execution.
  - The PostgreSQL `day_status` table enforces `@@unique([month, day])` so duplicate entries for any day cannot exist.
- **Frontend 12×31 Grid**:
  - Invalid calendar day cells (e.g., February 29-31, April 31) are rendered with disabled patterned backgrounds (`.disabled-day-pattern`), cursor `not-allowed`, and prevented from triggering the edit modal.

### 3. Centralized Error Handling & Validation
- Express uses Zod schema validation for input parsing.
- Centralized error handler captures:
  - `ZodError` -> Returns `400` with detailed field-level issues.
  - `PrismaClientKnownRequestError` -> Handles unique constraints (`P2002`) and missing records (`P2025`).
  - Unhandled exceptions -> Returns consistent JSON responses without leaking stack traces in production.

### 4. Known Limitations & Extensibility
- **February 29 (Leap Year)**: February is statically capped at 28 days as specified. In a multi-year context, leap-year calculations (`year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)`) can be introduced by adding an optional `year` column.
- **Single Public Status per Day**: Currently, day statuses are shared globally (any authenticated team member can update the status for a given calendar day). For multi-tenant or private user-specific calendars, the unique constraint can be updated to `@@unique([userId, month, day])`.

---

## 🛠 Available Scripts

### Root Directory
- `npm run dev:backend` — Start backend Express API in dev mode (`tsx watch`)
- `npm run dev:frontend` — Start frontend Next.js dev server
- `npm run build:backend` — Compile backend TypeScript to `backend/dist`
- `npm run build:frontend` — Build Next.js production bundle
- `npm run db:migrate` — Run Prisma migrations
- `npm run db:push` — Sync Prisma schema with database
- `npm run db:seed` — Populate sample demo data
- `npm run docker:up` — Start local PostgreSQL via Docker
- `npm run docker:down` — Stop local PostgreSQL container

### Backend (`/backend`)
- `npm run dev` — Run API with hot reload
- `npm run build` — Compile TypeScript
- `npm start` — Run compiled production build (`dist/index.js`)
- `npm run seed` — Run Prisma seed script

### Frontend (`/frontend`)
- `npm run dev` — Run Next.js App Router dev server
- `npm run build` — Build production bundle
- `npm start` — Run production server
- `npm run lint` — Run ESLint check
