'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseRaffleFormData, type RaffleFormState } from '@/lib/validations/raffle'

export async function createRaffle(
  _prevState: RaffleFormState,
  formData: FormData,
): Promise<RaffleFormState> {
  await requireRole('admin')

  const validated = parseRaffleFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('raffles').insert(validated.data).select('id').single()
  if (error) return { error: 'Erro ao criar sorteio.' }

  await supabase.rpc('log_audit', {
    p_action: 'sorteio_criado',
    p_resource_table: 'raffles',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/sorteios')
  redirect(`/admin/sorteios/${data.id}`)
}

export async function updateRaffle(
  raffleId: string,
  _prevState: RaffleFormState,
  formData: FormData,
): Promise<RaffleFormState> {
  await requireRole('admin')

  const validated = parseRaffleFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('raffles').update(validated.data).eq('id', raffleId)
  if (error) return { error: 'Erro ao salvar sorteio.' }

  await supabase.rpc('log_audit', {
    p_action: 'sorteio_editado',
    p_resource_table: 'raffles',
    p_resource_id: raffleId,
    p_data: validated.data,
  })

  revalidatePath('/admin/sorteios')
  revalidatePath(`/admin/sorteios/${raffleId}`)
  return undefined
}

export async function addRaffleEntry(raffleId: string, customerId: string) {
  await requireRole('admin', 'vendedor')
  if (!customerId) return { error: 'Selecione um cliente.' }

  const supabase = await createClient()
  const { error } = await supabase.from('raffle_entries').insert({ raffle_id: raffleId, customer_id: customerId })
  if (error) {
    return { error: error.code === '23505' ? 'Este cliente já está participando.' : 'Erro ao adicionar participante.' }
  }

  revalidatePath(`/admin/sorteios/${raffleId}`)
  return { error: undefined }
}

export async function drawRaffleWinner(raffleId: string) {
  await requireRole('admin')

  const supabase = await createClient()
  const { data: raffle } = await supabase.from('raffles').select('status').eq('id', raffleId).single()
  if (!raffle || raffle.status !== 'aberto') {
    return { error: 'Este sorteio não está mais aberto.' }
  }

  const { data: entries } = await supabase.from('raffle_entries').select('customer_id').eq('raffle_id', raffleId)
  if (!entries || entries.length === 0) {
    return { error: 'Nenhum participante cadastrado neste sorteio.' }
  }

  const winnerIndex = Math.floor(Math.random() * entries.length)
  const winnerCustomerId = entries[winnerIndex].customer_id

  const { error: insertError } = await supabase
    .from('raffle_winners')
    .insert({ raffle_id: raffleId, customer_id: winnerCustomerId })
  if (insertError) return { error: 'Erro ao registrar o vencedor.' }

  await supabase.from('raffles').update({ status: 'encerrado' }).eq('id', raffleId)

  await supabase.rpc('log_audit', {
    p_action: 'sorteio_realizado',
    p_resource_table: 'raffles',
    p_resource_id: raffleId,
    p_data: { winner_customer_id: winnerCustomerId, total_entries: entries.length },
  })

  revalidatePath(`/admin/sorteios/${raffleId}`)
  revalidatePath('/admin/sorteios')
  return { error: undefined }
}
