/**
 * AdminPlan type — represents configurable plan parameters.
 *
 * Source of truth is the backend API.
 * This is a structural type only (no calculations).
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
