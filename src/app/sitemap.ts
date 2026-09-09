import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }, { data: brands }, { data: preorders }] = await Promise.all([
    supabase.from('products_public_v').select('slug, updated_at').eq('status', 'ativo'),
    supabase.from('categories').select('slug, updated_at'),
    supabase.from('brands').select('slug, updated_at'),
    supabase.from('preorder_campaigns').select('slug, updated_at').eq('status', 'aberta'),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/produtos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/pre-venda`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/campanhas`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${siteUrl}/sorteios`, changeFrequency: 'weekly', priority: 0.6 },
  ]

  const preorderRoutes: MetadataRoute.Sitemap = (preorders ?? []).map((p) => ({
    url: `${siteUrl}/pre-venda/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${siteUrl}/produtos/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${siteUrl}/categoria/${c.slug}`,
    lastModified: c.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const brandRoutes: MetadataRoute.Sitemap = (brands ?? []).map((b) => ({
    url: `${siteUrl}/marca/${b.slug}`,
    lastModified: b.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...brandRoutes, ...preorderRoutes]
}
