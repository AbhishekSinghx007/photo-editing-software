import { ADJUSTMENT_GROUPS, type Adjustments, type AdjustmentKey } from './types'

export type FilterPreset = {
  id: string
  name: string
  values: Partial<Adjustments>
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'original', name: 'Original', values: {} },
  { id: 'vivid', name: 'Vivid', values: { contrast: 18, saturation: 25, vibrance: 30, shadows: 10 } },
  { id: 'golden', name: 'Golden', values: { temperature: 40, exposure: 8, highlights: -15, vibrance: 15, vignette: 20 } },
  { id: 'arctic', name: 'Arctic', values: { temperature: -40, tint: -8, brightness: 8, saturation: -10, highlights: 10 } },
  { id: 'cinema', name: 'Cinema', values: { contrast: 25, saturation: -20, temperature: -12, tint: 6, shadows: -12, vignette: 35, fade: 15 } },
  { id: 'matte', name: 'Matte', values: { fade: 45, contrast: -15, saturation: -15, shadows: 15 } },
  { id: 'drama', name: 'Drama', values: { contrast: 45, highlights: -30, shadows: -20, sharpen: 30, vignette: 45, saturation: -10 } },
  { id: 'mono', name: 'Mono', values: { saturation: -100, contrast: 15 } },
  { id: 'noir', name: 'Noir', values: { saturation: -100, contrast: 50, exposure: -10, vignette: 55, grain: 25 } },
  { id: 'vintage', name: 'Vintage', values: { sepia: 55, fade: 30, contrast: -10, vignette: 40, grain: 30 } },
  { id: 'pastel', name: 'Pastel', values: { brightness: 12, contrast: -25, saturation: -20, fade: 25, tint: 10 } },
  { id: 'bloom', name: 'Bloom', values: { exposure: 12, highlights: 20, blur: 8, vibrance: 20, temperature: 10 } },
]

const RANGES = new Map<AdjustmentKey, { min: number; max: number }>(
  ADJUSTMENT_GROUPS.flatMap((g) => g.items.map((i) => [i.key, { min: i.min, max: i.max }] as const)),
)

export function combineAdjustments(
  base: Adjustments,
  filterId: string,
  intensity: number,
): Adjustments {
  const preset = FILTER_PRESETS.find((p) => p.id === filterId)
  if (!preset) return base
  const result = { ...base }
  for (const [key, value] of Object.entries(preset.values) as [AdjustmentKey, number][]) {
    const range = RANGES.get(key)!
    const next = base[key] + value * (intensity / 100)
    result[key] = Math.min(range.max, Math.max(range.min, next))
  }
  return result
}
