/**
 * Mock data composable for development.
 * Per guardrails:
 * - Mocks may return static or placeholder financial values
 * - Mocks must NEVER implement financial formulas
 * - All values must be clearly labeled as mock data
 * - Uncertainty must be explicit
 */

// Types for mock data
export interface Plan {
  id: string
  name: string
  description: string
  minInvestmentCents: number
  yieldRateMonthly: number // Decimal from backend, e.g., 0.015 for 1.5%
  termMonths: number
}

/**
 * Admin Plan interface - represents configurable plan parameters.
 * All values come from the backend. No calculations performed here. * Null values for maxValueCents and maxDurationMonths mean indefinite (no limit).
 */
export interface AdminPlan {
  id: string
  title: string
  description: string // Markdown text
  minValueCents: number
  maxValueCents: number | null // null = indefinite
  minDurationMonths: number
  maxDurationMonths: number | null // null = indefinite
  adminTaxValueCents: number
  insurancePercent: number // 0-100
  guaranteeFundPercent1: number // 0-100
  guaranteeFundPercent2: number // 0-100
  guaranteeFundThresholdCents: number
  active: boolean
}

export interface ClientDashboard {
  totalBalanceCents: number
  yieldThisMonthCents: number
  nextPaymentCents: number
  nextPaymentDate: string
  activePlanId: string | null
}

export interface Installment {
  id: string
  dueDate: string
  amountCents: number
  status: 'paid' | 'pending' | 'overdue'
  paidAt: string | null
}

export interface Withdrawal {
  id: string
  requestedAt: string
  amountCents: number
  status: 'pending' | 'approved' | 'rejected'
  bankName: string
  accountNumber: string
}

export interface Client {
  id: string
  name: string
  email: string
  cpfCnpj: string
  status: 'active' | 'inactive' | 'defaulting'
  totalInvestedCents: number
  joinedAt: string
}

export interface CashFlowEntry {
  id: string
  date: string
  description: string
  type: 'inflow' | 'outflow'
  amountCents: number
  category: string
}

export interface AdminFinanceSummary {
  fundoGarantidorCents: number
  totalInflowCents: number
  totalOutflowCents: number
  netBalanceCents: number
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  sentAt: string
  isAdmin: boolean
}

