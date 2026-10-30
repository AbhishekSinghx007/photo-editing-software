'use client'

import { RotateCcw } from 'lucide-react'
import { AdjustSlider } from '../adjust-slider'
import { Histogram } from '../histogram'
import { PanelSection } from './panel-section'
import type { HistogramData } from '@/lib/editor/histogram'
import { ADJUSTMENT_GROUPS, DEFAULT_ADJUSTMENTS, type AdjustmentKey, type Adjustments } from '@/lib/editor/types'

type AdjustPanelProps = {
  adjustments: Adjustments
  histogram: HistogramData | null
  onChange: (key: AdjustmentKey, value: number, commit: boolean) => void
  onResetGroup: (keys: AdjustmentKey[]) => void
  onCommit: () => void
}

export function AdjustPanel({ adjustments, histogram, onChange, onResetGroup, onCommit }: AdjustPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <Histogram data={histogram} />
      {ADJUSTMENT_GROUPS.map((group) => {
        const keys = group.items.map((i) => i.key)
        const dirty = keys.some((k) => adjustments[k] !== DEFAULT_ADJUSTMENTS[k])
        return (
          <PanelSection
            key={group.title}
            title={group.title}
            action={
              dirty && (
                <button
                  type="button"
                  onClick={() => onResetGroup(keys)}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Reset
                </button>
              )
            }
          >
            <div className="flex flex-col gap-3">
              {group.items.map((item) => (
                <AdjustSlider
                  key={item.key}
                  label={item.label}
                  min={item.min}
                  max={item.max}
                  value={adjustments[item.key]}
                  format={item.key === 'hue' ? (v) => `${v}°` : undefined}
                  onChange={(v) => onChange(item.key, v, false)}
                  onCommit={onCommit}
                  onReset={() => onChange(item.key, 0, true)}
                />
              ))}
            </div>
          </PanelSection>
        )
      })}
    </div>
  )
}
