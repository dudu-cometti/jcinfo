import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Pré-vendas',
  description: 'Garanta o seu antes de todo mundo. Confira os lançamentos em pré-venda.',
}

export default async function PreordersListPage() {
  const supabase = await createClient()
  const { data: campaigns } = await supabase
    .from('preorder_campaigns')
    .select('id, name, slug, description, image_url, expected_date, status')
    .eq('status', 'aberta')
    .order('created_at', { ascending: false })

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Pré-vendas</h1>
        <p className="mt-2 text-neutral-500">Nenhuma pré-venda aberta no momento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Pré-vendas abertas</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/pre-venda/${campaign.slug}`}
            className="group flex overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-brand-navy/30 hover:shadow-md"
          >
            <div className="relative w-32 shrink-0 bg-neutral-900 sm:w-40">
              {campaign.image_url ? (
                <Image src={campaign.image_url} alt={campaign.name} fill sizes="160px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-semibold text-white/20">
                  {campaign.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 p-4">
              <h2 className="font-medium text-neutral-900">{campaign.name}</h2>
              {campaign.description && (
                <p className="line-clamp-2 text-sm text-neutral-500">{campaign.description}</p>
              )}
              {campaign.expected_date && (
                <p className="text-xs text-neutral-400">Chegada prevista: {formatDate(campaign.expected_date)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
