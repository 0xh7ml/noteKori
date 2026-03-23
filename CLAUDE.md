# CLAUDE.md — NoteKori Web App

>**NoteKori** (“নোট করি” — Bengali for “Let's Note”), a cloud-based personal finance tracker that allows users to securely track income, expenses, recurring payments, and analytics from any device. All user data is stored in the cloud with proper authentication and authorization.
---

## 1. Project Overview

| Field | Details |
|---|---|
| **App Name** | NoteKori |
| **Type** | Cloud-based Personal Finance Tracker (Web) |
| **Frontend** | Next.js 14 (App Router) + shadcn/ui |
| **Backend** | Hono.js on Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite-compatible, edge-native) |
| **Auth** | Better Auth (self-hosted, runs on Cloudflare Workers) |
| **ORM** | Drizzle ORM (D1-compatible, runs at edge) |
| **Deployment** | Frontend → Vercel / Cloudflare Pages · Backend → Cloudflare Workers |
| **Design System** | shadcn/ui with default color palette (light + dark mode) |

---

## 2. Monorepo Structure

Use a **pnpm monorepo** to manage both apps together.

```
notekori/
├── apps/
│   ├── web/                        # Next.js 14 frontend
│   └── api/                        # Hono on Cloudflare Workers
├── packages/
│   └── types/                      # Shared TypeScript types
├── package.json                    # Workspace root
├── pnpm-workspace.yaml
└── turbo.json                      # Turborepo (optional)
```

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 3. Tech Stack — Full Details

### Frontend (`apps/web`)

```json
{
  "dependencies": {
    "next": "14.2.x",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",

    "better-auth": "^1.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^4.x",
    "axios": "^1.x",

    "tailwindcss": "^3.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x",
    "@radix-ui/react-*": "latest",

    "recharts": "^2.x",

    "date-fns": "^3.x",
    "react-day-picker": "^8.x",

    "jspdf": "^2.x",
    "jspdf-autotable": "^3.x",

    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",

    "sonner": "^1.x",
    "next-themes": "^0.x"
  }
}
```

### Backend (`apps/api`)

```json
{
  "dependencies": {
    "hono": "^4.x",
    "@hono/zod-validator": "^0.x",
    "better-auth": "^1.x",
    "drizzle-orm": "^0.x",
    "zod": "^3.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "wrangler": "^3.x",
    "drizzle-kit": "^0.x",
    "@cloudflare/workers-types": "^4.x",
    "typescript": "^5.x"
  }
}
```

---

## 4. Project File Structure

### Frontend (`apps/web/`)

```
src/
├── app/
│   ├── layout.tsx                  # Root layout: ThemeProvider, QueryProvider, Toaster
│   ├── page.tsx                    # Landing / redirect to /dashboard
│   │
│   ├── (auth)/                     # Auth route group — no sidebar
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   │
│   └── (app)/                      # Protected route group — with sidebar
│       ├── layout.tsx              # Sidebar + header layout
│       ├── dashboard/
│       │   └── page.tsx
│       ├── transactions/
│       │   ├── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── analytics/
│       │   └── page.tsx
│       ├── categories/
│       │   └── page.tsx
│       ├── recurring/
│       │   └── page.tsx
│       └── settings/
│           └── page.tsx
│
├── components/
│   ├── ui/                         # shadcn/ui generated components — DO NOT EDIT MANUALLY
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── calendar.tsx
│   │   ├── popover.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── separator.tsx
│   │   ├── avatar.tsx
│   │   ├── chart.tsx
│   │   └── sonner.tsx
│   │
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── mobile-nav.tsx
│   │
│   ├── dashboard/
│   │   ├── balance-card.tsx
│   │   ├── quick-stats.tsx
│   │   ├── recent-transactions.tsx
│   │   ├── monthly-chart.tsx
│   │   └── spending-by-category.tsx
│   │
│   ├── transactions/
│   │   ├── transaction-table.tsx
│   │   ├── transaction-card.tsx
│   │   ├── transaction-form.tsx
│   │   ├── transaction-filters.tsx
│   │   └── delete-dialog.tsx
│   │
│   ├── categories/
│   │   ├── category-grid.tsx
│   │   └── category-form.tsx
│   │
│   ├── recurring/
│   │   ├── recurring-list.tsx
│   │   └── recurring-form.tsx
│   │
│   └── shared/
│       ├── amount-display.tsx
│       ├── category-badge.tsx
│       ├── date-range-picker.tsx
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       └── theme-toggle.tsx
│
├── hooks/
│   ├── use-transactions.ts
│   ├── use-categories.ts
│   ├── use-analytics.ts
│   ├── use-recurring.ts
│   └── use-export.ts
│
├── lib/
│   ├── api.ts                      # Axios instance with auth headers
│   ├── auth-client.ts              # Better Auth browser client
│   ├── utils.ts                    # cn(), formatCurrency(), formatDate()
│   └── query-client.ts
│
├── store/
│   └── ui-store.ts                 # Zustand: modal state, active filters
│
└── types/
    └── index.ts
```

