'use client'

import { ImageIcon, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = ['GPU-accelerated', '12 film presets', 'Crop & straighten', 'Full-res export', '100% private']

export function EmptyState({ loading, onOpen, onSample }: { loading: boolean; onOpen: () => void; onSample: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-canvas p-6">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-dashed border-input px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-primary">
          {loading ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <ImageIcon className="size-6" aria-hidden="true" />}
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-2xl font-semibold tracking-tight">Edit photos beautifully, right in your browser</h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Drop an image anywhere, paste from your clipboard, or open a file. Nothing is uploaded — every pixel is
            processed on your device.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button size="lg" onClick={onOpen} disabled={loading} className="h-10 px-4">
            <Upload data-icon="inline-start" />
            Open photo
          </Button>
          <Button variant="outline" size="lg" onClick={onSample} disabled={loading} className="h-10 px-4">
            Try a sample
          </Button>
        </div>
        <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Features">
          {FEATURES.map((f) => (
            <li key={f} className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
