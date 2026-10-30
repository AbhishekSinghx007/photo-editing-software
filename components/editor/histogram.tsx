import type { HistogramData } from '@/lib/editor/histogram'

const W = 256
const H = 80

function toPath(bins: number[], max: number) {
  const step = W / (bins.length - 1)
  let d = `M0 ${H}`
  bins.forEach((v, i) => {
    d += ` L${(i * step).toFixed(1)} ${(H - (v / max) * H).toFixed(1)}`
  })
  return `${d} L${W} ${H} Z`
}

export function Histogram({ data }: { data: HistogramData | null }) {
  if (!data) {
    return <div className="h-20 rounded-lg bg-canvas" aria-hidden="true" />
  }
  const max = Math.max(...data.r, ...data.g, ...data.b, ...data.l, 1) * 0.9
  return (
    <figure className="overflow-hidden rounded-lg bg-canvas">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-20 w-full" role="img" aria-label="Color histogram">
        <path d={toPath(data.l, max)} fill="oklch(0.75 0 0 / 0.25)" />
        <g style={{ mixBlendMode: 'screen' }}>
          <path d={toPath(data.r, max)} fill="oklch(0.62 0.22 25 / 0.55)" />
          <path d={toPath(data.g, max)} fill="oklch(0.7 0.18 145 / 0.55)" />
          <path d={toPath(data.b, max)} fill="oklch(0.6 0.2 260 / 0.55)" />
        </g>
      </svg>
    </figure>
  )
}
