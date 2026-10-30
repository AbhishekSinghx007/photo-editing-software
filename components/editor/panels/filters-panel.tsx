'use client'

import { useEffect, useState } from 'react'
import { AdjustSlider } from '../adjust-slider'
import { PanelSection } from './panel-section'
import { downscale } from '@/lib/editor/pipeline'
import { combineAdjustments, FILTER_PRESETS } from '@/lib/editor/presets'
import { ImageRenderer } from '@/lib/editor/renderer'
import type { Adjustments } from '@/lib/editor/types'
import { cn } from '@/lib/utils'

type FiltersPanelProps = {
  source: HTMLCanvasElement
  adjustments: Adjustments
  filter: { id: string; intensity: number }
  onSelect: (id: string) => void
  onIntensity: (value: number, commit: boolean) => void
}

function useThumbnails(source: HTMLCanvasElement, adjustments: Adjustments) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      let renderer: ImageRenderer | null = null
      try {
        renderer = new ImageRenderer()
        const small = downscale(source, 180)
        renderer.setSource(small)
        const next: Record<string, string> = {}
        for (const preset of FILTER_PRESETS) {
          renderer.render(combineAdjustments(adjustments, preset.id, 100))
          next[preset.id] = renderer.canvas.toDataURL('image/jpeg', 0.8)
        }
        setThumbs(next)
      } catch {
        setThumbs({})
      } finally {
        renderer?.dispose()
      }
    })
    return () => cancelAnimationFrame(id)
  }, [source, adjustments])

  return thumbs
}

export function FiltersPanel({ source, adjustments, filter, onSelect, onIntensity }: FiltersPanelProps) {
  const thumbs = useThumbnails(source, adjustments)

  return (
    <div className="flex flex-col gap-5">
      <PanelSection title="Presets">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Filter presets">
          {FILTER_PRESETS.map((preset) => {
            const active = filter.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(preset.id)}
                className="group flex flex-col gap-1.5 text-left outline-none"
              >
                <span
                  className={cn(
                    'block aspect-square overflow-hidden rounded-md bg-canvas ring-2 ring-offset-2 ring-offset-panel transition',
                    active ? 'ring-primary' : 'ring-transparent group-hover:ring-input group-focus-visible:ring-ring/60',
                  )}
                >
                  {thumbs[preset.id] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbs[preset.id] || "/placeholder.svg"} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className={cn('text-[11px]', active ? 'text-foreground' : 'text-muted-foreground')}>
                  {preset.name}
                </span>
              </button>
            )
          })}
        </div>
      </PanelSection>

      {filter.id !== 'original' && (
        <PanelSection title="Strength">
          <AdjustSlider
            label="Intensity"
            min={0}
            max={100}
            defaultValue={100}
            value={filter.intensity}
            format={(v) => `${v}%`}
            onChange={(v) => onIntensity(v, false)}
            onCommit={() => onIntensity(filter.intensity, true)}
            onReset={() => onIntensity(100, true)}
          />
        </PanelSection>
      )}
    </div>
  )
}
