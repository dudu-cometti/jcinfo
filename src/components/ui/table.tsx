import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      {/* Last column (always the row actions in every table in this app) stays
          pinned to the right edge while scrolling horizontally, so "Editar"/
          "Excluir" is never hidden off-screen on narrow phones. */}
      <table
        className={cn(
          'w-full text-left text-sm [&_td:last-child]:sticky [&_td:last-child]:right-0 [&_td:last-child]:z-10 [&_td:last-child]:border-l [&_td:last-child]:border-neutral-100 [&_td:last-child]:bg-white [&_th:last-child]:sticky [&_th:last-child]:right-0 [&_th:last-child]:z-10 [&_th:last-child]:border-l [&_th:last-child]:border-neutral-200 [&_th:last-child]:bg-neutral-50',
          className,
        )}
        {...props}
      />
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
      <tr>{children}</tr>
    </thead>
  )
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 font-medium', className)} {...props} />
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-neutral-700', className)} {...props} />
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('border-b border-neutral-100 last:border-0 hover:bg-neutral-50', className)}
      {...props}
    />
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      {/* :last-child also matches this lone colSpan cell, so the sticky/
          border/background rules from Table above are force-cancelled here. */}
      <td colSpan={999} className="static! right-auto! border-0! bg-transparent! px-4 py-10 text-center text-sm text-neutral-400">
        {message}
      </td>
    </tr>
  )
}
