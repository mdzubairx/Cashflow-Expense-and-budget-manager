# Cashflow: Expense Tracker & Budget Management System

A full-stack financial management platform designed to track expenses, set monthly category budgets, monitor spending habits, and export detailed monthly and yearly financial reports.

- **Frontend:** React 19 + TypeScript (Vite), React Router, Axios, Recharts
- **Backend:** Node.js + Express 5 + TypeScript, Zod validation, JWT authentication with rotating refresh tokens
- **Architecture:** Controller-Service-Data pattern with type safety
- **Database:** PostgreSQL (raw SQL with versioned migrations, relational constraints, performance indexing, and stored functions)
- **Testing:** Vitest + Supertest (API unit & integration tests), Vitest + React Testing Library (UI unit tests)

---

## Core Features & Assessment Requirements

| Module | Features & Capabilities |
| --- | --- |
| **Authentication** | Secure JWT-based authentication with 15-minute access tokens and 7-day rotating refresh tokens stored in `httpOnly`, `SameSite` cookies. Full session persistence across page reloads, logout session revocation, and reuse-detection protection. |
| **Demo Sandbox** | *Explore with demo data* feature grants instant access to an isolated personal sandbox account seeded with 6 months of historical transactions and budget allocations. (Automatically purged after 24 hours). |
| **Financial Dashboard** | Real-time overview of monthly total expenditures, allocated budgets, remaining allowance, over-limit alerts, and month-over-month percent variance. Includes category distribution donut charts, 6-month historical trend bar charts, and recent transaction feeds. |
| **Expense Management** | Full CRUD operations (create, view, update, delete). Comprehensive multi-criteria filtering by **date range**, **category**, and **minimum/maximum amount**, plus description search and sorting (by date or amount) with server-side pagination. |
| **Budget Control** | Set, edit, and delete **monthly limits per category**. Dynamic visual progress bars trigger warning states at 80% usage and alert states when over limit. Includes one-click budget cloning from the previous month. |
| **Category System** | Seeded with standard default financial categories (Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Health, Education, Other) with customizable names and color palettes. Referential integrity prevents accidental deletion of categories linked to active expenses. |
| **Reporting & Export** | Generate monthly and annual expenditure summaries. Export data directly to **CSV** or multi-sheet **Excel (.xlsx)** workbooks containing Summary, Category Breakdown, Daily Breakdown, and Transaction Details. |
| **Responsive UI** | Mobile and desktop optimized interface. Desktop includes an executive dark-slate navigation sidebar; mobile adapts with a top bar, bottom tab navigation bar, card-based transaction layouts, and drawer dialogs. |

---

## Quick Start & Setup Guide

### Prerequisites

- **Node.js**: `20+` (tested on Node 22 & 24)
- **PostgreSQL**: `14+` (local installation, or cloud Postgres such as Supabase, Neon, or Render)

---

### 1. Database Setup

Create a PostgreSQL user and database (e.g., using `psql` or your Postgres GUI like pgAdmin):

```sql
CREATE USER expense WITH PASSWORD 'expense';
CREATE DATABASE expense_tracker OWNER expense;
CREATE DATABASE expense_tracker_test OWNER expense;
```

*(Note: The database user needs permission to create extensions, as migrations enable `pgcrypto` for UUID generation).*

---

### 2. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *(Update `DATABASE_URL` in `.env` if your Postgres credentials differ: `postgresql://expense:expense@localhost:5432/expense_tracker`)*

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run database migrations (creates schema, indexes, and stored procedures):
   ```bash
   npm run migrate
   ```

5. *(Optional)* Seed initial demo data (seeds an account with 6 months of realistic transactions):
   ```bash
   npm run seed
   ```

6. Start the development API server:
   ```bash
   npm run dev
   ```
   The API will be running at `http://localhost:4000`.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Sign in with the seeded demo user:
   - **Email:** `demo@example.com`
   - **Password:** `Demo@1234`
   *(Or click "Explore with demo data" to create an instant sandbox account, or register a new account).*

> **Note on API proxying:** In local development, Vite automatically proxies `/api` requests to `http://localhost:4000`. This ensures cookies and authorization headers work seamlessly across ports without complex CORS configuration.

---

## Testing & Quality Assurance

Both frontend and backend include automated test suites:

```bash
# Run backend unit and integration test suite:
cd backend
npm test

# Run frontend React component and hook test suite:
cd frontend
npm test
```

### Test Coverage Highlights

- **Backend Unit Tests:** Validation schemas, token utilities, SQL parameter builders, date arithmetic, and AppError HTTP status mappers.
- **Backend Integration Tests:** End-to-end API flows with PostgreSQL (User registration, login, token rotation, token family revocation upon reuse, expense CRUD & filters, budget CRUD & uniqueness constraints, data isolation between accounts, and CSV/Excel report generation).
- **Frontend Tests:** Form validation, authentication context, auto-refresh token interceptors with deduplication, and custom React hooks.

---

## Project Structure & Architecture

