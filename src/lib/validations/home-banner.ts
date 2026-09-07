import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

const optionalUuid = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .pipe(z.uuid().nullable())

export const homeBannerSchema = z.object({
  title: z.string().min(2, { error: 'Informe o título do destaque.' }),
  subtitle: optionalString,
  cta_label: optionalString,
  cta_href: optionalString,
  active: z.coerce.boolean(),
  show_text_overlay: z.coerce.boolean(),
  preorder_campaign_id: optionalUuid,
})

export type HomeBannerFormState = { error?: string } | undefined

export function parseHomeBannerFormData(formData: FormData) {
  return homeBannerSchema.safeParse({
    title: formData.get('title'),
    subtitle: formData.get('subtitle'),
    cta_label: formData.get('cta_label'),
    cta_href: formData.get('cta_href'),
    active: formData.get('active') === 'on',
    show_text_overlay: formData.get('show_text_overlay') === 'on',
    preorder_campaign_id: formData.get('preorder_campaign_id'),
  })
}