### Backend (`apps/api/`)

```
src/
├── index.ts                        # Hono app entry, route mounting
│
├── lib/
│   ├── db.ts                       # Drizzle + D1 binding init
│   ├── auth.ts                     # Better Auth server config
│   └── middleware.ts               # requireAuth, CORS, error handler
│
├── db/
│   ├── schema.ts                   # Drizzle schema (all tables)
│   ├── migrations/                 # Generated by drizzle-kit
│   └── seed.ts                     # Default categories seed
│
├── routes/
│   ├── auth.ts                     # Better Auth handler (pass-through)
│   ├── transactions.ts
│   ├── categories.ts
│   ├── analytics.ts
│   ├── recurring.ts
│   └── export.ts
│
└── validators/
    ├── transaction.validator.ts
    ├── category.validator.ts
    └── recurring.validator.ts

wrangler.toml
drizzle.config.ts
```

---

## 5. Database Schema (Drizzle ORM + Cloudflare D1)

```typescript
// apps/api/src/db/schema.ts
import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Better Auth manages these tables automatically (DO NOT create manually):
// users, sessions, accounts, verificationTokens

// ─── Categories ──────────────────────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull(),         // 'system' for defaults
  name:      text('name').notNull(),
  icon:      text('icon').notNull(),            // lucide icon name e.g. "utensils"
  color:     text('color').notNull(),           // hex e.g. "#ef4444"
  type:      text('type', { enum: ['income', 'expense', 'both'] }).notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx: index('categories_user_idx').on(t.userId),
}));

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactions = sqliteTable('transactions', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').notNull(),
  type:        text('type', { enum: ['income', 'expense'] }).notNull(),
  amount:      real('amount').notNull(),
  categoryId:  text('category_id').notNull().references(() => categories.id),
  title:       text('title').notNull(),
  notes:       text('notes'),
  tags:        text('tags').default('[]'),       // JSON array string
  date:        text('date').notNull(),           // ISO 8601
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringId: text('recurring_id'),
  createdAt:   text('created_at').default(sql`(datetime('now'))`),
  updatedAt:   text('updated_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx:     index('tx_user_idx').on(t.userId),
  dateIdx:     index('tx_date_idx').on(t.date),
  typeIdx:     index('tx_type_idx').on(t.type),
  categoryIdx: index('tx_category_idx').on(t.categoryId),
}));

// ─── Recurring Transactions ───────────────────────────────────────────────────
export const recurringTransactions = sqliteTable('recurring_transactions', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').notNull(),
  type:        text('type', { enum: ['income', 'expense'] }).notNull(),
  amount:      real('amount').notNull(),
  categoryId:  text('category_id').notNull().references(() => categories.id),
  title:       text('title').notNull(),
  notes:       text('notes'),
  frequency:   text('frequency', { enum: ['daily', 'weekly', 'monthly', 'yearly'] }).notNull(),
  startDate:   text('start_date').notNull(),
  endDate:     text('end_date'),                // NULL = indefinite
  nextDueDate: text('next_due_date').notNull(),
  isActive:    integer('is_active', { mode: 'boolean' }).default(true),
  createdAt:   text('created_at').default(sql`(datetime('now'))`),
}, (t) => ({
  userIdx:    index('recurring_user_idx').on(t.userId),
  dueDateIdx: index('recurring_due_idx').on(t.nextDueDate),
}));

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type Transaction          = typeof transactions.$inferSelect;
export type NewTransaction       = typeof transactions.$inferInsert;
export type Category             = typeof categories.$inferSelect;
export type NewCategory          = typeof categories.$inferInsert;
export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
```

### Default Categories Seed

```typescript
// apps/api/src/db/seed.ts
export const DEFAULT_CATEGORIES = [
  // Expense
  { id: 'sys_food',      name: 'Food & Dining',  icon: 'utensils',       color: '#ef4444', type: 'expense', userId: 'system', isDefault: true },
  { id: 'sys_transport', name: 'Transport',       icon: 'car',            color: '#3b82f6', type: 'expense', userId: 'system', isDefault: true },
  { id: 'sys_shopping',  name: 'Shopping',        icon: 'shopping-bag',   color: '#f59e0b', type: 'expense', userId: 'system', isDefault: true },
  { id: 'sys_bills',     name: 'Bills',           icon: 'receipt',        color: '#8b5cf6', type: 'expense', userId: 'system', isDefault: true },
  { id: 'sys_health',    name: 'Health',          icon: 'heart-pulse',    color: '#ec4899', type: 'expense', userId: 'system', isDefault: true },
  { id: 'sys_rent',      name: 'Rent',            icon: 'home',           color: '#06b6d4', type: 'expense', userId: 'system', isDefault: true },
  { id: 'sys_entertain', name: 'Entertainment',   icon: 'clapperboard',   color: '#f97316', type: 'expense', userId: 'system', isDefault: true },
  { id: 'sys_education', name: 'Education',       icon: 'graduation-cap', color: '#10b981', type: 'expense', userId: 'system', isDefault: true },
  // Income
  { id: 'sys_salary',    name: 'Salary',          icon: 'briefcase',      color: '#22c55e', type: 'income',  userId: 'system', isDefault: true },
  { id: 'sys_freelance', name: 'Freelance',       icon: 'laptop',         color: '#6366f1', type: 'income',  userId: 'system', isDefault: true },
  { id: 'sys_business',  name: 'Business',        icon: 'store',          color: '#eab308', type: 'income',  userId: 'system', isDefault: true },
  { id: 'sys_invest',    name: 'Investment',      icon: 'trending-up',    color: '#14b8a6', type: 'income',  userId: 'system', isDefault: true },
  { id: 'sys_gift',      name: 'Gift',            icon: 'gift',           color: '#f43f5e', type: 'income',  userId: 'system', isDefault: true },
] as const;
```

