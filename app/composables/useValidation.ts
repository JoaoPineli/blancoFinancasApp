/**
 * Validation composable.
 * Per guardrails:
 * - Frontend validation is for UX only, not authoritative
 * - CPF/CNPJ must use deterministic checksum algorithms
 * - Regex-only validation is forbidden for identifiers
 */

export function useValidation() {
  /**
   * Validates CPF using the official checksum algorithm.
   * Per guardrails: Regex-only validation is insufficient and forbidden.
   */
  function validateCpf(cpf: string): boolean {
    // Remove non-digits
    const cleaned = cpf.replace(/\D/g, '')

    // Must be 11 digits
    if (cleaned.length !== 11) return false

    // Reject known invalid patterns
    if (/^(\d)\1+$/.test(cleaned)) return false

    // Calculate first check digit
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10) remainder = 0
    if (remainder !== parseInt(cleaned.charAt(9))) return false

    // Calculate second check digit
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10) remainder = 0
    if (remainder !== parseInt(cleaned.charAt(10))) return false

    return true
  }

  /**
   * Validates CNPJ using the official checksum algorithm.
   * Per guardrails: Regex-only validation is insufficient and forbidden.
   */
  function validateCnpj(cnpj: string): boolean {
    // Remove non-digits
    const cleaned = cnpj.replace(/\D/g, '')

    // Must be 14 digits
    if (cleaned.length !== 14) return false

    // Reject known invalid patterns
    if (/^(\d)\1+$/.test(cleaned)) return false

    // Weights for calculation
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    // Calculate first check digit
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned.charAt(i)) * (weights1[i] as number)
    }
    let remainder = sum % 11
    const digit1 = remainder < 2 ? 0 : 11 - remainder
    if (digit1 !== parseInt(cleaned.charAt(12))) return false

    // Calculate second check digit
    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned.charAt(i)) * (weights2[i] as number)
    }
    remainder = sum % 11
    const digit2 = remainder < 2 ? 0 : 11 - remainder
    if (digit2 !== parseInt(cleaned.charAt(13))) return false

    return true
  }

  /**
   * Validates CPF or CNPJ based on length.
   */
  function validateCpfCnpj(value: string): boolean {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 11) return validateCpf(value)
    if (cleaned.length === 14) return validateCnpj(value)
    return false
  }

  /**
   * Validates email format.
   */
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Formats CPF as XXX.XXX.XXX-XX
   */
  function formatCpf(value: string): string {
    const cleaned = value.replace(/\D/g, '').slice(0, 11)
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  /**
   * Formats CNPJ as XX.XXX.XXX/XXXX-XX
   */
  function formatCnpj(value: string): string {
    const cleaned = value.replace(/\D/g, '').slice(0, 14)
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  /**
   * Formats CPF or CNPJ based on length.
   */
  function formatCpfCnpj(value: string): string {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) return formatCpf(value)
    return formatCnpj(value)
  }

  return {
    validateCpf,
    validateCnpj,
    validateCpfCnpj,
    validateEmail,
    formatCpf,
    formatCnpj,
    formatCpfCnpj
  }
}
