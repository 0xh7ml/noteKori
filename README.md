# NoteKori - নোট করি

> **Cloud-based Personal Finance Tracker** for managing income, expenses, recurring payments, and analytics.

## 🏗️ Architecture

### Monorepo Structure

```
notekori/
├── apps/
│   ├── web/          # Next.js 14 frontend
│   └── api/          # Hono.js on Cloudflare Workers
├── packages/
│   └── types/        # Shared TypeScript types
├── package.json
└── turbo.json
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) + shadcn/ui |
| **Backend** | Hono.js on Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite) |
| **Auth** | JWT (Custom Implementation) |
| **ORM** | Drizzle ORM |
| **Package Manager** | npm |
| **Build System** | Turborepo |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd noteKori
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

**Frontend (.env.local)**
```bash
cd apps/web
cp .env.local.example .env.local
# Edit .env.local with your API URL
```

**Backend (.dev.vars)**
```bash
cd apps/api
# Edit .dev.vars with your secrets
```

4. **Create D1 database**

```bash
cd apps/api
wrangler d1 create notekori-prod
# Copy the database_id to wrangler.toml
```

5. **Run database migrations**

```bash
npm run db:generate
npm run db:migrate
npm run db:seed  # Seed default categories
```

### Development

Run both apps in development mode:

```bash
npm run dev
```

Or run individually:

```bash
# Frontend (http://localhost:3000)
npm run dev -w web

# Backend (http://localhost:8787)
npm run dev -w api
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run all apps in dev mode |
| `npm run build` | Build frontend for production |
| `npm run deploy:api` | Deploy API to Cloudflare Workers |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations (local) |
| `npm run db:seed` | Seed default categories |

## 🗄️ Database Schema

### Tables

- **users** - User accounts with JWT authentication
- **categories** - Income/expense categories
- **transactions** - Financial transactions
- **recurring_transactions** - Recurring payment rules

### Default Categories

**Expense**: Food & Dining, Transport, Shopping, Bills, Health, Rent, Entertainment, Education

**Income**: Salary, Freelance, Business, Investment, Gift

## 🔐 Authentication

JWT-based authentication system:
- Email/password registration and login
- Secure password hashing with bcrypt
- 7-day JWT tokens with HMAC SHA-256
- Automatic token refresh
- Protected API routes

## 🎨 Design System

Using shadcn/ui with default color palette supporting light and dark modes.

### Custom Colors

- `--income`: Green (#22c55e)
- `--expense`: Red (#dc2626)

## 📊 Features

- ✅ Transaction tracking (income/expense)
- ✅ Category management (system + custom)
- ✅ Analytics & insights
- ✅ Recurring transactions
- ✅ PDF export
- ✅ Dark mode
- ✅ Responsive design
- ✅ JWT authentication

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd apps/web
vercel --prod
```

### Backend (Cloudflare Workers)

```bash
cd apps/api

# Set production secrets
wrangler secret put AUTH_SECRET

# Deploy
npm run deploy
```

### Production Database Migration

```bash
npm run db:migrate:prod
```

## 📝 License

MIT

## 👨‍💻 Author

Saikat

---

**Made with ❤️ using Next.js & Cloudflare**