---

## 6. Authentication & Authorization

### Strategy

Use **Better Auth** — a framework-agnostic auth library that runs natively on Cloudflare Workers without any Node.js-specific APIs. It handles session management, OAuth providers, email/password auth, email verification, and password reset out of the box.

### Backend Auth Setup

```typescript
// apps/api/src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db';

export function createAuth(env: Env) {
  return betterAuth({
    database: drizzleAdapter(getDb(env.DB), {
      provider: 'sqlite',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    socialProviders: {
      google: {
        clientId:     env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId:     env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,     // 7 days
      updateAge: 60 * 60 * 24,          // Refresh if older than 1 day
      cookieCache: {
        enabled: true,
        maxAge:  5 * 60,                // 5-minute client-side cache
      },
    },
    trustedOrigins: [env.FRONTEND_URL],
    secret: env.AUTH_SECRET,
  });
}
```

### Auth Route in Hono

```typescript
// apps/api/src/routes/auth.ts
import { Hono } from 'hono';
import { createAuth } from '../lib/auth';

const authRoute = new Hono<{ Bindings: Env }>();

// Better Auth handles ALL auth routes under /api/auth/*
// POST /api/auth/sign-up/email
// POST /api/auth/sign-in/email
// POST /api/auth/sign-in/social
// POST /api/auth/sign-out
// GET  /api/auth/session
// POST /api/auth/forget-password
// POST /api/auth/reset-password
authRoute.all('/*', async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

export { authRoute };
```

### Auth Middleware — Protects All App Routes

```typescript
// apps/api/src/lib/middleware.ts
import { createMiddleware } from 'hono/factory';
import { createAuth } from './auth';

export type AuthVariables = {
  userId:  string;
  session: { id: string; userId: string };
};

export const requireAuth = createMiddleware<{
  Bindings: Env;
  Variables: AuthVariables;
}>(async (c, next) => {
  const auth    = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', session.user.id);
  c.set('session', session.session);
  await next();
});
```

### Authorization Rules

**All data is strictly user-scoped.** Every query must filter by `userId`. This is the single most important security constraint in the entire application.

```typescript
// ✅ CORRECT — always scope to the authenticated user
const txs = await db
  .select()
  .from(transactions)
  .where(
    and(
      eq(transactions.userId, c.get('userId')),   // ALWAYS required
      eq(transactions.type, 'expense'),
    )
  );

// ❌ WRONG — missing userId scope leaks all users' data
const txs = await db.select().from(transactions);
```

**Category ownership rules:**
- System categories (`isDefault: true`, `userId: 'system'`) are readable by ALL authenticated users
- System categories cannot be edited or deleted by anyone (return 403)
- Custom categories are readable/editable only by the creating user

```typescript
// Ownership check before any category mutation
const [cat] = await db.select().from(categories)
  .where(eq(categories.id, id)).limit(1);

if (!cat)          return c.json({ error: 'Not found' }, 404);
if (cat.isDefault) return c.json({ error: 'Cannot modify system categories' }, 403);
if (cat.userId !== c.get('userId')) return c.json({ error: 'Forbidden' }, 403);
```

**Transaction ownership check before update/delete:**

```typescript
const [tx] = await db.select().from(transactions)
  .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  .limit(1);

if (!tx) return c.json({ error: 'Not found' }, 404); // 404 not 403 — don't leak existence
```

### Frontend Auth Client

```typescript
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
});

export const {
  signIn,       // signIn.email({ email, password, callbackURL })
  signUp,       // signUp.email({ name, email, password })
  signOut,      // signOut()
  useSession,   // React hook → { data: session, isPending, error }
  getSession,   // Server-side session fetch (RSC / middleware)
} = authClient;
```

### Next.js Route Middleware — Protect Pages

