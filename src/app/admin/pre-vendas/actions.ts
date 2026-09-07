'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import {
  parsePreorderCampaignFormData,
  type PreorderCampaignFormState,
} from '@/lib/validations/preorder'

export async function createPreorderCampaign(
  _prevState: PreorderCampaignFormState,
  formData: FormData,
): Promise<PreorderCampaignFormState> {
  await requireRole('admin')

  const validated = parsePreorderCampaignFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preorder_campaigns')
    .insert(validated.data)
    .select('id')
    .single()

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe uma pré-venda com esse slug.' : 'Erro ao criar pré-venda.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'pre_venda_criada',
    p_resource_table: 'preorder_campaigns',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/pre-vendas')
  redirect(`/admin/pre-vendas/${data.id}`)
}

export async function updatePreorderCampaign(
  campaignId: string,
  _prevState: PreorderCampaignFormState,
  formData: FormData,
): Promise<PreorderCampaignFormState> {
  await requireRole('admin')

  const validated = parsePreorderCampaignFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('preorder_campaigns').update(validated.data).eq('id', campaignId)

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe uma pré-venda com esse slug.' : 'Erro ao salvar pré-venda.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'pre_venda_editada',
    p_resource_table: 'preorder_campaigns',
    p_resource_id: campaignId,
    p_data: validated.data,
  })

  revalidatePath('/admin/pre-vendas')
  revalidatePath(`/admin/pre-vendas/${campaignId}`)
  return undefined
}

export async function deletePreorderCampaign(campaignId: string) {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('preorder_campaigns').delete().eq('id', campaignId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'pre_venda_excluida',
    p_resource_table: 'preorder_campaigns',
    p_resource_id: campaignId,
  })
  revalidatePath('/admin/pre-vendas')
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
type CampaignImageField = 'image_url' | 'image_url_mobile'

/** Reuses the `product-images` bucket (already public-read/admin-write) under a `preorders/` prefix, same reasoning as uploadHomeBannerImage. */
export async function uploadPreorderCampaignImage(campaignId: string, field: CampaignImageField, formData: FormData) {
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
  const path = `preorders/${campaignId}/${field}-${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type })
  if (uploadError) return { error: 'Erro ao enviar imagem.' }

  const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('preorder_campaigns')
    .update({ [field]: publicUrlData.publicUrl })
    .eq('id', campaignId)
  if (updateError) return { error: 'Erro ao salvar imagem na pré-venda.' }

  revalidatePath(`/admin/pre-vendas/${campaignId}`)
  revalidatePath('/pre-venda')
  return { error: undefined }
}

export async function removePreorderCampaignImage(campaignId: string, field: CampaignImageField) {
  await requireRole('admin')

  const supabase = await createClient()
  const { data: campaign } = await supabase
    .from('preorder_campaigns')
    .select('image_url, image_url_mobile, slug')
    .eq('id', campaignId)
    .single()
  const currentUrl = campaign?.[field]

  await supabase.from('preorder_campaigns').update({ [field]: null }).eq('id', campaignId)

  if (currentUrl) {
    const path = currentUrl.split('/product-images/')[1]
    if (path) await supabase.storage.from('product-images').remove([path])
  }

  revalidatePath(`/admin/pre-vendas/${campaignId}`)
  if (campaign?.slug) revalidatePath(`/pre-venda/${campaign.slug}`)
}

export async function toggleSignupConverted(signupId: string, converted: boolean) {
  await requireRole('admin')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preorder_signups')
    .update({ converted })
    .eq('id', signupId)
    .select('campaign_id')
    .single()
  if (error || !data) return

  await supabase.rpc('log_audit', {
    p_action: converted ? 'pre_venda_inscricao_convertida' : 'pre_venda_inscricao_revertida',
    p_resource_table: 'preorder_signups',
    p_resource_id: signupId,
  })
  revalidatePath(`/admin/pre-vendas/${data.campaign_id}`)
}
