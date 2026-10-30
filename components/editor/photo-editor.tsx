'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorCanvas, type BrushSettings } from './editor-canvas'
import { EmptyState } from './empty-state'
import { ExportDialog } from './export-dialog'
import { AdjustPanel } from './panels/adjust-panel'
import { CropPanel, type AspectId } from './panels/crop-panel'
import { FiltersPanel } from './panels/filters-panel'
import { MarkupPanel } from './panels/markup-panel'
import { ToolRail, TOOLS } from './tool-rail'
import { TopBar } from './top-bar'
import type { HistogramData } from '@/lib/editor/histogram'
import { cropCanvas, downscale, exportImage, orient, type ExportOptions } from '@/lib/editor/pipeline'
import { combineAdjustments } from '@/lib/editor/presets'
import {
  DEFAULT_ADJUSTMENTS,
  DEFAULT_TRANSFORM,
  FULL_CROP,
  INITIAL_STATE,
  type AdjustmentKey,
  type CropRect,
  type Tool,
} from '@/lib/editor/types'
import { useEditorHistory } from '@/lib/editor/use-editor-history'

const PREVIEW_MAX = 2048

function aspectValue(id: AspectId, w: number, h: number): number | null {
  if (id === 'free') return null
  if (id === 'original') return w / h
  const [a, b] = id.split(':').map(Number)
  return a / b
}

function fitCrop(aspect: number, w: number, h: number): CropRect {
  const imageAspect = w / h
  const cw = aspect > imageAspect ? 1 : aspect / imageAspect
  const ch = aspect > imageAspect ? imageAspect / aspect : 1
  return { x: (1 - cw) / 2, y: (1 - ch) / 2, w: cw, h: ch }
}

async function loadImage(src: string) {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  await img.decode()
  return img
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) && (el as HTMLInputElement).type !== 'range'
}

