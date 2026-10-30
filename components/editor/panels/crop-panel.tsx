'use client'

import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCcwSquare, RotateCwSquare } from 'lucide-react'
import { AdjustSlider } from '../adjust-slider'
import { PanelSection } from './panel-section'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const ASPECTS = [
  { id: 'free', label: 'Free' },
  { id: 'original', label: 'Original' },
  { id: '1:1', label: '1:1' },
  { id: '4:5', label: '4:5' },
  { id: '3:2', label: '3:2' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
  { id: '2:3', label: '2:3' },
] as const

export type AspectId = (typeof ASPECTS)[number]['id']

type CropPanelProps = {
  aspect: AspectId
  straighten: number
  onAspect: (id: AspectId) => void
  onRotate: (dir: 1 | -1) => void
  onFlip: (axis: 'h' | 'v') => void
  onStraighten: (value: number, commit: boolean) => void
  onReset: () => void
  onDone: () => void
}

export function CropPanel({ aspect, straighten, onAspect, onRotate, onFlip, onStraighten, onReset, onDone }: CropPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <PanelSection title="Aspect ratio">
        <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Aspect ratio">
          {ASPECTS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={aspect === a.id}
              onClick={() => onAspect(a.id)}
              className={cn(
                'h-8 rounded-md border text-xs transition-colors',
                aspect === a.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Rotate & flip">
        <div className="grid grid-cols-4 gap-1.5">
          <Button variant="outline" size="lg" onClick={() => onRotate(-1)} aria-label="Rotate left" title="Rotate left">
            <RotateCcwSquare />
          </Button>
          <Button variant="outline" size="lg" onClick={() => onRotate(1)} aria-label="Rotate right" title="Rotate right">
            <RotateCwSquare />
          </Button>
          <Button variant="outline" size="lg" onClick={() => onFlip('h')} aria-label="Flip horizontal" title="Flip horizontal">
            <FlipHorizontal2 />
          </Button>
          <Button variant="outline" size="lg" onClick={() => onFlip('v')} aria-label="Flip vertical" title="Flip vertical">
            <FlipVertical2 />
          </Button>
        </div>
        <AdjustSlider
          label="Straighten"
          min={-45}
          max={45}
          step={0.5}
          value={straighten}
          format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°`}
          onChange={(v) => onStraighten(v, false)}
          onCommit={() => onStraighten(straighten, true)}
          onReset={() => onStraighten(0, true)}
        />
      </PanelSection>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" size="lg" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
        <Button className="flex-1" size="lg" onClick={onDone}>
          Apply crop
        </Button>
      </div>
    </div>
  )
}