```typescript
// apps/web/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth-client';

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  const session = await getSession({
    fetchOptions: {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    },
  });

  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

### Auth Pages

```typescript
// apps/web/src/app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function LoginPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);

    const { error } = await signIn.email({
      email:       data.get('email') as string,
      password:    data.get('password') as string,
      callbackURL: '/dashboard',
    });

    if (error) { toast.error(error.message ?? 'Login failed'); setLoading(false); }
    else       { router.push('/dashboard'); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your NoteKori account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-xs text-muted-foreground">or</span>
          </div>
          <Button variant="outline" className="w-full" onClick={() =>
            signIn.social({ provider: 'google', callbackURL: '/dashboard' })
          }>
            Continue with Google
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account?{' '}
            <a href="/register" className="underline underline-offset-4 hover:text-primary">Register</a>
          </p>
          <p className="text-center text-sm">
            <a href="/forgot-password" className="text-muted-foreground underline underline-offset-4 hover:text-primary text-xs">
              Forgot password?
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 7. API Routes (Hono)

### Main Entry Point

```typescript
// apps/api/src/index.ts
import { Hono } from 'hono';
import { cors }   from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoute }         from './routes/auth';
import { transactionsRoute } from './routes/transactions';
import { categoriesRoute }   from './routes/categories';
import { analyticsRoute }    from './routes/analytics';
import { recurringRoute }    from './routes/recurring';
import { exportRoute }       from './routes/export';
import { requireAuth }       from './lib/middleware';

const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use('*', cors({
  origin:       (_, c) => c.env.FRONTEND_URL,
  credentials:  true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Public — Better Auth handles internally
app.route('/api/auth', authRoute);

// Protected — all require valid session
app.use('/api/*', requireAuth);
app.route('/api/transactions', transactionsRoute);
app.route('/api/categories',   categoriesRoute);
app.route('/api/analytics',    analyticsRoute);
app.route('/api/recurring',    recurringRoute);
app.route('/api/export',       exportRoute);

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }));

export default app;
```

### Transactions Route (Full CRUD)

```typescript
// apps/api/src/routes/transactions.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, gte, lte, like, desc, sql } from 'drizzle-orm';
import { getDb } from '../lib/db';
import { transactions } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

const transactionSchema = z.object({
  type:        z.enum(['income', 'expense']),
  amount:      z.number().positive(),
  categoryId:  z.string().min(1),
  title:       z.string().min(1).max(100),
  notes:       z.string().max(500).optional(),
  tags:        z.array(z.string()).default([]),
  date:        z.string().datetime(),
  isRecurring: z.boolean().default(false),
  recurringId: z.string().optional(),
});

const filterSchema = z.object({
  type:       z.enum(['income', 'expense']).optional(),
  categoryId: z.string().optional(),
  from:       z.string().optional(),
  to:         z.string().optional(),
  query:      z.string().optional(),
  page:       z.coerce.number().default(1),
  limit:      z.coerce.number().max(100).default(20),
});

const route = new Hono();

// GET /api/transactions
route.get('/', zValidator('query', filterSchema), async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const { type, categoryId, from, to, query, page, limit } = c.req.valid('query');
  const offset = (page - 1) * limit;

  const conditions = [eq(transactions.userId, userId)];
  if (type)       conditions.push(eq(transactions.type, type));
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (from)       conditions.push(gte(transactions.date, from));
  if (to)         conditions.push(lte(transactions.date, to));
  if (query)      conditions.push(like(transactions.title, `%${query}%`));

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` })
      .from(transactions).where(and(...conditions)),
  ]);

  return c.json({
    data:       rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  });
});

// POST /api/transactions
route.post('/', zValidator('json', transactionSchema), async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const body   = c.req.valid('json');
  const now    = new Date().toISOString();
  const id     = uuidv4();

  await db.insert(transactions).values({
    id, userId, ...body,
    tags:      JSON.stringify(body.tags),
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ data: { id, ...body } }, 201);
});

// GET /api/transactions/:id
route.get('/:id', async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const { id } = c.req.param();

  const [tx] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);

  if (!tx) return c.json({ error: 'Not found' }, 404);
  return c.json({ data: tx });
});

// PATCH /api/transactions/:id
route.patch('/:id', zValidator('json', transactionSchema.partial()), async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const { id } = c.req.param();
  const body   = c.req.valid('json');

  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  await db.update(transactions)
    .set({ ...body, tags: body.tags ? JSON.stringify(body.tags) : undefined, updatedAt: new Date().toISOString() })
    .where(eq(transactions.id, id));

  return c.json({ success: true });
});

// DELETE /api/transactions/:id
route.delete('/:id', async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const { id } = c.req.param();

  const [existing] = await db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
  if (!existing) return c.json({ error: 'Not found' }, 404);

  await db.delete(transactions).where(eq(transactions.id, id));
  return c.json({ success: true });
});

export { route as transactionsRoute };
```

### Analytics Route

```typescript
// apps/api/src/routes/analytics.ts
import { Hono } from 'hono';
import { sql, and, eq, gte, lte } from 'drizzle-orm';
import { transactions, categories } from '../db/schema';
import { getDb } from '../lib/db';

const route = new Hono();

