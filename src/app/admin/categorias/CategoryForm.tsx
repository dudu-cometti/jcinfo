'use client'

import { useActionState, useState } from 'react'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { slugify } from '@/lib/utils'
import type { CategoryFormState } from '@/lib/validations/category'

type CategoryFormAction = (
  state: CategoryFormState,
  formData: FormData,
) => Promise<CategoryFormState>

export function CategoryForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: CategoryFormAction
  defaultValues?: { name: string; slug: string }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues))

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          onChange={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value))
          }}
        />
      </Field>

      <Field label="Slug" htmlFor="slug" hint="Usado na URL pública, ex: /categoria/drones">
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(slugify(e.target.value))
          }}
        />
      </Field>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
