'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { categorySchema, type CategoryFormState } from '@/lib/validations/category'

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireRole('admin')

  const validated = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert(validated.data)
    .select('id')
    .single()

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe uma categoria com esse slug.' : 'Erro ao criar categoria.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'categoria_criada',
    p_resource_table: 'categories',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/categorias')
  redirect('/admin/categorias')
}

export async function updateCategory(
  categoryId: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireRole('admin')

  const validated = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').update(validated.data).eq('id', categoryId)

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe uma categoria com esse slug.' : 'Erro ao salvar categoria.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'categoria_editada',
    p_resource_table: 'categories',
    p_resource_id: categoryId,
    p_data: validated.data,
  })

  revalidatePath('/admin/categorias')
  redirect('/admin/categorias')
}

export async function deleteCategory(categoryId: string) {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'categoria_excluida',
    p_resource_table: 'categories',
    p_resource_id: categoryId,
  })

  revalidatePath('/admin/categorias')
}