// GET /api/analytics/summary?from=&to=
route.get('/summary', async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const { from, to } = c.req.query();

  const conditions = [eq(transactions.userId, userId)];
  if (from) conditions.push(gte(transactions.date, from));
  if (to)   conditions.push(lte(transactions.date, to));

  const [result] = await db.select({
    totalIncome:  sql<number>`COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)`,
    totalExpense: sql<number>`COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)`,
    count:        sql<number>`COUNT(*)`,
  }).from(transactions).where(and(...conditions));

  return c.json({ data: { ...result, balance: result.totalIncome - result.totalExpense } });
});

// GET /api/analytics/by-category?from=&to=&type=expense
route.get('/by-category', async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const { from, to, type = 'expense' } = c.req.query();

  const rows = await db
    .select({
      categoryId: categories.id,
      name:       categories.name,
      icon:       categories.icon,
      color:      categories.color,
      total:      sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(categories)
    .leftJoin(transactions, and(
      eq(transactions.categoryId, categories.id),
      eq(transactions.userId, userId),
      eq(transactions.type, type as 'income' | 'expense'),
      from ? gte(transactions.date, from) : sql`1=1`,
      to   ? lte(transactions.date, to)   : sql`1=1`,
    ))
    .where(sql`${categories.userId} IN ('system', ${userId})`)
    .groupBy(categories.id)
    .having(sql`total > 0`)
    .orderBy(sql`total DESC`);

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  return c.json({
    data: rows.map(r => ({
      ...r,
      percentage: grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0,
    })),
  });
});

// GET /api/analytics/daily-trend?from=&to=
route.get('/daily-trend', async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const { from, to } = c.req.query();

  const conditions = [eq(transactions.userId, userId)];
  if (from) conditions.push(gte(transactions.date, from));
  if (to)   conditions.push(lte(transactions.date, to));

  const rows = await db.select({
    date:    sql<string>`DATE(${transactions.date})`,
    income:  sql<number>`COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)`,
    expense: sql<number>`COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)`,
  })
  .from(transactions)
  .where(and(...conditions))
  .groupBy(sql`DATE(${transactions.date})`)
  .orderBy(sql`DATE(${transactions.date})`);

  return c.json({ data: rows });
});

// GET /api/analytics/monthly-trend?months=6
route.get('/monthly-trend', async (c) => {
  const db     = getDb(c.env.DB);
  const userId = c.get('userId');
  const months = parseInt(c.req.query('months') ?? '6');

  const rows = await db.select({
    month:   sql<string>`strftime('%Y-%m', ${transactions.date})`,
    income:  sql<number>`COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0)`,
    expense: sql<number>`COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0)`,
  })
  .from(transactions)
  .where(and(
    eq(transactions.userId, userId),
    gte(transactions.date, sql`datetime('now', ${`-${months} months`})`),
  ))
  .groupBy(sql`strftime('%Y-%m', ${transactions.date})`)
  .orderBy(sql`strftime('%Y-%m', ${transactions.date})`);

  return c.json({ data: rows });
});

export { route as analyticsRoute };
```

---

## 8. Full API Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/sign-up/email` | Register with email + password | Public |
| `POST` | `/api/auth/sign-in/email` | Login with email + password | Public |
| `POST` | `/api/auth/sign-in/social` | OAuth (Google, GitHub) | Public |
| `POST` | `/api/auth/sign-out` | Logout, clears session cookie | Public |
| `GET`  | `/api/auth/session` | Get current session info | Public |
| `POST` | `/api/auth/forget-password` | Send password reset email | Public |
| `POST` | `/api/auth/reset-password` | Reset with token from email | Public |
| `GET`  | `/api/transactions` | List (paginated, filtered) | 🔒 |
| `POST` | `/api/transactions` | Create transaction | 🔒 |
| `GET`  | `/api/transactions/:id` | Get single transaction | 🔒 |
| `PATCH`| `/api/transactions/:id` | Update transaction | 🔒 |
| `DELETE`| `/api/transactions/:id` | Delete transaction | 🔒 |
| `GET`  | `/api/categories` | List system + user categories | 🔒 |
| `POST` | `/api/categories` | Create custom category | 🔒 |
| `PATCH`| `/api/categories/:id` | Update custom category | 🔒 |
| `DELETE`| `/api/categories/:id` | Delete custom category | 🔒 |
| `GET`  | `/api/analytics/summary` | Income/expense totals | 🔒 |
| `GET`  | `/api/analytics/by-category` | Category breakdown + % | 🔒 |
| `GET`  | `/api/analytics/daily-trend` | Day-by-day income/expense | 🔒 |
| `GET`  | `/api/analytics/monthly-trend` | N-month trend | 🔒 |
| `GET`  | `/api/recurring` | List recurring transactions | 🔒 |
| `POST` | `/api/recurring` | Create recurring rule | 🔒 |
| `PATCH`| `/api/recurring/:id` | Update / toggle active | 🔒 |
| `DELETE`| `/api/recurring/:id` | Delete recurring rule | 🔒 |
| `POST` | `/api/recurring/process` | Process all due recurring tx | 🔒 (Cron) |
| `GET`  | `/api/export/pdf` | Export transaction data for PDF | 🔒 |

---

## 9. Frontend Data Layer

### API Client

```typescript
// apps/web/src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL:         process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
```

