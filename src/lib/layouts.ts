export interface LayoutRect {
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutPreset {
  id: string
  name: string
  camera: LayoutRect & {
    shape: 'rect' | 'circle' | 'rounded'
    borderRadius?: number
    mirror: boolean
  }
  screen: LayoutRect
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'pip-bottom-right',
    name: 'Bottom Right',
    camera: {
      x: 0.72,
      y: 0.68,
      width: 0.25,
      height: 0.28,
      shape: 'rounded',
      borderRadius: 12,
      mirror: true,
    },
    screen: { x: 0, y: 0, width: 1, height: 1 },
  },
  {
    id: 'side-by-side',
    name: 'Side by Side',
    camera: {
      x: 0,
      y: 0,
      width: 0.35,
      height: 1,
      shape: 'rect',
      mirror: true,
    },
    screen: { x: 0.35, y: 0, width: 0.65, height: 1 },
  },
  {
    id: 'circle-overlay',
    name: 'Circle',
    camera: {
      x: 0.04,
      y: 0.68,
      width: 0.22,
      height: 0.28,
      shape: 'circle',
      mirror: true,
    },
    screen: { x: 0, y: 0, width: 1, height: 1 },
  },
]

/** Full-frame camera — used for webcam-only mode */
export const WEBCAM_ONLY_LAYOUT: LayoutPreset = {
  id: 'webcam-only',
  name: 'Webcam',
  camera: {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    shape: 'rect',
    mirror: true,
  },
  screen: { x: 0, y: 0, width: 0, height: 0 },
}

/** Full-frame screen — used for screen-only mode */
export const SCREEN_ONLY_LAYOUT: LayoutPreset = {
  id: 'screen-only',
  name: 'Screen',
  camera: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    shape: 'rect',
    mirror: false,
  },
  screen: { x: 0, y: 0, width: 1, height: 1 },
}

export function getLayoutPreset(id: string): LayoutPreset {
  return LAYOUT_PRESETS.find((preset) => preset.id === id) ?? LAYOUT_PRESETS[0]
}

export function toPixels(
  rect: LayoutRect,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; width: number; height: number } {
  return {
    x: rect.x * canvasWidth,
    y: rect.y * canvasHeight,
    width: rect.width * canvasWidth,
    height: rect.height * canvasHeight,
  }
}
