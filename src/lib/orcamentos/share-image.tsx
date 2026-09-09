import { readFile } from 'node:fs/promises'
import path from 'node:path'

const BRAND = { cyan: '#24c9ff', teal: '#0085b2', navy: '#17599f' }

let logoDataUri: string | null = null
/** Satori/ImageResponse needs images as URLs or data URIs, not filesystem paths — read once, cache in memory. */
export async function getLogoDataUri(): Promise<string> {
  if (!logoDataUri) {
    const buffer = await readFile(path.join(process.cwd(), 'public/logo.jpg'))
    logoDataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`
  }
  return logoDataUri
}

/** Defensive: strip control characters and cap length before interpolating any DB-sourced string. */
function safeText(value: string | null | undefined, maxLength = 120): string {
  if (!value) return ''
  return value.replace(/[\x00-\x1f\x7f]/g, '').slice(0, maxLength)
}

const METHOD_LABELS: Record<string, string> = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' }

export type ShareImageSnapshot = {
  orcamentoId: string
  customerFirstName: string
  createdAt: string
  expiresAt: string | null
  subtotal: number
  discount: number
  freightValue: number
  finalValue: number
  machineName: string | null
  paymentMethod: string | null
  installments: number
  installmentValue: number | null
  lastInstallmentValue: number | null
  items: { productName: string; variantColor: string | null; imageUrl: string | null; quantity: number; subtotal: number }[]
  warrantyText: string
  storeAddress: string
  whatsappNumber: string
}

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function buildShareImageElement(snapshot: ShareImageSnapshot, logoSrc: string) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '32px 40px',
          background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.teal})`,
          color: '#ffffff',
        }}
      >
        {/* logo.jpg is a wide 1600x474 lockup, not a square icon — fixed
            box + objectFit:contain keeps its real aspect ratio instead of
            squishing it into a square. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={140}
          height={42}
          style={{ objectFit: 'contain', borderRadius: 6, background: '#ffffff', padding: 4 }}
          alt=""
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Orçamento</div>
          <div style={{ display: 'flex', fontSize: 16, opacity: 0.9 }}>
            #{safeText(snapshot.orcamentoId, 8)} · {formatDate(snapshot.createdAt)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 40px', gap: 16 }}>
        <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, color: '#171717' }}>
          Olá, {safeText(snapshot.customerFirstName, 40)}!
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {snapshot.items.slice(0, 8).map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 12,
                border: '1px solid #e5e5e5',
              }}
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} width={56} height={56} style={{ borderRadius: 8, objectFit: 'cover' }} alt="" />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f5f5f5' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#171717' }}>{safeText(item.productName, 60)}</div>
                <div style={{ display: 'flex', fontSize: 13, color: '#737373' }}>
                  {item.variantColor ? `${safeText(item.variantColor, 30)} · ` : ''}
                  {item.quantity}x
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#171717' }}>{brl(item.subtotal)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 16, borderRadius: 12, background: '#f7fbff' }}>
          <Row label="Subtotal" value={brl(snapshot.subtotal)} />
          {snapshot.discount > 0 && <Row label="Desconto" value={`-${brl(snapshot.discount)}`} />}
          {snapshot.freightValue > 0 && <Row label="Frete" value={`+${brl(snapshot.freightValue)}`} />}
          <Row label="Forma de pagamento" value={`${METHOD_LABELS[snapshot.paymentMethod ?? ''] ?? '-'}${snapshot.machineName ? ` · ${safeText(snapshot.machineName, 30)}` : ''}`} />
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `2px solid ${BRAND.navy}` }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: BRAND.navy }}>Total</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: BRAND.navy }}>{brl(snapshot.finalValue)}</div>
          </div>
          {snapshot.installments > 1 ? (
            <div style={{ display: 'flex', fontSize: 14, color: '#525252' }}>
              {snapshot.installments - 1}x de {brl(snapshot.installmentValue ?? 0)} + 1x de {brl(snapshot.lastInstallmentValue ?? 0)}
            </div>
          ) : (
            <div style={{ display: 'flex', fontSize: 14, color: '#525252' }}>Pagamento único</div>
          )}
        </div>

        {snapshot.expiresAt && (
          <div style={{ display: 'flex', fontSize: 13, color: '#a15c00' }}>Válido até {formatDate(snapshot.expiresAt)}</div>
        )}
        {snapshot.warrantyText && <div style={{ fontSize: 12, color: '#737373' }}>{safeText(snapshot.warrantyText, 200)}</div>}
      </div>

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '20px 40px',
          background: '#f5f5f5',
          fontSize: 13,
          color: '#525252',
        }}
      >
        {snapshot.storeAddress && <div>{safeText(snapshot.storeAddress, 200)}</div>}
        {snapshot.whatsappNumber && (
          <div style={{ display: 'flex' }}>WhatsApp: {safeText(snapshot.whatsappNumber, 20)}</div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#525252' }}>
      <div>{label}</div>
      <div>{value}</div>
    </div>
  )
}
