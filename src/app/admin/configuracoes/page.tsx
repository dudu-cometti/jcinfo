import { getSiteSettings } from '@/lib/data/settings'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SettingsForm } from './SettingsForm'

export const metadata = { title: 'Configurações' }

const TRACKING_ENV_VARS = [
  { key: 'NEXT_PUBLIC_GA_MEASUREMENT_ID', label: 'Google Analytics' },
  { key: 'NEXT_PUBLIC_GTM_ID', label: 'Google Tag Manager' },
  { key: 'NEXT_PUBLIC_META_PIXEL_ID', label: 'Meta Pixel' },
]

export default async function AdminConfiguracoesPage() {
  const settings = await getSiteSettings()

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-6">
      <Card>
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Configurações gerais</h1>
        <SettingsForm whatsappNumber={settings.whatsapp_number} siteName={settings.site_name} />
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900">Tracking (Google / Meta)</h2>
        <p className="mb-3 text-sm text-neutral-500">
          IDs de rastreamento são configurados por variável de ambiente (nunca no banco), definidos no
          arquivo <code className="rounded bg-neutral-100 px-1 py-0.5">.env.local</code> e no painel da Vercel.
        </p>
        <ul className="space-y-2">
          {TRACKING_ENV_VARS.map((item) => (
            <li key={item.key} className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">
                {item.label} <code className="text-xs text-neutral-400">{item.key}</code>
              </span>
              <Badge tone={process.env[item.key] ? 'green' : 'neutral'}>
                {process.env[item.key] ? 'Configurado' : 'Não configurado'}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