### React Query Hooks

```typescript
// apps/web/src/hooks/use-transactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const txKeys = {
  all:    ['transactions'] as const,
  list:   (filters: object) => [...txKeys.all, 'list', filters] as const,
  detail: (id: string)      => [...txKeys.all, 'detail', id]    as const,
};

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey:  txKeys.list(filters),
    queryFn:   () => api.get('/api/transactions', { params: filters }).then(r => r.data),
    staleTime: 30_000,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewTransaction) =>
      api.post('/api/transactions', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txKeys.all });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/transactions/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txKeys.all });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
```

---

## 10. shadcn/ui Setup & Color Palette

### Installation

```bash
cd apps/web
npx shadcn@latest init
# Style: Default | Base color: Neutral | CSS variables: Yes
```

### Components to Install

```bash
npx shadcn@latest add button card input label form select \
  dialog sheet table badge avatar calendar popover \
  dropdown-menu separator skeleton sonner chart \
  sidebar navigation-menu breadcrumb toggle-group command
```

### Default Color Variables (Do Not Override)

```css
/* apps/web/src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background:          0 0% 100%;
    --foreground:          240 10% 3.9%;
    --card:                0 0% 100%;
    --card-foreground:     240 10% 3.9%;
    --popover:             0 0% 100%;
    --popover-foreground:  240 10% 3.9%;
    --primary:             240 5.9% 10%;
    --primary-foreground:  0 0% 98%;
    --secondary:           240 4.8% 95.9%;
    --secondary-foreground:240 5.9% 10%;
    --muted:               240 4.8% 95.9%;
    --muted-foreground:    240 3.8% 46.1%;
    --accent:              240 4.8% 95.9%;
    --accent-foreground:   240 5.9% 10%;
    --destructive:         0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border:              240 5.9% 90%;
    --input:               240 5.9% 90%;
    --ring:                240 5.9% 10%;
    --radius:              0.5rem;
    /* Finance semantic colors — added on top of shadcn defaults */
    --income:              142 71% 45%;
    --expense:             0 84% 60%;
  }

  .dark {
    --background:          240 10% 3.9%;
    --foreground:          0 0% 98%;
    --card:                240 10% 3.9%;
    --card-foreground:     0 0% 98%;
    --popover:             240 10% 3.9%;
    --popover-foreground:  0 0% 98%;
    --primary:             0 0% 98%;
    --primary-foreground:  240 5.9% 10%;
    --secondary:           240 3.7% 15.9%;
    --secondary-foreground:0 0% 98%;
    --muted:               240 3.7% 15.9%;
    --muted-foreground:    240 5% 64.9%;
    --accent:              240 3.7% 15.9%;
    --accent-foreground:   0 0% 98%;
    --destructive:         0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border:              240 3.7% 15.9%;
    --input:               240 3.7% 15.9%;
    --ring:                240 4.9% 83.9%;
    --income:              142 71% 45%;
    --expense:             0 84% 60%;
  }
}
```

### Theme Provider Setup

```typescript
// apps/web/src/app/layout.tsx
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/lib/query-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 11. Screen Specifications

### Dashboard (`/dashboard`)

Layout (sidebar + main content):

```
┌─────────────┬────────────────────────────────────────────────┐
│             │  Good morning, Saikat 👋         [theme] [👤] │
│  NoteKori   ├────────────────────────────────────────────────┤
│             │                                                │
│  📊 Dash    │  ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  💸 Txns    │  │  Balance   │ │   Income   │ │  Expenses  │ │
│  📈 Report  │  │  $1,200    │ │  $3,000 ↑  │ │  $1,800 ↓  │ │
│  🏷️ Cats    │  └────────────┘ └────────────┘ └────────────┘ │
│  🔄 Recur   │                                                │
│  ⚙️ Settings│  Monthly Overview (BarChart via recharts)      │
│             │  ┌──────────────────────────────────────────┐  │
│             │  │  ■ Income  ■ Expense  [last 6 months]    │  │
│             │  └──────────────────────────────────────────┘  │
│             │                                                │
│             │  ┌─────────────────┐  ┌──────────────────┐   │
│             │  │ Spending by Cat  │  │ Recent Txns      │   │
│             │  │ (PieChart)       │  │ [5 transactions] │   │
│             │  └─────────────────┘  └──────────────────┘   │
└─────────────┴────────────────────────────────────────────────┘
```

Use shadcn `<Card>` for all stat blocks. Use shadcn `<ChartContainer>` wrapping recharts `<BarChart>` and `<PieChart>`.

### Transaction List (`/transactions`)

- **Desktop**: `<Table>` — columns: Date, Title, Category `<Badge>`, Type, Amount, Actions dropdown
- **Mobile**: Card list (responsive breakpoint at `md`)
- Top bar: Search `<Input>` (debounced 300ms) + Filter `<Sheet>` trigger + "Add Transaction" `<Button>`
- Filter Sheet fields: Date range picker, Category multi-select, Type `<ToggleGroup>`, Amount min/max
- Pagination controls at bottom with page size selector

### Add / Edit Transaction — `<Sheet>` (right side)

Form schema:

```typescript
const schema = z.object({
  type:       z.enum(['income', 'expense']),
  amount:     z.coerce.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Select a category'),
  title:      z.string().min(1, 'Title is required').max(100),
  notes:      z.string().max(500).optional(),
  tags:       z.string().optional(),         // comma-separated, split on save
  date:       z.date({ required_error: 'Pick a date' }),
  isRecurring: z.boolean().default(false),
  frequency:  z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});
