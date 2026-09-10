import { getSimulatorInstallmentBounds, getSimulatorBrands } from '@/lib/actions/card-simulator'
import { CardSimulator } from './CardSimulator'

export const metadata = { title: 'Simulador de parcelamento' }

export default async function SimuladorPage() {
  const [bounds, brands] = await Promise.all([getSimulatorInstallmentBounds(), getSimulatorBrands()])

  return (
    <div className="flex min-h-screen items-start justify-center bg-neutral-50 px-4 py-10 sm:items-center">
      <CardSimulator minInstallments={bounds.min} maxInstallments={bounds.max} brands={brands} />
    </div>
  )
}
