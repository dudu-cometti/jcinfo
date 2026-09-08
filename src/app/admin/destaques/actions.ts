'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseHomeBannerFormData, type HomeBannerFormState } from '@/lib/validations/home-banner'

export async function createHomeBanner(
  _prevState: HomeBannerFormState,
  formData: FormData,
): Promise<HomeBannerFormState> {
  await requireRole('admin')

  const validated = parseHomeBannerFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data: last } = await supabase
    .from('home_banners')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from('home_banners')
    .insert({ ...validated.data, position: (last?.position ?? -1) + 1 })
    .select('id')
    .single()

  if (error) return { error: 'Erro ao criar destaque.' }

  await supabase.rpc('log_audit', {
    p_action: 'destaque_criado',
    p_resource_table: 'home_banners',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/destaques')
  revalidatePath('/')
  redirect(`/admin/destaques/${data.id}`)
}

export async function updateHomeBanner(
  bannerId: string,
  _prevState: HomeBannerFormState,
  formData: FormData,
): Promise<HomeBannerFormState> {
  await requireRole('admin')

  const validated = parseHomeBannerFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('home_banners').update(validated.data).eq('id', bannerId)
  if (error) return { error: 'Erro ao salvar destaque.' }

  await supabase.rpc('log_audit', {
    p_action: 'destaque_editado',
    p_resource_table: 'home_banners',
    p_resource_id: bannerId,
    p_data: validated.data,
  })

  revalidatePath('/admin/destaques')
  revalidatePath('/')
  return undefined
}

export async function deleteHomeBanner(bannerId: string) {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('home_banners').delete().eq('id', bannerId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'destaque_excluido',
    p_resource_table: 'home_banners',
    p_resource_id: bannerId,
  })
  revalidatePath('/admin/destaques')
  revalidatePath('/')
}

export async function toggleHomeBannerActive(bannerId: string, active: boolean) {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('home_banners').update({ active }).eq('id', bannerId)
  if (error) return

  revalidatePath('/admin/destaques')
  revalidatePath('/')
}

export type HomeBannerImageSource = { type: 'preorder' | 'raffle'; id: string } | null

/** Escolhe se a imagem do destaque vem de upload próprio (null) ou é reaproveitada de uma pré-venda/sorteio. */
export async function setHomeBannerImageSource(bannerId: string, source: HomeBannerImageSource) {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase
    .from('home_banners')
    .update({
      preorder_campaign_id: source?.type === 'preorder' ? source.id : null,
      raffle_id: source?.type === 'raffle' ? source.id : null,
    })
    .eq('id', bannerId)
  if (error) return { error: 'Erro ao definir a origem da imagem.' }

  revalidatePath(`/admin/destaques/${bannerId}`)
  revalidatePath('/admin/destaques')
  revalidatePath('/')
  return { error: undefined }
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
type BannerImageField = 'image_url' | 'image_url_mobile'

/** Reuses the `product-images` bucket (already public-read/admin-write) under a `banners/` prefix, rather than provisioning a second bucket for the same access pattern. */
export async function uploadHomeBannerImage(bannerId: string, field: BannerImageField, formData: FormData) {
  await requireRole('admin')

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Selecione uma imagem.' }
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { error: 'Formato inválido. Use JPG, PNG ou WEBP.' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: 'Imagem muito grande (máximo 5MB).' }
  }

  const supabase = await createClient()
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `banners/${bannerId}/${field}-${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type })
  if (uploadError) return { error: 'Erro ao enviar imagem.' }

  const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('home_banners')
    .update({ [field]: publicUrlData.publicUrl })
    .eq('id', bannerId)
  if (updateError) return { error: 'Erro ao salvar imagem no destaque.' }

  revalidatePath(`/admin/destaques/${bannerId}`)
  revalidatePath('/')
  return { error: undefined }
}

export async function removeHomeBannerImage(bannerId: string, field: BannerImageField) {
  await requireRole('admin')

  const supabase = await createClient()
  const { data: banner } = await supabase
    .from('home_banners')
    .select('image_url, image_url_mobile')
    .eq('id', bannerId)
    .single()
  const currentUrl = banner?.[field]

  await supabase.from('home_banners').update({ [field]: null }).eq('id', bannerId)

  if (currentUrl) {
    const path = currentUrl.split('/product-images/')[1]
    if (path) await supabase.storage.from('product-images').remove([path])
  }

  revalidatePath(`/admin/destaques/${bannerId}`)
  revalidatePath('/')
}

export async function moveHomeBanner(bannerId: string, direction: 'up' | 'down') {
  await requireRole('admin')

  const supabase = await createClient()
  const { data: banners } = await supabase.from('home_banners').select('id, position').order('position')
  if (!banners) return

  const index = banners.findIndex((b) => b.id === bannerId)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || targetIndex < 0 || targetIndex >= banners.length) return

  const current = banners[index]
  const target = banners[targetIndex]

  await Promise.all([
    supabase.from('home_banners').update({ position: target.position }).eq('id', current.id),
    supabase.from('home_banners').update({ position: current.position }).eq('id', target.id),
  ])

  revalidatePath('/admin/destaques')
  revalidatePath('/')
}
