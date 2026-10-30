import type { ReactNode } from 'react'

export function PanelSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex h-6 items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}
