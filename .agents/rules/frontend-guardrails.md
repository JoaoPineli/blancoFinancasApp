# Frontend Architecture & Guardrails

**blancoFinancasApp – Finance-Grade Frontend Rules**

This document defines **non-negotiable rules** for the Blanco Finanças frontend.
It exists to prevent subtle financial, security, and architectural errors.
If something is not explicitly allowed here, assume it is forbidden.

This applies equally to:

- Human developers
- AI agents
- Temporary mock implementations

---

## 1. Architectural Authority & Boundaries

### 1.1 Separation of Responsibilities (Hard Rules)

**Pages (`app/pages/`)**

- MAY:
  - Orchestrate data fetching
  - Pass data to components
  - Handle routing and navigation
- MUST NOT:
  - Contain business logic
  - Perform calculations (financial or otherwise)
  - Transform backend data beyond trivial mapping

**Components (`app/components/`)**

- MAY:
  - Render UI
  - Emit user intent (events)
- MUST NOT:
  - Fetch data directly
  - Perform financial calculations
  - Make authorization decisions

**Composables (`app/composables/`)**

- ARE the only place where:
  - API interaction happens
  - Data normalization happens
  - Error handling is defined
- MUST:
  - Return predictable, typed shapes
  - Never mutate data silently

Violation of these boundaries is considered a defect, not a style issue.

---

## 2. Financial Correctness (Zero Tolerance Area)

### 2.1 Numerical Rules

- The frontend **must never**:
  - Calculate balances
  - Calculate yields
  - Calculate interest
  - Aggregate financial totals

All such values **must come from the backend already computed**.

### 2.2 Precision Rules

- Floating-point math is forbidden for money.
- Monetary values must be:
  - Provided by the backend as integers (cents) or fixed-precision strings
  - Treated as opaque values on the frontend

### 2.3 Formatting vs Logic

- `Intl.NumberFormat` is **presentation only**
- No logic may depend on formatted values
- Parsing formatted currency back into numbers is forbidden

---

## 3. Data Fetching & API Discipline

### 3.1 Single API Gateway

All HTTP interaction must go through a single composable responsible for:

- Attaching auth credentials
- Normalizing errors
- Handling expired sessions
- Rejecting unexpected response shapes

Direct `useFetch` calls in pages or components are forbidden.

### 3.2 Error Normalization

All API errors must resolve into a shared shape:

```ts
{
  code: string
  message: string
  httpStatus: number
}
```

### 3.3 Authentication Failure Handling

- **401 (Unauthorized)**:
  - Immediately invalidate all local session state.
  - Remove authentication cookies via `useCookie`.
  - Redirect the user to the login screen.
  - Do **not** retry the request automatically.
- **403 (Forbidden)**:
  - Treat as a role or permission violation.
  - Display an explicit authorization error to the user.
  - Do **not** downgrade, retry, or silently ignore the error.

Silent auth failures are forbidden.

---

## 4. Authentication & Session Security

### 4.1 Session Storage Rules

- Authentication tokens must be stored **only** in cookies.
- Cookies must be created using `useCookie` with:
  - `httpOnly: true`
  - `secure: true`
  - `sameSite: 'strict'`
- Tokens must never be:
  - Stored in `localStorage` or `sessionStorage`
  - Embedded in URLs
  - Logged to the console

Any violation is a security defect.

### 4.2 Session Expiration & Refresh

- The frontend must assume sessions can expire at any time.
- On expiration:
  - All protected UI must immediately lock.
  - Cached sensitive data must be cleared.
- Token refresh, if supported, must be handled centrally in the API layer.

If refresh behavior is undefined, forced logout is the correct behavior.

### 4.3 Role Enforcement

- Route protection is **not** authorization.
- Every privileged action must be authorized server-side.
- The frontend must assume routes can be manually accessed and requests can be replayed.

Admin UI access does not imply admin privileges.

---

## 5. Validation Strategy

### 5.1 Scope of Frontend Validation

Frontend validation exists only to:

- Improve user experience
- Prevent obvious input errors
- Apply formatting and masking

Frontend validation must never be treated as authoritative or complete.

### 5.2 Backend Parity Rule

- Frontend validation rules must match backend rules exactly.
- If backend constraints are unknown or undocumented:
  - Validate minimally
  - Do not infer limits, formats, or ranges

When in doubt, allow input and let the backend reject it.

### 5.3 Deterministic Identifier Validation

- CPF and CNPJ validation must use deterministic checksum algorithms.
- Regex-only validation is insufficient and forbidden.

---

## 6. Admin Panel Risk Controls

### 6.1 Destructive Action Safeguards

- Any destructive or irreversible action must:
  - Require explicit user confirmation
  - Clearly state consequences
  - Prevent accidental execution (no single-click execution)

Undo assumptions are forbidden unless explicitly supported by the backend.

### 6.2 Read vs Write Separation

- Read-only views must be visually distinct from mutable interfaces.
- Write actions must be intentional, clearly labeled, and never triggered implicitly.

Silent mutations are unacceptable.

---

## 7. State Management Rules

### 7.1 Allowed Global State

Global state (`useState`) is restricted to:

- Authenticated user profile
- UI coordination state (layout, theme, toggles)

Financial or transactional data must not be globally cached by default.

### 7.2 State Lifecycle Discipline

- State must have a clear owner and a defined lifecycle.
- Stale state must be purged on:
  - Logout
  - Role change
  - Authentication failure

Implicit persistence is forbidden.

---

## 8. Dependency Policy

Adding new dependencies is disallowed by default.

A new dependency may be introduced only if it:

- Improves security, numerical correctness, or long-term maintainability
- Does not duplicate existing framework or platform features
- Has its impact on bundle size and attack surface evaluated

Developer convenience is not a valid justification.

---

## 9. Mocking & Test Data

Mocks may:

- Simulate API response shapes
- Return static or placeholder financial values

Mocks must never:

- Implement financial formulas
- Approximate yields, interest, or balances
- Mask missing backend contracts

Uncertainty and placeholders must be clearly labeled. Guessing is a defect.

---

## 10. AI Agent Constraints

This document applies to all AI agents, including **Antigravity**.

AI must not:

- Invent backend fields, endpoints, or behaviors
- Infer financial calculations
- Assume business rules not explicitly stated

If information is missing, the AI must surface the gap explicitly — using `notify_user` in the case of Antigravity — instead of filling it with assumptions.

---

## 11. Failure Philosophy

In financial systems, failing loudly is safer than failing silently.

- Unexpected states must block execution or UI rendering
- Partial or degraded data must be clearly identified
- Silent fallbacks are forbidden

---

## 12. Final Principle

Any change that:

- Risks financial correctness
- Weakens security guarantees
- Blurs responsibility boundaries

Is incorrect by default and requires explicit justification.
