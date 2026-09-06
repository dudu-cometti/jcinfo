'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseCustomerFormData, type CustomerFormState } from '@/lib/validations/customer'

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  await requireRole('admin', 'vendedor')

  const validated = parseCustomerFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert(validated.data)
    .select('id')
    .single()

  if (error) {
    return {
      error:
        error.code === '23505'
          ? 'Já existe um cliente cadastrado com esse telefone.'
          : 'Erro ao cadastrar cliente.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'cliente_criado',
    p_resource_table: 'customers',
    p_resource_id: data.id,
    p_data: { name: validated.data.name, phone: validated.data.phone },
  })

  revalidatePath('/admin/clientes')
  revalidatePath('/vendedor/clientes')
  return { customerId: data.id }
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  await requireRole('admin', 'vendedor')

  const validated = parseCustomerFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('customers').update(validated.data).eq('id', customerId)

  if (error) {
    return {
      error:
        error.code === '23505'
          ? 'Já existe um cliente cadastrado com esse telefone.'
          : 'Erro ao salvar cliente.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'cliente_editado',
    p_resource_table: 'customers',
    p_resource_id: customerId,
    p_data: { name: validated.data.name, phone: validated.data.phone },
  })

  revalidatePath('/admin/clientes')
  revalidatePath(`/admin/clientes/${customerId}`)
  revalidatePath('/vendedor/clientes')
  return { customerId }
}
