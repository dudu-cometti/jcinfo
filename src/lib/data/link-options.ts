import { createClient } from '@/lib/supabase/server'

export type LinkOptionGroup = { group: string; items: { label: string; value: string }[] }

const STATIC_PAGES: LinkOptionGroup = {
  group: 'Páginas',
  items: [
    { label: 'Página inicial', value: '/' },
    { label: 'Todos os produtos', value: '/produtos' },
    { label: 'Todas as pré-vendas', value: '/pre-venda' },
    { label: 'Todas as campanhas', value: '/campanhas' },
    { label: 'Todos os sorteios', value: '/sorteios' },
  ],
}

export async function getHomeBannerLinkOptions(): Promise<LinkOptionGroup[]> {
  const supabase = await createClient()

  const [{ data: categories }, { data: brands }, { data: preorders }] = await Promise.all([
    supabase.from('categories').select('name, slug').order('name'),
    supabase.from('brands').select('name, slug').order('name'),
    supabase.from('preorder_campaigns').select('name, slug, status').order('created_at', { ascending: false }),
  ])

  return [
    STATIC_PAGES,
    {
      group: 'Categorias',
      items: (categories ?? []).map((c) => ({ label: c.name, value: `/categoria/${c.slug}` })),
    },
    {
      group: 'Marcas',
      items: (brands ?? []).map((b) => ({ label: b.name, value: `/marca/${b.slug}` })),
    },
    {
      group: 'Pré-vendas',
      items: (preorders ?? []).map((p) => ({
        label: p.status === 'aberta' ? p.name : `${p.name} (${p.status})`,
        value: `/pre-venda/${p.slug}`,
      })),
    },
  ]
}
