# Copilot instructions (blancoFinancasApp)

## Big picture

- This folder contains the Nuxt 4 frontend application for **Blanco Finanças**.
- The application is divided into three main areas:
  1. **Public/Auth**: Landing page, Login, Password Recovery.
  2. **Client Portal**: Dashboard, Plans, Payments (Pix), Withdrawals, Support.
  3. **Admin Panel**: Client Management, Cash Flow, Conciliation, Reports.
- The UI is built with Nuxt UI (`@nuxt/ui`) and a starter template structure.
- Global styling is applied via `app/assets/css/main.css`.
- ARCHITECTURE_AND_GUARDRAILS.md is the rulebook for this application, everything listed there should be followed to the dot.

## Key locations

- Nuxt config: `nuxt.config.ts`
  - Modules: `@nuxt/eslint`, `@nuxt/ui`, `@nuxt/hints`
- App entry shell: `app/app.vue`
- **Routing Structure (`app/pages/`):**
  - `index.vue`: Public landing page.
  - `auth/`: Login (`index.vue`), Recover Password (`recover.vue`).
  - `client/`: Protected routes for investors.
    - `dashboard.vue`: Balance summary, yield history.
    - `plans.vue`: Plan selection, contract generation, active plan details.
    - `finance.vue`: Deposit generation (Pix QR), withdrawal requests.
    - `support.vue`: Chat and help desk.
  - `admin/`: Protected routes for Blanco staff.
    - `clients.vue`: List of users, filtering (Active/Inactive/Defaulting).
    - `finance.vue`: Cash flow, conciliation, Fundo Garantidor metrics.
    - `reports.vue`: Export data logic.
- Reusable Components (`app/components/`):
  - `App/`: Layout specific components (Header, Sidebar).
  - `Client/`: Specific widgets (BalanceCard, YieldChart).
  - `Admin/`: Admin widgets (ClientTable, StatusBadge).
- Composables (`app/composables/`):
  - `useAuth.ts`: Session management.
  - `useCurrency.ts`: Formatting BRL values.

## Runtime and dependencies

- Package manager: `pnpm@10.26.1`.
- Primary dependencies: `nuxt`, `@nuxt/ui`, `@nuxt/eslint`, `typescript`.
- **Note:** Do not add external charting or PDF libraries unless necessary. Try to use native browser capabilities or Nuxt UI elements first.

## Implementation Requirements (Mapped to User Stories)

### 1. Authentication & Security (H01)

- Implement `middleware/auth.ts` to protect `/client` and `/admin` routes.
- Login page must differentiate between Client and Admin redirection logic.
- Inputs must be masked/validated (CPF/CNPJ, Email).

### 2. Client Portal Features

- **Dashboard (H03):** Display cards for "Total Balance", "Yield this Month", and "Next Payment".
- **Plans & Contracts (H02):**
  - View plan details (Geral vs Pequeno Agricultor).
  - Button to "View Contract" (Handle PDF Blob response from API).
- **Payments (H04, H05):**
  - Visual component to render Pix QR Code string.
  - Timeline/List view for "Installment History" (Paid vs Pending).
- **Withdrawals (H06):**
  - Form to request withdrawal (Bank info inputs).
  - Display withdrawal status (Pending/Approved).

### 3. Admin Panel Features

- **Client Management (H07):**
  - Use `UTable` (Nuxt UI) to list clients.
  - Implement search and status filtering (Ativo, Inativo, Inadimplente).
- **Financial Control (H08, H10):**
  - Dashboard showing "Fundo Garantidor" accumulation.
  - Cash flow view (Table with Inflow/Outflow).
- **Exports (H09):**
  - Buttons to trigger backend export endpoints (Excel/.csv).

### 4. Communication (H11, H12, H13)

- **Chat UI:** Simple chat interface in `client/support.vue` utilizing Nuxt UI `UCard`, `UInput`, and `UButton`.
- **Notifications:** Use Nuxt UI `UToast` (Notifications) for alerts on deposit confirmations or errors.

## Conventions for changes

- **Routing:** adhere strictly to the `app/pages/client/` and `app/pages/admin/` structure.
- **Data Fetching:** Use `useFetch` with a configured `baseURL` (from runtime config) for all API interactions.
- **Styling:**
  - Use Tailwind utility classes provided by Nuxt UI.
  - Use `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` for all monetary values.
- **State:** Use `useState` for simple shared state (e.g., User Profile). Avoid adding Pinia unless state complexity becomes unmanageable.

## Notes for AI agents

- **Mocking:** If backend endpoints are not ready, a mock composable may be created to simulate API responses for the Dashboard and Tables (static placeholders only; never implement financial formulas).
- **Security:** Never store plain-text passwords or sensitive tokens in `localStorage`. Use `useCookie` for session tokens with appropriate security flags.
- **Validation:** Enforce frontend validation for CPF and Currency inputs before sending to the API.
- Follow the ARCHITECTURE_AND_GUARDRAILS.md file to the dot no mater what
