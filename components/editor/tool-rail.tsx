'use client'

import { Brush, Crop, SlidersHorizontal, Sparkles } from 'lucide-react'
import type { Tool } from '@/lib/editor/types'
import { cn } from '@/lib/utils'

export const TOOLS: { id: Tool; label: string; shortcut: string; icon: typeof Brush }[] = [
  { id: 'adjust', label: 'Adjust', shortcut: 'A', icon: SlidersHorizontal },
  { id: 'filters', label: 'Filters', shortcut: 'F', icon: Sparkles },
  { id: 'crop', label: 'Crop', shortcut: 'C', icon: Crop },
  { id: 'markup', label: 'Draw', shortcut: 'D', icon: Brush },
]

export function ToolRail({ tool, onChange }: { tool: Tool; onChange: (tool: Tool) => void }) {
  return (
    <nav
      aria-label="Tools"
      className="order-last flex shrink-0 justify-around border-t border-border bg-panel p-1.5 lg:order-first lg:flex-col lg:justify-start lg:gap-1 lg:border-r lg:border-t-0"
    >
      {TOOLS.map(({ id, label, shortcut, icon: Icon }) => {
        const active = tool === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            title={`${label} (${shortcut})`}
            className={cn(
              'flex w-16 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
              active ? 'bg-primary/12 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
