'use client'

import { Button } from './button'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

/**
 * A button that asks for confirmation before running its action — used for
 * anything that cancels, inactivates, deletes, or reverses something.
 * `historyNote`, when given, is appended to the confirmation message so the
 * user knows whether the action keeps a record or actually removes data.
 */
export function ConfirmButton({
  onConfirm,
  confirmMessage,
  historyNote,
  children,
  variant = 'secondary',
  disabled,
  className,
}: {
  onConfirm: () => void
  confirmMessage: string
  historyNote?: string
  children: React.ReactNode
  variant?: ButtonVariant
  disabled?: boolean
  className?: string
}) {
  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled}
      className={className}
      onClick={() => {
        const message = historyNote ? `${confirmMessage}\n\n${historyNote}` : confirmMessage
        if (window.confirm(message)) {
          onConfirm()
        }
      }}
    >
      {children}
    </Button>
  )
}