```
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express application configuration & routing
│   │   ├── server.ts              # HTTP server bootstrap & migration check
│   │   ├── config/                # Validated environment configuration (Zod)
│   │   ├── db/
│   │   │   ├── pool.ts            # PostgreSQL connection pool & transaction manager
│   │   │   ├── migrate.ts         # Migration runner with advisory locks
│   │   │   ├── seed.ts            # Seed script for demo accounts
│   │   │   └── migrations/        # Versioned raw SQL schema & stored procedures
│   │   ├── middleware/            # JWT auth, Zod validation, and centralized error handler
│   │   ├── modules/               # Controller-Service architecture by domain
│   │   │   ├── auth/              # Auth controller, router, schemas, and service
│   │   │   ├── budgets/           # Budgets controller, router, schemas, and service
│   │   │   ├── categories/        # Categories controller, router, schemas, and service
│   │   │   ├── dashboard/         # Dashboard controller, router, and aggregation service
│   │   │   ├── expenses/          # Expenses controller, router, schemas, and service
│   │   │   └── reports/           # Reports controller, router, CSV/Excel exporters
│   │   └── utils/                 # AppError, JWT/refresh tokens, dates, shared schemas
│   └── tests/                     # Unit and integration test suites
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # Axios client with interceptors & typed API services
│   │   ├── context/               # AuthContext & Toast notification state
│   │   ├── hooks/                 # Custom hooks (useAuth, useAsync, useCategories, etc.)
│   │   ├── components/
│   │   │   ├── layout/            # AppLayout (Sidebar + Mobile Topbar/Tabbar)
│   │   │   ├── ui/                # StatCard, Modal, MonthPicker, ProgressBar, Icon
│   │   │   ├── expenses/          # ExpenseTable, ExpenseForm, ExpenseFilters
│   │   │   ├── budgets/           # BudgetForm, BudgetCard, CategoryBudgetProgress
│   │   │   └── charts/            # Recharts CategoryDonut & TotalsBarChart
│   │   ├── pages/                 # Dashboard, Expenses, Budgets, Reports, Login, Register
│   │   ├── types/                 # TypeScript entity and DTO definitions
│   │   └── utils/                 # Currency formatting (INR), date parsing, downloads
│   └── test/                      # Component and hook unit tests
│
├── api/index.js                   # Serverless entry point for Vercel deployment
├── vercel.json                    # Monorepo deployment specification
└── README.md
```

---

## Database Architecture & Schema Design

```mermaid
erDiagram
    users ||--o{ refresh_tokens : has
    users ||--o{ categories : owns
    users ||--o{ expenses : records
    users ||--o{ budgets : sets
    categories ||--o{ expenses : classifies
    categories ||--o{ budgets : limits

    users {
        uuid id PK
        varchar name
        varchar email "unique, case-insensitive"
        text password_hash
        char currency
    }
    refresh_tokens {
        uuid id PK
        uuid user_id FK
        char token_hash "SHA-256, unique"
        uuid family_id "one per login"
        timestamptz expires_at
        timestamptz revoked_at
        uuid replaced_by FK
    }
    categories {
        uuid id PK
        uuid user_id FK
        varchar name "unique per user, case-insensitive"
        char color "hex"
    }
    expenses {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        numeric amount "12,2 and > 0"
        varchar description
        date expense_date
        text notes
    }
    budgets {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        date month "first day of month"
        numeric amount "12,2 and > 0"
    }
```

### Key Relational Constraints & Database Optimizations

- **Numeric Precision:** Currencies are strictly stored using `NUMERIC(12,2)` rather than floating-point values to ensure monetary calculations avoid rounding errors.
- **Composite Foreign Keys:** `(category_id, user_id) REFERENCES categories(id, user_id)` guarantees at the database level that no user can record an expense or budget against another user's category.
- **Cascade Rules:** Expenses enforce `ON DELETE RESTRICT` to protect historical records when a category has active transactions.
- **Targeted Indexes:**
  - `expenses (user_id, expense_date DESC)`: Accelerates sorting and chronological retrieval.
  - `expenses (user_id, category_id, expense_date)`: Optimizes category filtering and budget aggregation.
  - `budgets UNIQUE (user_id, month, category_id)`: Enforces one budget allocation per category per month.
  - `refresh_tokens (token_hash, user_id)`: Enables high-speed token verification and session lookup.
- **Stored Functions:**
  - `fn_budget_summary(user, month)`: Single SQL query calculating budgeted vs. actual spending per category.
  - `fn_monthly_totals(user, year)`: Aggregates full calendar year totals with zero-fill for report trend charts.
  - `fn_category_totals(user, from, to)`: Calculates aggregated category spend distributions.

---

## Authentication & Security Design

1. **Dual-Token Architecture:**
   - **Access Token:** Short-lived JWT (15 minutes) kept only in client memory. Never stored in `localStorage` or `sessionStorage` to mitigate token theft via Cross-Site Scripting (XSS).
   - **Refresh Token:** High-entropy random token (7 days) stored in an `httpOnly`, `SameSite=Lax`, `Secure` cookie scoped specifically to `/api/auth`.
2. **Refresh Token Rotation & Anti-Replay Detection:**
   - Every token refresh invalidates the current refresh token and issues a new pair.
   - If an expired or already-rotated token is presented (potential replay/theft attack), the entire family of refresh tokens is immediately invalidated, terminating the session.
3. **Request Deduplication:**
   - When multiple concurrent API calls encounter a 401 response, the frontend Axios interceptor deduplicates refresh requests into a single in-flight promise, avoiding race conditions.
4. **Credential Security:** Passwords hashed with `bcryptjs` using 12 salt rounds with timing-attack mitigation.

---

## Production Deployment (Vercel / Cloud)

The repository is configured for simple monorepo deployment on **Vercel** via [`vercel.json`](vercel.json):

1. **Import Project:** Connect your GitHub repository to Vercel (leave root as `./`).
2. **Database Provisioning:** Connect a managed PostgreSQL database (e.g., Neon, Supabase, or AWS RDS).
3. **Environment Variables:**
   - `DATABASE_URL`: Connection URI (`postgresql://...`)
   - `DATABASE_SSL`: `true`
   - `JWT_ACCESS_SECRET`: Secure random string (e.g. `openssl rand -hex 64`)
4. **Deploy:** Vercel automatically runs the build and executes database migrations on initial startup.
