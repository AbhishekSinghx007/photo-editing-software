'use client'

import { Download, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AdjustSlider } from './adjust-slider'
import { Button } from '@/components/ui/button'
import type { ExportOptions } from '@/lib/editor/pipeline'
import { cn } from '@/lib/utils'

const FORMATS: { id: ExportOptions['format']; label: string }[] = [
  { id: 'image/jpeg', label: 'JPEG' },
  { id: 'image/png', label: 'PNG' },
  { id: 'image/webp', label: 'WebP' },
]

const SCALES = [1, 0.75, 0.5, 0.25]

type ExportDialogProps = {
  open: boolean
  baseSize: { w: number; h: number }
  onClose: () => void
  onExport: (options: ExportOptions) => Promise<void>
}

export function ExportDialog({ open, baseSize, onClose, onExport }: ExportDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [format, setFormat] = useState<ExportOptions['format']>('image/jpeg')
  const [quality, setQuality] = useState(92)
  const [scale, setScale] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = ref.current!
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await onExport({ format, quality: quality / 100, scale })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(false)
    }
  }

  const outW = Math.round(baseSize.w * scale)
  const outH = Math.round(baseSize.h * scale)

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="export-title"
      className="m-auto w-[min(92vw,380px)] rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 id="export-title" className="text-base font-semibold">
              Export photo
            </h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {outW} × {outH} px
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Format</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={format === f.id}
                onClick={() => setFormat(f.id)}
                className={cn(
                  'h-9 rounded-md border text-sm transition-colors',
                  format === f.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Size</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {SCALES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={scale === s}
                onClick={() => setScale(s)}
                className={cn(
                  'h-9 rounded-md border font-mono text-xs transition-colors',
                  scale === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {s * 100}%
              </button>
            ))}
          </div>
        </fieldset>

        {format !== 'image/png' && (
          <AdjustSlider
            label="Quality"
            min={40}
            max={100}
            defaultValue={92}
            value={quality}
            format={(v) => `${v}`}
            onChange={setQuality}
            onCommit={() => {}}
            onReset={() => setQuality(92)}
          />
        )}

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        <Button size="lg" onClick={run} disabled={busy} className="h-10">
          {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Download data-icon="inline-start" />}
          {busy ? 'Rendering…' : 'Download'}
        </Button>
      </div>
    </dialog>
  )
}
