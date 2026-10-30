'use client'

import { Trash2 } from 'lucide-react'
import { AdjustSlider } from '../adjust-slider'
import type { BrushSettings } from '../editor-canvas'
import { PanelSection } from './panel-section'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SWATCHES = ['#ffffff', '#111111', '#f5b942', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']

type MarkupPanelProps = {
  brush: BrushSettings
  strokeCount: number
  onBrush: (brush: BrushSettings) => void
  onClear: () => void
}

export function MarkupPanel({ brush, strokeCount, onBrush, onClear }: MarkupPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <PanelSection title="Color">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Brush color">
          {SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={brush.color === color}
              aria-label={color}
              onClick={() => onBrush({ ...brush, color })}
              className={cn(
                'size-7 rounded-full border border-white/15 ring-2 ring-offset-2 ring-offset-panel transition',
                brush.color === color ? 'ring-primary' : 'ring-transparent hover:ring-input',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <label className="relative size-7 cursor-pointer overflow-hidden rounded-full border border-white/15 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]">
            <span className="sr-only">Custom color</span>
            <input
              type="color"
              value={brush.color}
              onChange={(e) => onBrush({ ...brush, color: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </PanelSection>

      <PanelSection title="Brush">
        <div className="flex flex-col gap-3">
          <AdjustSlider
            label="Size"
            min={1}
            max={100}
            defaultValue={12}
            value={brush.size}
            format={(v) => `${v}`}
            onChange={(size) => onBrush({ ...brush, size })}
            onCommit={() => {}}
            onReset={() => onBrush({ ...brush, size: 12 })}
          />
          <AdjustSlider
            label="Opacity"
            min={5}
            max={100}
            defaultValue={100}
            value={Math.round(brush.opacity * 100)}
            format={(v) => `${v}%`}
            onChange={(v) => onBrush({ ...brush, opacity: v / 100 })}
            onCommit={() => {}}
            onReset={() => onBrush({ ...brush, opacity: 1 })}
          />
        </div>
      </PanelSection>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Draw directly on the photo. Each stroke can be undone with{' '}
        <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px]">⌘Z</kbd>.
      </p>

      <Button variant="destructive" size="lg" onClick={onClear} disabled={strokeCount === 0}>
        <Trash2 data-icon="inline-start" />
        Clear drawing
      </Button>
    </div>
  )
}
