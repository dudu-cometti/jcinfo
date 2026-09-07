import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

export const homeBannerSchema = z.object({
  title: z.string().min(2, { error: 'Informe o título do destaque.' }),
  subtitle: optionalString,
  cta_label: optionalString,
  cta_href: optionalString,
  image_url: optionalString,
  active: z.coerce.boolean(),
})

export type HomeBannerFormState = { error?: string } | undefined

export function parseHomeBannerFormData(formData: FormData) {
  return homeBannerSchema.safeParse({
    title: formData.get('title'),
    subtitle: formData.get('subtitle'),
    cta_label: formData.get('cta_label'),
    cta_href: formData.get('cta_href'),
    image_url: formData.get('image_url'),
    active: formData.get('active') === 'on',
  })
}
