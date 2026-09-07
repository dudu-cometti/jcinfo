import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatBRL(value: number) {
  return BRL_FORMATTER.format(value)
}

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const DATETIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value: string | Date) {
  return DATE_FORMATTER.format(new Date(value))
}

export function formatDateTime(value: string | Date) {
  return DATETIME_FORMATTER.format(new Date(value))
}

/** Keeps only digits, so "(11) 99999-9999" and "11999999999" dedupe to the same customer. */
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function normalizeCpf(cpf: string) {
  return cpf.replace(/\D/g, '')
}

/** Standard CPF check-digit algorithm, not just a digit-count/format check. */
export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const digits = cpf.split('').map(Number)

  const checkDigit = (length: number) => {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i)
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10]
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
