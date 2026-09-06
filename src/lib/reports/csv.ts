function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string }[],
): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(';')
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(';'))
  return ['﻿' + header, ...lines].join('\n')
}
