'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { CropOverlay } from './crop-overlay'
import { computeHistogram, type HistogramData } from '@/lib/editor/histogram'
import { drawStrokes } from '@/lib/editor/pipeline'
import { ImageRenderer } from '@/lib/editor/renderer'
import type { Adjustments, CropRect, Stroke, Tool } from '@/lib/editor/types'

export type BrushSettings = { color: string; size: number; opacity: number }

type EditorCanvasProps = {
  source: HTMLCanvasElement
  adjustments: Adjustments
  strokes: Stroke[]
  showStrokes: boolean
  tool: Tool
  zoom: number | 'fit'
  brush: BrushSettings
  crop: { rect: CropRect; aspect: number | null; onChange: (r: CropRect, commit: boolean) => void }
  onScaleChange: (scale: number) => void
  onZoomChange: (zoom: number) => void
  onHistogram: (data: HistogramData) => void
  onAddStroke: (stroke: Stroke) => void
}

const PAD = 32

export function EditorCanvas({
  source,
  adjustments,
  strokes,
  showStrokes,
  tool,
  zoom,
  brush,
  crop,
  onScaleChange,
  onZoomChange,
  onHistogram,
  onAddStroke,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<ImageRenderer | null>(null)
  const uploadedRef = useRef<HTMLCanvasElement | null>(null)
  const currentStroke = useRef<Stroke | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const el = containerRef.current!
    const ro = new ResizeObserver(([entry]) => {
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      try {
        rendererRef.current ??= new ImageRenderer(glCanvasRef.current!)
        const renderer = rendererRef.current
        if (uploadedRef.current !== source) {
          renderer.setSource(source)
          uploadedRef.current = source
        }
        renderer.render(adjustments)
        frame = requestAnimationFrame(() => onHistogram(computeHistogram(renderer.canvas)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rendering failed')
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [source, adjustments, onHistogram])

  useEffect(() => () => rendererRef.current?.dispose(), [])

  const redrawOverlay = () => {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!showStrokes) return
    const all = currentStroke.current ? [...strokes, currentStroke.current] : strokes
    drawStrokes(ctx, all, canvas.width, canvas.height)
  }

  useEffect(redrawOverlay)

  const fit = box.w && box.h ? Math.min((box.w - PAD * 2) / source.width, (box.h - PAD * 2) / source.height) : 1
  const scale = zoom === 'fit' ? Math.max(0.02, fit) : zoom
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  useEffect(() => onScaleChange(scale), [scale, onScaleChange])

  useEffect(() => {
    const el = containerRef.current!
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const next = Math.min(8, Math.max(0.05, scaleRef.current * Math.exp(-e.deltaY * 0.01)))
      onZoomChange(next)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onZoomChange])

  const drawing = tool === 'markup'

  const toPoint = (e: ReactPointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
  }

  const moveCursor = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const cursor = cursorRef.current
    if (!cursor) return
    const r = e.currentTarget.getBoundingClientRect()
    const size = (brush.size / 1000) * r.width
    cursor.style.width = `${size}px`
    cursor.style.height = `${size}px`
    cursor.style.transform = `translate(${e.clientX - r.left - size / 2}px, ${e.clientY - r.top - size / 2}px)`
    cursor.style.opacity = '1'
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    e.currentTarget.setPointerCapture(e.pointerId)
    currentStroke.current = { points: [toPoint(e)], color: brush.color, size: brush.size / 1000, opacity: brush.opacity }
    redrawOverlay()
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    moveCursor(e)
    if (!currentStroke.current) return
    currentStroke.current.points.push(toPoint(e))
    redrawOverlay()
  }

  const onPointerUp = () => {
    const stroke = currentStroke.current
    currentStroke.current = null
    if (stroke) onAddStroke(stroke)
  }

  const width = Math.round(source.width * scale)
  const height = Math.round(source.height * scale)

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1 overflow-auto bg-canvas">
      {error ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : (
        <div className="flex min-h-full min-w-full items-center justify-center" style={{ padding: PAD, width: 'max-content', height: 'max-content' }}>
          <div className="checkerboard relative shrink-0 shadow-2xl shadow-black/50" style={{ width, height }}>
            <canvas ref={glCanvasRef} className="absolute inset-0 size-full" aria-label="Edited photo" role="img" />
            <canvas
              ref={overlayRef}
              width={source.width}
              height={source.height}
              className="absolute inset-0 size-full touch-none"
              style={{ cursor: drawing ? 'none' : 'default', pointerEvents: drawing ? 'auto' : 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onPointerLeave={() => cursorRef.current && (cursorRef.current.style.opacity = '0')}
            />
            {drawing && (
              <div
                ref={cursorRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 rounded-full border border-white opacity-0 mix-blend-difference"
              />
            )}
            {tool === 'crop' && (
              <CropOverlay
                rect={crop.rect}
                aspect={crop.aspect}
                imageWidth={source.width}
                imageHeight={source.height}
                onChange={crop.onChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
