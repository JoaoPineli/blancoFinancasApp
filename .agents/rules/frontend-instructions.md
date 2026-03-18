# Agent Instructions — Frontend (Blanco Finanças App)

> These instructions apply to **Antigravity** and any other AI agent working on this repository.
> The canonical rules for this system live in `frontend-guardrails.md`.
> Everything described there must be followed without exception.

---

## Big Picture

- This folder contains the **Nuxt 4 frontend application** for **Blanco Finanças**.
- The application is divided into three main areas:
  1. **Public / Auth:** Landing page, Login, Password Recovery.
  2. **Client Portal:** Dashboard, Plans, Payments (Pix), Withdrawals, Support.
  3. **Admin Panel:** Client Management, Cash Flow, Conciliation, Reports.
- The UI is built with **Nuxt UI (`@nuxt/ui`)** and a starter template structure.
- Global styling is applied via `app/assets/css/main.css`.

---

## Agent Workflow (Antigravity-Specific)

When working on tasks of any non-trivial complexity, Antigravity must follow its structured agentic workflow:

1. **PLANNING mode** — Research the existing structure, understand the requirement, design the approach, and write an `implementation_plan.md`. Request user review before writing code.
2. **EXECUTION mode** — Implement the plan. Return to PLANNING if unexpected complexity is discovered.
3. **VERIFICATION mode** — Open the browser to validate the UI, run linting/type checks, and produce a `walkthrough.md` with proof of work (screenshots or recordings).

For every significant change, a `task.md` checklist must be maintained and kept up-to-date.

### When to Stop and Ask

The agent **must stop and use `notify_user`** when:

- A backend endpoint or response shape is missing or undocumented.
- Business logic or validation rules for a feature are not defined.
- A new dependency is required (requires explicit justification).
- An architectural boundary in `frontend-guardrails.md` would need to be violated.

**Do not invent backend fields, endpoints, financial formulas, or business rules.**

---

## Key Locations

- **Nuxt config:** `nuxt.config.ts`
  - Modules: `@nuxt/eslint`, `@nuxt/ui`, `@nuxt/hints`
- **App entry shell:** `app/app.vue`

### Routing Structure (`app/pages/`)

| Route | Purpose |
|---|---|
| `index.vue` | Public landing page |
| `auth/index.vue` | Login |
| `auth/recover.vue` | Password recovery |
| `client/dashboard.vue` | Balance summary, yield history |
| `client/plans.vue` | Plan selection, contract, active plan |
| `client/finance.vue` | Pix QR deposit, withdrawal requests |
| `client/support.vue` | Chat and help desk |
| `admin/clients.vue` | Client list with filters |
| `admin/finance.vue` | Cash flow, conciliation, Fundo Garantidor |
| `admin/reports.vue` | Export data |

### Reusable Components (`app/components/`)

- `App/` — Layout components (Header, Sidebar)
- `Client/` — Client widgets (BalanceCard, YieldChart)
- `Admin/` — Admin widgets (ClientTable, StatusBadge)

### Composables (`app/composables/`)

- `useAuth.ts` — Session management
- `useCurrency.ts` — BRL value formatting

---

## Runtime & Dependencies

- **Package manager:** `pnpm@10.26.1`
- **Primary dependencies:** `nuxt`, `@nuxt/ui`, `@nuxt/eslint`, `typescript`
- Do not add external charting or PDF libraries unless necessary. Prefer native browser capabilities or Nuxt UI elements.

---

## Implementation Requirements (Mapped to User Stories)

### 1. Authentication & Security (H01)

- Implement `middleware/auth.ts` to protect `/client` and `/admin` routes.
- Login page must differentiate between Client and Admin redirection.
- Inputs must be masked/validated (CPF/CNPJ, Email).

### 2. Client Portal Features

- **Dashboard (H03):** Cards for "Total Balance", "Yield this Month", "Next Payment".
- **Plans & Contracts (H02):** View plan details (Geral vs Pequeno Agricultor). "View Contract" button handles PDF Blob response from API.
- **Payments (H04, H05):** Pix QR Code component. Installment history timeline (Paid vs Pending).
- **Withdrawals (H06):** Bank info form. Display withdrawal status (Pending/Approved).

### 3. Admin Panel Features

- **Client Management (H07):** `UTable` with search and status filtering (Ativo, Inativo, Inadimplente).
- **Financial Control (H08, H10):** Fundo Garantidor dashboard. Cash flow table (Inflow/Outflow).
- **Exports (H09):** Buttons triggering backend export endpoints (Excel/.csv).

### 4. Communication (H11, H12, H13)

- **Chat UI:** `client/support.vue` using Nuxt UI `UCard`, `UInput`, `UButton`.
- **Notifications:** Nuxt UI `UToast` for deposit confirmations and errors.

---

## Conventions

### Routing
Adhere strictly to `app/pages/client/` and `app/pages/admin/` structure.

### Data Fetching
Use the centralized API composable with a configured `baseURL` (from runtime config). Never call `useFetch` directly in pages or components.

### Styling
- Use Tailwind utility classes provided by Nuxt UI.
- Use `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` for all monetary display.

### Validation
- CPF/CNPJ validation must use deterministic checksum algorithms — regex-only is insufficient.
- Frontend validation is UX-only; backend validation is authoritative.

---

## Mocking Policy

When backend endpoints are not ready, a mock composable `composables/useMockData.ts` may be created to simulate API responses. Mocks must simulate API response shapes accurately and return static placeholder values. Mocks must **not** implement financial formulas or approximate yields. Placeholders must be clearly labeled.

---

## Critical Reminders for the Agent

- **Do not invent** backend fields, endpoints, or behaviors not present in the API documentation.
- **Never store** sensitive tokens or passwords in `localStorage`.
- **Fail loudly:** Unexpected or partial data must block rendering and be clearly surfaced to the user.
- **Security:** Route protection is not authorization — all privileged actions must be authorized server-side.
- The `frontend-guardrails.md` is the final authority. It overrides any suggestion, convention, or shortcut.
