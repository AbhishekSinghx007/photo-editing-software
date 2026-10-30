import { combineAdjustments } from './presets'
import { ImageRenderer } from './renderer'
import type { CropRect, EditorState, Stroke, Transform } from './types'

type Drawable = HTMLImageElement | HTMLCanvasElement

function sizeOf(source: Drawable) {
  return source instanceof HTMLImageElement
    ? { w: source.naturalWidth, h: source.naturalHeight }
    : { w: source.width, h: source.height }
}

export function downscale(source: Drawable, maxDim: number): HTMLCanvasElement {
  const { w, h } = sizeOf(source)
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function orient(source: Drawable, t: Transform): HTMLCanvasElement {
  const { w, h } = sizeOf(source)
  const swap = t.rotation === 90 || t.rotation === 270
  const outW = swap ? h : w
  const outH = swap ? w : h
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'

  const theta = (t.straighten * Math.PI) / 180
  const cos = Math.abs(Math.cos(theta))
  const sin = Math.abs(Math.sin(theta))
  const cover = Math.max((outW * cos + outH * sin) / outW, (outW * sin + outH * cos) / outH)

  ctx.translate(outW / 2, outH / 2)
  ctx.rotate(theta)
  ctx.scale(cover, cover)
  ctx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1)
  ctx.rotate((t.rotation * Math.PI) / 180)
  ctx.drawImage(source, -w / 2, -h / 2, w, h)
  return canvas
}

export function cropCanvas(source: HTMLCanvasElement, crop: CropRect): HTMLCanvasElement {
  if (crop.x === 0 && crop.y === 0 && crop.w === 1 && crop.h === 1) return source
  const sx = Math.round(crop.x * source.width)
  const sy = Math.round(crop.y * source.height)
  const sw = Math.max(1, Math.round(crop.w * source.width))
  const sh = Math.max(1, Math.round(crop.h * source.height))
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  canvas.getContext('2d')!.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas
}

export function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], width: number, height: number) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue
    ctx.globalAlpha = stroke.opacity
    ctx.strokeStyle = stroke.color
    ctx.fillStyle = stroke.color
    ctx.lineWidth = stroke.size * width
    const [fx, fy] = stroke.points[0]
    if (stroke.points.length === 1) {
      ctx.beginPath()
      ctx.arc(fx * width, fy * height, (stroke.size * width) / 2, 0, Math.PI * 2)
      ctx.fill()
      continue
    }
    ctx.beginPath()
    ctx.moveTo(fx * width, fy * height)
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const [x, y] = stroke.points[i]
      const [nx, ny] = stroke.points[i + 1]
      ctx.quadraticCurveTo(x * width, y * height, ((x + nx) / 2) * width, ((y + ny) / 2) * height)
    }
    const [lx, ly] = stroke.points[stroke.points.length - 1]
    ctx.lineTo(lx * width, ly * height)
    ctx.stroke()
  }
  ctx.restore()
}

export type ExportOptions = {
  format: 'image/png' | 'image/jpeg' | 'image/webp'
  quality: number
  scale: number
}

export async function exportImage(
  original: HTMLImageElement,
  state: EditorState,
  options: ExportOptions,
): Promise<Blob> {
  const renderer = new ImageRenderer()
  try {
    const base = options.scale < 1 ? downscale(original, Math.max(original.naturalWidth, original.naturalHeight) * options.scale) : original
    let source = cropCanvas(orient(base, state.transform), state.transform.crop)
    if (Math.max(source.width, source.height) > renderer.maxSize) source = downscale(source, renderer.maxSize)
    renderer.setSource(source)
    renderer.render(combineAdjustments(state.adjustments, state.filter.id, state.filter.intensity))

    const out = document.createElement('canvas')
    out.width = source.width
    out.height = source.height
    const ctx = out.getContext('2d')!
    if (options.format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, out.width, out.height)
    }
    ctx.drawImage(renderer.canvas, 0, 0)
    drawStrokes(ctx, state.strokes, out.width, out.height)

    return await new Promise<Blob>((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), options.format, options.quality),
    )
  } finally {
    renderer.dispose()
  }
}
