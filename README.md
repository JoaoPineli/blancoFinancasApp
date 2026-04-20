# Blanco Finanças App

Frontend for Blanco Finanças — a Brazilian investment platform. Built with Nuxt 4 and Nuxt UI, providing separate portals for clients and administrators.

## Stack

- **Nuxt 4.2** — full-stack Vue framework (file-based routing, SSR)
- **Nuxt UI 4.3** — component library
- **Vue 3** + **TypeScript 5.9+**
- **pnpm** — package manager

## Setup

```bash
pnpm install
```

Copy and fill in environment variables:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api` |

## Commands

```bash
pnpm dev        # Development server at http://localhost:3000
pnpm build      # Production build
pnpm preview    # Preview production build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript validation
```

## Architecture

Pages orchestrate, composables own data fetching, components only render.

```
app/
├── pages/
│   ├── index.vue          # Landing page (prerendered)
│   ├── activate.vue       # Account activation
│   ├── auth/              # login, register, email confirm, password recovery
│   ├── client/            # Protected client portal
│   │   ├── dashboard.vue
│   │   ├── finance.vue    # Deposits, withdrawals, PIX
│   │   ├── plans.vue
│   │   └── support.vue
│   └── admin/             # Protected admin panel
│       ├── dashboard.vue
│       ├── clients.vue
│       ├── plans.vue
│       ├── finance.vue
│       ├── withdrawals.vue
│       └── reports.vue
├── composables/
│   ├── useApi.ts               # Central HTTP gateway (auth + error handling)
│   ├── useAuth.ts              # Auth state
│   ├── useCurrency.ts          # BRL formatting (Intl.NumberFormat)
│   ├── useValidation.ts        # Form validation rules
│   ├── useSubscriptionHelpers.ts
│   ├── useDashboardApi.ts
│   ├── useFinanceApi.ts
│   ├── usePlansApi.ts
│   ├── useSubscriptionsApi.ts
│   ├── useNotificationsApi.ts
│   ├── useAdminClientsApi.ts
│   ├── useAdminFinanceApi.ts
│   ├── useAdminWithdrawalsApi.ts
│   └── useAdminReportsApi.ts
├── components/
│   ├── App/                    # Header, Sidebar
│   ├── Client/                 # BalanceCard, SubscriptionCard, PaymentPixView,
│   │                           #   YieldChart, WithdrawalForm, and more
│   └── Admin/                  # ClientTable, PlanCard, CashFlowTable,
│                               #   FinanceSummary, and more
└── middleware/
    └── auth.ts                 # Route guard; enforces roles (ADMIN, CLIENT, REGISTERED)
```

## Key Rules

- **No API calls in components or pages** — all data fetching goes through composables.
- **No financial calculations on the frontend** — all values come pre-calculated from the backend.
- **JWT tokens are stored in httpOnly cookies only.**
- Role-based access control is enforced server-side; frontend role checks are UI-only.
- Money display uses `useCurrency.ts` (`Intl.NumberFormat` for BRL) — never raw arithmetic.
