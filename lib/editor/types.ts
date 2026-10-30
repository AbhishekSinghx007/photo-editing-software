export type AdjustmentKey =
  | 'exposure'
  | 'brightness'
  | 'contrast'
  | 'highlights'
  | 'shadows'
  | 'temperature'
  | 'tint'
  | 'saturation'
  | 'vibrance'
  | 'hue'
  | 'sepia'
  | 'fade'
  | 'sharpen'
  | 'blur'
  | 'vignette'
  | 'grain'

export type Adjustments = Record<AdjustmentKey, number>

export type CropRect = { x: number; y: number; w: number; h: number }

export type Transform = {
  rotation: 0 | 90 | 180 | 270
  flipH: boolean
  flipV: boolean
  straighten: number
  crop: CropRect
}

export type Stroke = {
  points: [number, number][]
  color: string
  size: number
  opacity: number
}

export type EditorState = {
  adjustments: Adjustments
  filter: { id: string; intensity: number }
  transform: Transform
  strokes: Stroke[]
}

export type Tool = 'adjust' | 'filters' | 'crop' | 'markup'

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
  vibrance: 0,
  hue: 0,
  sepia: 0,
  fade: 0,
  sharpen: 0,
  blur: 0,
  vignette: 0,
  grain: 0,
}

export const FULL_CROP: CropRect = { x: 0, y: 0, w: 1, h: 1 }

export const DEFAULT_TRANSFORM: Transform = {
  rotation: 0,
  flipH: false,
  flipV: false,
  straighten: 0,
  crop: FULL_CROP,
}

export const INITIAL_STATE: EditorState = {
  adjustments: DEFAULT_ADJUSTMENTS,
  filter: { id: 'original', intensity: 100 },
  transform: DEFAULT_TRANSFORM,
  strokes: [],
}

export type AdjustmentDef = {
  key: AdjustmentKey
  label: string
  min: number
  max: number
}

export const ADJUSTMENT_GROUPS: { title: string; items: AdjustmentDef[] }[] = [
  {
    title: 'Light',
    items: [
      { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
      { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
      { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
      { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
      { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
    ],
  },
  {
    title: 'Color',
    items: [
      { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
      { key: 'tint', label: 'Tint', min: -100, max: 100 },
      { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
      { key: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
      { key: 'hue', label: 'Hue', min: -180, max: 180 },
    ],
  },
  {
    title: 'Effects',
    items: [
      { key: 'sharpen', label: 'Sharpen', min: 0, max: 100 },
      { key: 'blur', label: 'Blur', min: 0, max: 100 },
      { key: 'vignette', label: 'Vignette', min: -100, max: 100 },
      { key: 'grain', label: 'Grain', min: 0, max: 100 },
      { key: 'fade', label: 'Fade', min: 0, max: 100 },
      { key: 'sepia', label: 'Sepia', min: 0, max: 100 },
    ],
  },
]
