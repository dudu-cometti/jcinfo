'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseProductFormData, type ProductFormState } from '@/lib/validations/product'

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
  const { error } = await supabase.from('products').update(validated.data).eq('id', productId)

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

export async function uploadProductImage(productId: string, formData: FormData) {
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
  const path = `${productId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type })

  if (uploadError) {
    return { error: 'Erro ao enviar imagem.' }
  }

  const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path)

  const { error: insertError } = await supabase
    .from('product_images')
    .insert({ product_id: productId, url: publicUrlData.publicUrl })

  if (insertError) {
    return { error: 'Erro ao salvar imagem no produto.' }
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
