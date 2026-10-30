export type HistogramData = { r: number[]; g: number[]; b: number[]; l: number[] }

const BINS = 64
let sampler: HTMLCanvasElement | null = null

export function computeHistogram(source: HTMLCanvasElement): HistogramData {
  sampler ??= document.createElement('canvas')
  const scale = Math.min(1, 200 / Math.max(source.width, source.height))
  sampler.width = Math.max(1, Math.round(source.width * scale))
  sampler.height = Math.max(1, Math.round(source.height * scale))
  const ctx = sampler.getContext('2d', { willReadFrequently: true })!
  ctx.clearRect(0, 0, sampler.width, sampler.height)
  ctx.drawImage(source, 0, 0, sampler.width, sampler.height)
  const { data } = ctx.getImageData(0, 0, sampler.width, sampler.height)

  const r = new Array(BINS).fill(0)
  const g = new Array(BINS).fill(0)
  const b = new Array(BINS).fill(0)
  const l = new Array(BINS).fill(0)
  const shift = 256 / BINS
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    r[Math.floor(data[i] / shift)]++
    g[Math.floor(data[i + 1] / shift)]++
    b[Math.floor(data[i + 2] / shift)]++
    l[Math.floor((data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / shift)]++
  }
  return { r, g, b, l }
}
