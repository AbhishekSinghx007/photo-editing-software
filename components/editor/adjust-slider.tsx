'use client'

import { useId, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type AdjustSliderProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  defaultValue?: number
  format?: (v: number) => string
  onChange: (value: number) => void
  onCommit: () => void
  onReset?: () => void
}

export function AdjustSlider({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  format = (v) => (v > 0 ? `+${v}` : `${v}`),
  onChange,
  onCommit,
  onReset,
}: AdjustSliderProps) {
  const id = useId()
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const origin = pct(Math.min(max, Math.max(min, defaultValue)))
  const current = pct(value)
  const changed = value !== defaultValue

  const style = {
    '--from': `${Math.min(origin, current)}%`,
    '--to': `${Math.max(origin, current)}%`,
  } as CSSProperties

  return (
    <div className="group/slider flex flex-col gap-0.5" onDoubleClick={onReset}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className={cn('text-xs', changed ? 'text-foreground' : 'text-muted-foreground')}>
          {label}
        </label>
        <button
          type="button"
          onClick={onReset}
          disabled={!changed}
          title="Reset"
          className={cn(
            'rounded px-1 font-mono text-[11px] tabular-nums transition-colors',
            changed ? 'text-primary hover:bg-muted' : 'text-muted-foreground',
          )}
        >
          {format(value)}
        </button>
      </div>
      <input
        id={id}
        type="range"
        className="editor-range"
        style={style}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
      />
    </div>
  )
}
