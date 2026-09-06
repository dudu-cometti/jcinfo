'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { brandSchema, type BrandFormState } from '@/lib/validations/brand'

export async function createBrand(
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  await requireRole('admin')

  const validated = brandSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('brands').insert(validated.data).select('id').single()

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe uma marca com esse slug.' : 'Erro ao criar marca.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'marca_criada',
    p_resource_table: 'brands',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/marcas')
  redirect('/admin/marcas')
}

export async function updateBrand(
  brandId: string,
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  await requireRole('admin')

  const validated = brandSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('brands').update(validated.data).eq('id', brandId)

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe uma marca com esse slug.' : 'Erro ao salvar marca.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'marca_editada',
    p_resource_table: 'brands',
    p_resource_id: brandId,
    p_data: validated.data,
  })

  revalidatePath('/admin/marcas')
  redirect('/admin/marcas')
}

export async function deleteBrand(brandId: string) {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('brands').delete().eq('id', brandId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'marca_excluida',
    p_resource_table: 'brands',
    p_resource_id: brandId,
  })

  revalidatePath('/admin/marcas')
}