export function PhotoEditor() {
  const { state, update, commit, undo, redo, reset, canUndo, canRedo } = useEditorHistory()
  const [image, setImage] = useState<{ el: HTMLImageElement; preview: HTMLCanvasElement; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [tool, setTool] = useState<Tool>('adjust')
  const [zoom, setZoom] = useState<number | 'fit'>('fit')
  const [scale, setScale] = useState(1)
  const [comparing, setComparing] = useState(false)
  const [histogram, setHistogram] = useState<HistogramData | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [aspect, setAspect] = useState<AspectId>('free')
  const [brush, setBrush] = useState<BrushSettings>({ color: '#f5b942', size: 12, opacity: 1 })
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const openFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      setLoading(true)
      const url = URL.createObjectURL(file)
      try {
        const el = await loadImage(url)
        setImage({ el, preview: downscale(el, PREVIEW_MAX), name: file.name })
        reset(INITIAL_STATE)
        setZoom('fit')
        setAspect('free')
        setTool('adjust')
        setError(null)
      } catch {
        URL.revokeObjectURL(url)
        setError(`Could not open "${file.name}". Try a JPEG, PNG, or WebP image.`)
      } finally {
        setLoading(false)
      }
    },
    [reset],
  )

  const openSample = useCallback(async () => {
    setLoading(true)
    try {
      const el = await loadImage('/sample.png')
      setImage({ el, preview: downscale(el, PREVIEW_MAX), name: 'sample.png' })
      reset(INITIAL_STATE)
      setZoom('fit')
      setError(null)
    } catch {
      setError('Could not load the sample image.')
    } finally {
      setLoading(false)
    }
  }, [reset])

  const { transform } = state

  const oriented = useMemo(() => {
    if (!image) return null
    return orient(image.preview, { ...transform, crop: FULL_CROP })
  }, [image, transform.rotation, transform.flipH, transform.flipV, transform.straighten]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = useMemo(() => {
    if (!oriented) return null
    return tool === 'crop' ? oriented : cropCanvas(oriented, transform.crop)
  }, [oriented, tool, transform.crop])

  const rendered = useMemo(
    () => (comparing ? DEFAULT_ADJUSTMENTS : combineAdjustments(state.adjustments, state.filter.id, state.filter.intensity)),
    [comparing, state.adjustments, state.filter.id, state.filter.intensity],
  )

  const setAdjustment = useCallback(
    (key: AdjustmentKey, value: number, shouldCommit: boolean) =>
      update((s) => ({ ...s, adjustments: { ...s.adjustments, [key]: value } }), shouldCommit),
    [update],
  )

  const resetGroup = (keys: AdjustmentKey[]) =>
    update((s) => {
      const adjustments = { ...s.adjustments }
      for (const k of keys) adjustments[k] = DEFAULT_ADJUSTMENTS[k]
      return { ...s, adjustments }
    })

  const setCrop = useCallback(
    (crop: CropRect, shouldCommit: boolean) =>
      update((s) => ({ ...s, transform: { ...s.transform, crop } }), shouldCommit),
    [update],
  )

  const chooseAspect = (id: AspectId) => {
    setAspect(id)
    if (!oriented) return
    const value = aspectValue(id, oriented.width, oriented.height)
    setCrop(value ? fitCrop(value, oriented.width, oriented.height) : FULL_CROP, true)
  }

  const rotate = (dir: 1 | -1) =>
    update((s) => ({
      ...s,
      strokes: [],
      transform: {
        ...s.transform,
        rotation: (((s.transform.rotation + dir * 90) % 360) + 360) % 360 as 0 | 90 | 180 | 270,
        crop: FULL_CROP,
      },
    }))

  const flip = (axis: 'h' | 'v') =>
    update((s) => ({
      ...s,
      strokes: [],
      transform: {
        ...s.transform,
        flipH: axis === 'h' ? !s.transform.flipH : s.transform.flipH,
        flipV: axis === 'v' ? !s.transform.flipV : s.transform.flipV,
        crop: FULL_CROP,
      },
    }))

  const exportPhoto = async (options: ExportOptions) => {
    if (!image) return
    const blob = await exportImage(image.el, state, options)
    const ext = options.format.split('/')[1].replace('jpeg', 'jpg')
    const base = image.name.replace(/\.[^.]+$/, '')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${base}-edited.${ext}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const changeZoom = useCallback((z: number | 'fit') => {
    setZoom(z === 'fit' ? 'fit' : Math.min(8, Math.max(0.05, z)))
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target) || exportOpen) return
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && key === 'y') {
        e.preventDefault()
        redo()
      } else if (mod && key === 'o') {
        e.preventDefault()
        fileInput.current?.click()
      } else if (!image) {
        return
      } else if (mod && key === '0') {
        e.preventDefault()
        setZoom('fit')
      } else if (mod && (key === '=' || key === '+')) {
        e.preventDefault()
        changeZoom(scale * 1.25)
      } else if (mod && key === '-') {
        e.preventDefault()
        changeZoom(scale / 1.25)
      } else if (mod && key === 's') {
        e.preventDefault()
        setExportOpen(true)
      } else if (e.key === '\\' && !e.repeat) {
        setComparing(true)
      } else if (!mod && !e.altKey) {
        const match = TOOLS.find((t) => t.shortcut.toLowerCase() === key)
        if (match) setTool(match.id)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === '\\') setComparing(false)
    }
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
      if (file) openFile(file)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('paste', onPaste)
    }
  }, [undo, redo, image, scale, changeZoom, openFile, exportOpen])

  const finalSize = useMemo(() => {
    if (!image) return { w: 0, h: 0 }
    const swap = transform.rotation === 90 || transform.rotation === 270
    const w = swap ? image.el.naturalHeight : image.el.naturalWidth
    const h = swap ? image.el.naturalWidth : image.el.naturalHeight
    return { w: Math.round(w * transform.crop.w), h: Math.round(h * transform.crop.h) }
  }, [image, transform.rotation, transform.crop])

  const cropAspect = oriented ? aspectValue(aspect, oriented.width, oriented.height) : null

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) openFile(file)
      }}
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) openFile(file)
          e.target.value = ''
        }}
      />

      <TopBar
        hasImage={!!image}
        fileName={image?.name ?? ''}
        dimensions={image ? finalSize : null}
        canUndo={canUndo}
        canRedo={canRedo}
        scale={scale}
        onOpen={() => fileInput.current?.click()}
        onUndo={undo}
        onRedo={redo}
        onCompare={setComparing}
        onZoom={changeZoom}
        onExport={() => setExportOpen(true)}
      />

      {!image || !displayed ? (
        <EmptyState loading={loading} onOpen={() => fileInput.current?.click()} onSample={openSample} />
      ) : (
        <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <ToolRail tool={tool} onChange={setTool} />

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <EditorCanvas
              source={displayed}
              adjustments={rendered}
              strokes={state.strokes}
              showStrokes={!comparing && tool !== 'crop'}
              tool={tool}
              zoom={zoom}
              brush={brush}
              crop={{ rect: transform.crop, aspect: cropAspect, onChange: setCrop }}
              onScaleChange={setScale}
              onZoomChange={changeZoom}
              onHistogram={setHistogram}
              onAddStroke={(stroke) => update((s) => ({ ...s, strokes: [...s.strokes, stroke] }))}
            />
            {comparing && (
              <span className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                Original
              </span>
            )}
          </div>

          <aside
            aria-label={`${TOOLS.find((t) => t.id === tool)?.label} settings`}
            className="max-h-[42dvh] shrink-0 overflow-y-auto border-t border-border bg-panel p-4 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0"
          >
            {tool === 'adjust' && (
              <AdjustPanel
                adjustments={state.adjustments}
                histogram={histogram}
                onChange={setAdjustment}
                onResetGroup={resetGroup}
                onCommit={commit}
              />
            )}
            {tool === 'filters' && (
              <FiltersPanel
                source={displayed}
                adjustments={state.adjustments}
                filter={state.filter}
                onSelect={(id) => update((s) => ({ ...s, filter: { id, intensity: 100 } }))}
                onIntensity={(intensity, shouldCommit) =>
                  update((s) => ({ ...s, filter: { ...s.filter, intensity } }), shouldCommit)
                }
              />
            )}
            {tool === 'crop' && (
              <CropPanel
                aspect={aspect}
                straighten={transform.straighten}
                onAspect={chooseAspect}
                onRotate={rotate}
                onFlip={flip}
                onStraighten={(straighten, shouldCommit) =>
                  update((s) => ({ ...s, transform: { ...s.transform, straighten } }), shouldCommit)
                }
                onReset={() => {
                  setAspect('free')
                  update((s) => ({ ...s, transform: DEFAULT_TRANSFORM }))
                }}
                onDone={() => setTool('adjust')}
              />
            )}
            {tool === 'markup' && (
              <MarkupPanel
                brush={brush}
                strokeCount={state.strokes.length}
                onBrush={setBrush}
                onClear={() => update((s) => ({ ...s, strokes: [] }))}
              />
            )}
          </aside>
        </main>
      )}

      {image && (
        <ExportDialog open={exportOpen} baseSize={finalSize} onClose={() => setExportOpen(false)} onExport={exportPhoto} />
      )}

      {error && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-popover px-4 py-2.5 text-sm shadow-xl"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
      )}

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary px-10 py-8 text-sm font-medium text-primary">
            Drop to open photo
          </div>
        </div>
      )}
    </div>
  )
}
