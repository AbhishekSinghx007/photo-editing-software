'use client'

import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { CropRect } from '@/lib/editor/types'

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se'

type CropOverlayProps = {
  rect: CropRect
  aspect: number | null
  imageWidth: number
  imageHeight: number
  onChange: (rect: CropRect, commit: boolean) => void
}

const MIN = 0.04
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function CropOverlay({ rect, aspect, imageWidth, imageHeight, onChange }: CropOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ handle: Handle; start: CropRect; x: number; y: number; bw: number; bh: number } | null>(null)
  const latest = useRef(rect)
  latest.current = rect

  const begin = (handle: Handle) => (e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const box = containerRef.current!.getBoundingClientRect()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { handle, start: rect, x: e.clientX, y: e.clientY, bw: box.width, bh: box.height }
  }

  const move = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.x) / d.bw
    const dy = (e.clientY - d.y) / d.bh
    const s = d.start

    if (d.handle === 'move') {
      onChange({ ...s, x: clamp(s.x + dx, 0, 1 - s.w), y: clamp(s.y + dy, 0, 1 - s.h) }, false)
      return
    }

    const right = d.handle.includes('e')
    const bottom = d.handle.includes('s')
    const ax = right ? s.x : s.x + s.w
    const ay = bottom ? s.y : s.y + s.h
    const px = clamp((right ? s.x + s.w : s.x) + dx, 0, 1)
    const py = clamp((bottom ? s.y + s.h : s.y) + dy, 0, 1)
    const maxW = right ? 1 - ax : ax
    const maxH = bottom ? 1 - ay : ay

    let w = clamp(right ? px - ax : ax - px, MIN, maxW)
    let h = clamp(bottom ? py - ay : ay - py, MIN, maxH)

    if (aspect) {
      const ratio = imageWidth / imageHeight / aspect
      h = w * ratio
      if (h > maxH) {
        h = maxH
        w = h / ratio
      }
    }

    onChange({ x: right ? ax : ax - w, y: bottom ? ay : ay - h, w, h }, false)
  }

  const end = () => {
    if (!drag.current) return
    drag.current = null
    onChange(latest.current, true)
  }

  const corners: { id: Handle; className: string; label: string }[] = [
    { id: 'nw', className: '-left-1.5 -top-1.5 cursor-nwse-resize', label: 'Top left' },
    { id: 'ne', className: '-right-1.5 -top-1.5 cursor-nesw-resize', label: 'Top right' },
    { id: 'sw', className: '-bottom-1.5 -left-1.5 cursor-nesw-resize', label: 'Bottom left' },
    { id: 'se', className: '-bottom-1.5 -right-1.5 cursor-nwse-resize', label: 'Bottom right' },
  ]

  return (
    <div ref={containerRef} className="absolute inset-0 touch-none overflow-hidden">
      <div
        className="absolute cursor-move border border-white/90"
        style={{
          left: `${rect.x * 100}%`,
          top: `${rect.y * 100}%`,
          width: `${rect.w * 100}%`,
          height: `${rect.h * 100}%`,
          boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.6)',
        }}
        onPointerDown={begin('move')}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/30" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/30" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/30" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/30" />
        </div>
        {corners.map((c) => (
          <div
            key={c.id}
            role="presentation"
            aria-label={c.label}
            className={`absolute size-4 rounded-sm border-2 border-background bg-white shadow ${c.className}`}
            onPointerDown={begin(c.id)}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
        ))}
      </div>
    </div>
  )
}
