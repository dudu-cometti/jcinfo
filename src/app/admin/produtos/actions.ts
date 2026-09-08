'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseProductFormData, type ProductFormState } from '@/lib/validations/product'
import { parseProductVariantFormData, type ProductVariantFormState } from '@/lib/validations/product-variant'

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireRole('admin')

  const validated = parseProductFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert(validated.data)
    .select('id')
    .single()

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe um produto com esse slug, SKU ou código interno.' : 'Erro ao criar produto.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'produto_criado',
    p_resource_table: 'products',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/produtos')
  redirect(`/admin/produtos/${data.id}`)
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireRole('admin')

  const validated = parseProductFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()

  // Novo products with color variants have their price/promo_price/stock
  // maintained by a DB trigger from the variants (sync_product_from_variants,
  // migration 20260101000029) — writing the form's stale copies of those
  // fields here would clobber that aggregate until the next variant edit.
  const updateData: Record<string, unknown> = { ...validated.data }
  if (validated.data.condition === 'novo') {
    const { count } = await supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
    if ((count ?? 0) > 0) {
      delete updateData.price
      delete updateData.promo_price
      delete updateData.stock
    }
  }

  const { error } = await supabase.from('products').update(updateData).eq('id', productId)

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe um produto com esse slug, SKU ou código interno.' : 'Erro ao salvar produto.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'produto_editado',
    p_resource_table: 'products',
    p_resource_id: productId,
    p_data: validated.data,
  })

  revalidatePath('/admin/produtos')
  revalidatePath(`/admin/produtos/${productId}`)
  return undefined
}

export async function setProductStatus(productId: string, status: 'ativo' | 'inativo') {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('products').update({ status }).eq('id', productId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: status === 'ativo' ? 'produto_ativado' : 'produto_desativado',
    p_resource_table: 'products',
    p_resource_id: productId,
  })

  revalidatePath('/admin/produtos')
  revalidatePath(`/admin/produtos/${productId}`)
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadProductImage(productId: string, formData: FormData, variantId?: string) {
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
  const path = variantId
    ? `${productId}/variants/${variantId}/${crypto.randomUUID()}.${extension}`
    : `${productId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type })

  if (uploadError) {
    return { error: 'Erro ao enviar imagem.' }
  }

  const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)

  let positionQuery = supabase
    .from('product_images')
    .select('position')
    .eq('product_id', productId)
    .order('position', { ascending: false })
    .limit(1)
  positionQuery = variantId ? positionQuery.eq('variant_id', variantId) : positionQuery.is('variant_id', null)
  const { data: last } = await positionQuery.maybeSingle()

  const { error: insertError } = await supabase.from('product_images').insert({
    product_id: productId,
    variant_id: variantId ?? null,
    url: publicUrlData.publicUrl,
    position: (last?.position ?? -1) + 1,
  })

  if (insertError) {
    return { error: 'Erro ao salvar imagem no produto.' }
  }

  revalidatePath(`/admin/produtos/${productId}`)
  return { error: undefined }
}

/** Uploads a client-cropped replacement and points the same image row at it, so its position in the gallery doesn't change. */
export async function replaceProductImage(imageId: string, productId: string, formData: FormData) {
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
  const { data: existing } = await supabase.from('product_images').select('url').eq('id', imageId).single()

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${productId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type })
  if (uploadError) return { error: 'Erro ao enviar imagem.' }

  const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('product_images')
    .update({ url: publicUrlData.publicUrl })
    .eq('id', imageId)
  if (updateError) return { error: 'Erro ao salvar imagem cortada.' }

  if (existing?.url) {
    const oldPath = existing.url.split('/product-images/')[1]
    if (oldPath) await supabase.storage.from('product-images').remove([oldPath])
  }

  revalidatePath(`/admin/produtos/${productId}`)
  return { error: undefined }
}

export async function deleteProductImage(imageId: string, productId: string) {
  await requireRole('admin')

  const supabase = await createClient()
  const { data: image } = await supabase
    .from('product_images')
    .select('url')
    .eq('id', imageId)
    .single()

  await supabase.from('product_images').delete().eq('id', imageId)

  if (image) {
    const path = image.url.split('/product-images/')[1]
    if (path) await supabase.storage.from('product-images').remove([path])
  }

  revalidatePath(`/admin/produtos/${productId}`)
}

export async function moveProductImage(
  productId: string,
  imageId: string,
  direction: 'left' | 'right',
  variantId?: string,
) {
  await requireRole('admin')

  const supabase = await createClient()
  let query = supabase.from('product_images').select('id, position').eq('product_id', productId).order('position')
  query = variantId ? query.eq('variant_id', variantId) : query.is('variant_id', null)
  const { data: images } = await query
  if (!images) return

  const index = images.findIndex((img) => img.id === imageId)
  const targetIndex = direction === 'left' ? index - 1 : index + 1
  if (index === -1 || targetIndex < 0 || targetIndex >= images.length) return

  const current = images[index]
  const target = images[targetIndex]

  await Promise.all([
    supabase.from('product_images').update({ position: target.position }).eq('id', current.id),
    supabase.from('product_images').update({ position: current.position }).eq('id', target.id),
  ])

  revalidatePath(`/admin/produtos/${productId}`)
}

export async function createProductVariant(
  productId: string,
  _prevState: ProductVariantFormState,
  formData: FormData,
): Promise<ProductVariantFormState> {
  await requireRole('admin')

  const validated = parseProductVariantFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data: last } = await supabase
    .from('product_variants')
    .select('position')
    .eq('product_id', productId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase
    .from('product_variants')
    .insert({ ...validated.data, product_id: productId, position: (last?.position ?? -1) + 1 })

  if (error) return { error: 'Erro ao criar cor.' }

  revalidatePath(`/admin/produtos/${productId}`)
  revalidatePath('/admin/produtos')
  return { error: undefined }
}

export async function updateProductVariant(
  variantId: string,
  productId: string,
  _prevState: ProductVariantFormState,
  formData: FormData,
): Promise<ProductVariantFormState> {
  await requireRole('admin')

  const validated = parseProductVariantFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('product_variants').update(validated.data).eq('id', variantId)
  if (error) return { error: 'Erro ao salvar cor.' }

  revalidatePath(`/admin/produtos/${productId}`)
  revalidatePath('/admin/produtos')
  return { error: undefined }
}

export async function deleteProductVariant(variantId: string, productId: string) {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId)
  if (error) return { error: 'Não é possível excluir uma cor com vendas registradas. Desative-a em vez disso.' }

  revalidatePath(`/admin/produtos/${productId}`)
  revalidatePath('/admin/produtos')
  return { error: undefined }
}

export async function moveProductVariant(productId: string, variantId: string, direction: 'up' | 'down') {
  await requireRole('admin')

  const supabase = await createClient()
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, position')
    .eq('product_id', productId)
    .order('position')
  if (!variants) return

  const index = variants.findIndex((v) => v.id === variantId)
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || targetIndex < 0 || targetIndex >= variants.length) return

  const current = variants[index]
  const target = variants[targetIndex]

  await Promise.all([
    supabase.from('product_variants').update({ position: target.position }).eq('id', current.id),
    supabase.from('product_variants').update({ position: current.position }).eq('id', target.id),
  ])

  revalidatePath(`/admin/produtos/${productId}`)
}
