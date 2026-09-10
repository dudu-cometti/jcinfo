'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Field, Select } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/utils'
import { simulateCardFee, type SimulateCardFeeState } from '@/lib/actions/card-simulator'

export function CardSimulator({
  minInstallments,
  maxInstallments,
  brands,
}: {
  minInstallments: number
  maxInstallments: number
  brands: string[]
}) {
  const [value, setValue] = useState(0)
  const [installments, setInstallments] = useState(minInstallments)
  const [cardBrand, setCardBrand] = useState('')
  const [result, setResult] = useState<SimulateCardFeeState | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCalculate() {
    if (!value || value <= 0) {
      setResult({ error: 'Informe um valor.' })
      return
    }
    startTransition(async () => {
      const state = await simulateCardFee(value, installments, cardBrand || null)
      setResult(state)
    })
  }

  const installmentOptions = Array.from(
    { length: maxInstallments - minInstallments + 1 },
    (_, i) => minInstallments + i,
  )

  return (
    <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col items-center gap-3 text-center">
        <Image src="/logo.jpg" alt="JC Info" width={160} height={47} priority />
        <div>
          <h1 className="text-base font-semibold text-neutral-900">Simulador de parcelamento</h1>
          <p className="mt-1 text-xs text-neutral-500">Veja o valor total no cartão, sem compromisso.</p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="Valor à vista" htmlFor="sim-value">
          <CurrencyInput id="sim-value" value={value} onValueChange={setValue} />
        </Field>

        <Field label="Parcelas" htmlFor="sim-installments">
          <Select
            id="sim-installments"
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
          >
            {installmentOptions.map((n) => (
              <option key={n} value={n}>
                {n}x
              </option>
            ))}
          </Select>
        </Field>

        {brands.length > 0 && (
          <Field label="Bandeira" htmlFor="sim-brand" hint="Opcional">
            <Select id="sim-brand" value={cardBrand} onChange={(e) => setCardBrand(e.target.value)}>
              <option value="">Qualquer bandeira</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Button className="w-full" disabled={isPending} onClick={handleCalculate}>
          {isPending ? 'Calculando...' : 'Calcular'}
        </Button>

        {result && 'error' in result && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">{result.error}</p>
        )}

        {result && !('error' in result) && (
          <div className="space-y-1 rounded-xl bg-brand-navy/5 p-4 text-center">
            {result.installments > 1 ? (
              <>
                <p className="text-xs text-neutral-500">Valor parcelado</p>
                <p className="text-2xl font-semibold text-brand-navy">
                  {result.installments}x de {formatBRL(result.installmentValue)}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-neutral-500">Valor no cartão</p>
                <p className="text-2xl font-semibold text-brand-navy">{formatBRL(result.finalValue)}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