```

Field order in the Sheet:
1. Income / Expense `<ToggleGroup single>`
2. Amount `<Input type="number">` (large, prominent)
3. Category grid (4-col icon grid, colored borders)
4. Title `<Input>`
5. Date `<Calendar>` inside `<Popover>`
6. Notes `<Textarea>`
7. Tags `<Input>` with `<Badge>` previews
8. Recurring `<Switch>` → if on, show Frequency `<Select>`

### Analytics (`/analytics`)

- Period `<Select>`: This Week / This Month / Last 3M / Last 6M / Custom
- Row 1: 3 stat `<Card>`s (total income, total expense, savings rate %)
- Row 2: Full-width `<BarChart>` (income vs expense per day/month)
- Row 3: `<PieChart>` left + Category breakdown `<Table>` right (with `<Progress>` bars)

### Settings (`/settings`)

Sections using `<Card>` with `<Separator>` dividers:
- **Profile**: Display name `<Input>`, email read-only, "Change Password" link
- **Preferences**: Currency `<Select>` (BDT/USD/EUR/GBP), Date format `<Select>`
- **Appearance**: `<ThemeToggle>` (Light / Dark / System)
- **Export**: Date range `<Calendar>` + "Download PDF" `<Button>`
- **Danger Zone**: Sign out `<Button variant="outline">`, Delete account `<Button variant="destructive">` with confirm `<AlertDialog>`

---

## 12. PDF Export

```typescript
// apps/web/src/hooks/use-export.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export function useExport() {
  function exportToPDF(
    transactions: Transaction[],
    summary: { totalIncome: number; totalExpense: number; balance: number },
    from: Date,
    to: Date,
  ) {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('NoteKori — Financial Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`, 14, 30);

    autoTable(doc, {
      startY: 38,
      head:   [['Metric', 'Amount']],
      body:   [
        ['Total Income',  formatCurrency(summary.totalIncome)],
        ['Total Expense', formatCurrency(summary.totalExpense)],
        ['Net Balance',   formatCurrency(summary.balance)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head:   [['Date', 'Title', 'Category', 'Type', 'Amount']],
      body:   transactions.map(t => [
        format(new Date(t.date), 'MMM d, yyyy'),
        t.title,
        t.categoryName ?? t.categoryId,
        t.type.toUpperCase(),
        (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount),
      ]),
      theme: 'striped',
    });

    doc.save(`notekori_${format(from, 'yyyy-MM')}_to_${format(to, 'yyyy-MM')}.pdf`);
  }

  return { exportToPDF };
}
```

---

## 13. Cloudflare Infrastructure

### `wrangler.toml`

```toml
name               = "notekori-api"
main               = "src/index.ts"
compatibility_date = "2024-09-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding       = "DB"
database_name = "notekori-prod"
database_id   = "YOUR_D1_DATABASE_ID"

[vars]
FRONTEND_URL = "https://notekori.vercel.app"

# Cron: process recurring transactions every day at midnight UTC
[[triggers]]
crons = ["0 0 * * *"]

# Secrets — set via: wrangler secret put <NAME>
# AUTH_SECRET
# GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
# GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
```

### Cron Handler (Recurring Processor)

```typescript
// apps/api/src/index.ts — add export default object
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Triggered by cron "0 0 * * *"
    ctx.waitUntil(processAllRecurring(env));
  },
};
```

### `drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema:    './src/db/schema.ts',
  out:       './src/db/migrations',
  dialect:   'sqlite',
  driver:    'd1-http',
  dbCredentials: {
    accountId:  process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID!,
    token:      process.env.CLOUDFLARE_D1_TOKEN!,
  },
} satisfies Config;
```

### Environment Variables

```bash
# ── Backend secrets (set via wrangler CLI) ──────────────────────────
wrangler secret put AUTH_SECRET           # 32+ random chars
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8787   # → https://api.notekori.com in prod

# apps/api/.dev.vars (gitignored, local dev only)
AUTH_SECRET=dev-secret-minimum-32-characters
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## 14. Development Commands

```bash
# Install all dependencies from root
pnpm install

# Run both apps concurrently
pnpm --filter web dev          # Next.js → http://localhost:3000
pnpm --filter api dev          # Wrangler → http://localhost:8787

# Database operations
pnpm --filter api db:generate  # drizzle-kit generate migrations
pnpm --filter api db:migrate   # Apply to local D1
pnpm --filter api db:migrate:prod  # Apply to prod D1 (careful!)
pnpm --filter api db:seed      # Insert default categories
pnpm --filter api db:studio    # Open Drizzle Studio GUI

# shadcn components (run from apps/web)
pnpm --filter web shadcn add [component-name]

# Deploy
pnpm --filter api deploy       # wrangler deploy → Cloudflare Workers
pnpm --filter web build        # Next.js production build → deploy to Vercel
```