export function useMockData() {
  // ============================================
  // MOCK DATA - All values are static placeholders
  // Per guardrails: These do NOT implement any financial formulas
  // ============================================

  const plans: Plan[] = [
    {
      id: 'plan-geral',
      name: 'Plano Geral',
      description: 'Investimento com rendimentos mensais para todos os perfis de investidor.',
      minInvestmentCents: 100000, // R$ 1.000,00
      yieldRateMonthly: 0.015, // 1.5% (provided by backend)
      termMonths: 12
    },
    {
      id: 'plan-agricultor',
      name: 'Pequeno Agricultor',
      description: 'Plano especial com condições diferenciadas para pequenos agricultores.',
      minInvestmentCents: 50000, // R$ 500,00
      yieldRateMonthly: 0.018, // 1.8% (provided by backend)
      termMonths: 24
    }
  ]

  // Admin plans - configuration parameters only (no calculations)
  const adminPlans: AdminPlan[] = [
    {
      id: 'plan-geral',
      title: 'Plano Geral',
      description: `# Plano Geral

Investimento com rendimentos mensais para todos os perfis de investidor.

## Como funciona

O Plano Geral oferece uma opção flexível de investimento com rendimentos baseados na poupança.

## Vantagens

- Flexibilidade de valores
- Rendimentos mensais
- Proteção do Fundo de proteção`,
      minValueCents: 100000, // R$ 1.000,00
      maxValueCents: 10000000, // R$ 100.000,00
      minDurationMonths: 6,
      maxDurationMonths: 36,
      adminTaxValueCents: 5000, // R$ 50,00
      insurancePercent: 2.5,
      guaranteeFundPercent1: 1.0,
      guaranteeFundPercent2: 1.3,
      guaranteeFundThresholdCents: 5000000, // R$ 50.000,00
      active: true
    },
    {
      id: 'plan-agricultor',
      title: 'Pequeno Agricultor',
      description: `# Pequeno Agricultor

Plano especial com condições diferenciadas para pequenos agricultores.

## Como funciona

Condições especiais para agricultores com valores mínimos reduzidos.

## Vantagens

- Valores mínimos reduzidos
- Taxa administrativa diferenciada
- Suporte especializado`,
      minValueCents: 50000, // R$ 500,00
      maxValueCents: 5000000, // R$ 50.000,00
      minDurationMonths: 12,
      maxDurationMonths: 48,
      adminTaxValueCents: 2500, // R$ 25,00
      insurancePercent: 1.5,
      guaranteeFundPercent1: 1.0,
      guaranteeFundPercent2: 1.2,
      guaranteeFundThresholdCents: 2500000, // R$ 25.000,00
      active: true
    }
  ]

  const clientDashboard: ClientDashboard = {
    totalBalanceCents: 1523450, // R$ 15.234,50 (from backend)
    yieldThisMonthCents: 22850, // R$ 228,50 (from backend)
    nextPaymentCents: 22850, // R$ 228,50 (from backend)
    nextPaymentDate: '2026-02-15',
    activePlanId: 'plan-geral'
  }

  const installments: Installment[] = [
    {
      id: 'inst-1',
      dueDate: '2025-12-15',
      amountCents: 22500,
      status: 'paid',
      paidAt: '2025-12-14'
    },
    {
      id: 'inst-2',
      dueDate: '2026-01-15',
      amountCents: 22650,
      status: 'paid',
      paidAt: '2026-01-14'
    },
    {
      id: 'inst-3',
      dueDate: '2026-02-15',
      amountCents: 22850,
      status: 'pending',
      paidAt: null
    },
    {
      id: 'inst-4',
      dueDate: '2026-03-15',
      amountCents: 23000,
      status: 'pending',
      paidAt: null
    }
  ]

  const withdrawals: Withdrawal[] = [
    {
      id: 'wd-1',
      requestedAt: '2025-11-20',
      amountCents: 500000,
      status: 'approved',
      bankName: 'Banco do Brasil',
      accountNumber: '****1234'
    },
    {
      id: 'wd-2',
      requestedAt: '2026-01-10',
      amountCents: 200000,
      status: 'pending',
      bankName: 'Nubank',
      accountNumber: '****5678'
    }
  ]

  const clients: Client[] = [
    {
      id: 'client-1',
      name: 'João Silva',
      email: 'joao@email.com',
      cpfCnpj: '123.456.789-00',
      status: 'active',
      totalInvestedCents: 1500000,
      joinedAt: '2025-06-15'
    },
    {
      id: 'client-2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      cpfCnpj: '987.654.321-00',
      status: 'active',
      totalInvestedCents: 2500000,
      joinedAt: '2025-07-20'
    },
    {
      id: 'client-3',
      name: 'Pedro Oliveira',
      email: 'pedro@email.com',
      cpfCnpj: '456.789.123-00',
      status: 'inactive',
      totalInvestedCents: 0,
      joinedAt: '2025-08-10'
    },
    {
      id: 'client-4',
      name: 'Ana Costa',
      email: 'ana@email.com',
      cpfCnpj: '321.654.987-00',
      status: 'defaulting',
      totalInvestedCents: 750000,
      joinedAt: '2025-05-01'
    },
    {
      id: 'client-5',
      name: 'Carlos Ferreira',
      email: 'carlos@email.com',
      cpfCnpj: '111.222.333-44',
      status: 'active',
      totalInvestedCents: 3200000,
      joinedAt: '2025-04-12'
    }
  ]

  const cashFlow: CashFlowEntry[] = [
    {
      id: 'cf-1',
      date: '2026-01-14',
      description: 'Depósito - João Silva',
      type: 'inflow',
      amountCents: 500000,
      category: 'Depósito'
    },
    {
      id: 'cf-2',
      date: '2026-01-13',
      description: 'Saque - Maria Santos',
      type: 'outflow',
      amountCents: 200000,
      category: 'Saque'
    },
    {
      id: 'cf-3',
      date: '2026-01-12',
      description: 'Rendimento distribuído',
      type: 'outflow',
      amountCents: 150000,
      category: 'Rendimento'
    },
    {
      id: 'cf-4',
      date: '2026-01-10',
      description: 'Depósito - Carlos Ferreira',
      type: 'inflow',
      amountCents: 1000000,
      category: 'Depósito'
    },
    {
      id: 'cf-5',
      date: '2026-01-08',
      description: 'Taxa administrativa',
      type: 'outflow',
      amountCents: 50000,
      category: 'Taxa'
    }
  ]

  const adminFinanceSummary: AdminFinanceSummary = {
    fundoGarantidorCents: 5000000, // R$ 50.000,00 (from backend)
    totalInflowCents: 15000000, // R$ 150.000,00 (from backend)
    totalOutflowCents: 4000000, // R$ 40.000,00 (from backend)
    netBalanceCents: 11000000 // R$ 110.000,00 (from backend)
  }

  const chatMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      senderId: 'admin-1',
      senderName: 'Suporte Blanco',
      content: 'Olá! Como posso ajudar você hoje?',
      sentAt: '2026-01-14T10:00:00',
      isAdmin: true
    },
    {
      id: 'msg-2',
      senderId: 'client-1',
      senderName: 'João Silva',
      content: 'Bom dia! Gostaria de saber sobre o rendimento deste mês.',
      sentAt: '2026-01-14T10:05:00',
      isAdmin: false
    },
    {
      id: 'msg-3',
      senderId: 'admin-1',
      senderName: 'Suporte Blanco',
      content: 'Claro! O rendimento deste mês está disponível no seu dashboard. Você já conferiu?',
      sentAt: '2026-01-14T10:07:00',
      isAdmin: true
    }
  ]

  // Mock Pix QR Code string (placeholder)
  const mockPixQrCode = '00020126580014br.gov.bcb.pix0136mock-pix-key-placeholder-for-development5204000053039865802BR5925BLANCO FINANCAS LTDA6009SAO PAULO62070503***6304MOCK'

  return {
    plans,
    adminPlans,
    clientDashboard,
    installments,
    withdrawals,
    clients,
    cashFlow,
    adminFinanceSummary,
    chatMessages,
    mockPixQrCode,

    // Helper functions to get data
    getPlanById: (id: string) => plans.find(p => p.id === id),
    getAdminPlanById: (id: string) => adminPlans.find(p => p.id === id),
    getClientById: (id: string) => clients.find(c => c.id === id),
    filterClientsByStatus: (status: Client['status'] | 'all') =>
      status === 'all' ? clients : clients.filter(c => c.status === status),
    filterAdminPlansByTitle: (search: string) =>
      adminPlans.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
  }
}