### Root `package.json` Scripts

```json
{
  "scripts": {
    "dev":           "pnpm run --parallel '/^dev$/'",
    "build":         "pnpm --filter web build",
    "deploy:api":    "pnpm --filter api deploy",
    "db:generate":   "pnpm --filter api db:generate",
    "db:migrate":    "pnpm --filter api db:migrate",
    "db:seed":       "pnpm --filter api db:seed"
  }
}
```

---

## 15. Development Roadmap

### Phase 1 — Foundation (Week 1)
- [ ] pnpm monorepo + Turborepo setup
- [ ] Cloudflare D1 creation + Drizzle schema + migrations
- [ ] Default categories seed script
- [ ] Better Auth on Hono: email/password + Google OAuth
- [ ] Next.js + shadcn/ui init + globals.css
- [ ] Login, Register, Forgot Password pages
- [ ] Next.js middleware (route protection)
- [ ] Hono `requireAuth` middleware

### Phase 2 — Core CRUD (Week 2)
- [ ] Transactions API (GET/POST/PATCH/DELETE) with full user scoping
- [ ] Categories API (system + custom, with ownership guards)
- [ ] React Query setup + api.ts axios client
- [ ] Dashboard: balance card, quick stats, recent transactions
- [ ] Add/Edit Transaction Sheet with react-hook-form + zod
- [ ] Transaction list page with pagination

### Phase 3 — Analytics (Week 3)
- [ ] Analytics API: summary, by-category, daily-trend, monthly-trend
- [ ] Analytics page: recharts BarChart + PieChart via shadcn ChartContainer
- [ ] Category breakdown table with Progress bars
- [ ] Period selector (week / month / custom date range)

### Phase 4 — Advanced Features (Week 4)
- [ ] Custom categories CRUD (grid picker with icon + color)
- [ ] Recurring transactions CRUD
- [ ] Cloudflare Cron → recurring processor
- [ ] Tags on transactions (comma input → Badge previews)
- [ ] Transaction search with 300ms debounce
- [ ] Advanced filters: date range, category multi-select, type, amount range

### Phase 5 — Polish & Deployment (Week 5)
- [ ] PDF export (jsPDF + jspdf-autotable)
- [ ] Settings: profile, currency preference, date format
- [ ] Dark/light/system theme toggle
- [ ] Mobile responsive layout (sidebar → sheet nav on mobile)
- [ ] Skeleton loading states for all data-fetching components
- [ ] Empty states with illustrations
- [ ] Toast notifications (sonner) for all mutations + errors
- [ ] Deploy API to Cloudflare Workers
- [ ] Deploy frontend to Vercel
- [ ] Set all production secrets + environment variables

---

## 16. Critical Rules for Claude

1. **Every single DB query must include `eq(table.userId, c.get('userId'))`**. Data leaks between users are critical security vulnerabilities. This is non-negotiable.

2. **Better Auth creates and owns** the `users`, `sessions`, `accounts`, and `verificationTokens` tables. Never define or migrate these manually.

3. **All Hono routes under `/api/*`** (except `/api/auth/*`) must be protected by the `requireAuth` middleware.

4. **System categories** have `userId = 'system'` and `isDefault = true`. They are readable by all users. They cannot be written to by anyone — return `403 Forbidden`.

5. **Return 404 (not 403) when a user accesses another user's resource** — this avoids leaking information about whether a resource exists.

6. **Tags are stored as JSON strings in D1** — always `JSON.stringify(tags)` on write, `JSON.parse(tags)` on read.

7. **All dates are ISO 8601 strings** in the database and over the API. Use `date-fns` on the frontend for all formatting and parsing.

8. **Never expose raw SQL errors or stack traces** to the client. Wrap DB operations in try/catch and return `{ error: 'Internal server error' }` with status 500.

9. **shadcn `<ChartContainer>`** must wrap all recharts charts for consistent dark/light mode theming. Never use bare recharts without ChartContainer.

10. **Invalidate React Query caches** after every mutation — invalidate both the specific resource key and the `['analytics']` key.

11. **Cloudflare D1 does not always support `RETURNING`** — do a separate SELECT after INSERT if you need to return the created record.

12. **The recurring processor** must run as a Cloudflare Cron Trigger (`"0 0 * * *"` in `wrangler.toml`), not be manually triggered in production.

13. **Use `wrangler d1 execute --local`** for local dev. Never run `--remote` migrations without a confirmed backup strategy.

14. **Currency must never be hardcoded** — always read from the user's settings preference (default: USD).

15. **The `(auth)` and `(app)` route groups** in Next.js App Router share different layouts. `(auth)` has no sidebar. `(app)` has the sidebar + header layout with the active session.