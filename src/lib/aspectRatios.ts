export type AspectRatioPreset = '16:9' | '9:16' | '1:1' | '4:3' | 'native'
export type FitMode = 'letterbox' | 'crop'
export type LetterboxStyle = 'black' | 'blur'

export interface AspectRatioConfig {
  id: AspectRatioPreset
  label: string
  ratio: number | null
  output: { width: number; height: number } | null
}

export const ASPECT_PRESETS: AspectRatioConfig[] = [
  { id: '16:9', label: 'Landscape', ratio: 16 / 9, output: { width: 1920, height: 1080 } },
  { id: '9:16', label: 'Portrait', ratio: 9 / 16, output: { width: 1080, height: 1920 } },
  { id: '1:1', label: 'Square', ratio: 1, output: { width: 1080, height: 1080 } },
  { id: '4:3', label: 'Classic', ratio: 4 / 3, output: { width: 1440, height: 1080 } },
  { id: 'native', label: 'Native', ratio: null, output: null },
]

export function getAspectConfig(id: AspectRatioPreset): AspectRatioConfig {
  return ASPECT_PRESETS.find((p) => p.id === id) ?? ASPECT_PRESETS[0]
}

export function formatAspectLabel(id: AspectRatioPreset): string {
  return getAspectConfig(id).label
}

/** CSS aspect-ratio value for preview container */
export function previewAspectRatio(
  preset: AspectRatioPreset,
  captureWidth?: number,
  captureHeight?: number,
): string {
  if (captureWidth && captureHeight && captureWidth > 0 && captureHeight > 0) {
    return `${captureWidth} / ${captureHeight}`
  }
  const config = getAspectConfig(preset)
  if (config.ratio) return `${config.ratio}`
  return '16 / 9'
}

export interface FitRect {
  x: number
  y: number
  width: number
  height: number
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
}

export function computeFitRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  fitMode: FitMode,
): FitRect {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      x: 0,
      y: 0,
      width: targetWidth,
      height: targetHeight,
      sourceX: 0,
      sourceY: 0,
      sourceWidth,
      sourceHeight,
    }
  }

  const sourceAspect = sourceWidth / sourceHeight
  const targetAspect = targetWidth / targetHeight

  if (fitMode === 'letterbox') {
    let drawWidth = targetWidth
    let drawHeight = targetHeight
    if (sourceAspect > targetAspect) {
      drawHeight = targetWidth / sourceAspect
    } else {
      drawWidth = targetHeight * sourceAspect
    }
    const x = (targetWidth - drawWidth) / 2
    const y = (targetHeight - drawHeight) / 2
    return {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
      sourceX: 0,
      sourceY: 0,
      sourceWidth,
      sourceHeight,
    }
  }

  let sourceX = 0
  let sourceY = 0
  let sourceW = sourceWidth
  let sourceH = sourceHeight
  if (sourceAspect > targetAspect) {
    sourceW = sourceHeight * targetAspect
    sourceX = (sourceWidth - sourceW) / 2
  } else {
    sourceH = sourceWidth / targetAspect
    sourceY = (sourceHeight - sourceH) / 2
  }
  return {
    x: 0,
    y: 0,
    width: targetWidth,
    height: targetHeight,
    sourceX,
    sourceY,
    sourceWidth: sourceW,
    sourceHeight: sourceH,
  }
}

/** Scale output to native source resolution when possible (avoid upscaling beyond source). */
export function resolveOutputSize(
  aspectPreset: AspectRatioPreset,
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } {
  const config = getAspectConfig(aspectPreset)
  if (!config.output) {
    if (sourceWidth > 0 && sourceHeight > 0) {
      return { width: sourceWidth, height: sourceHeight }
    }
    return { width: 1280, height: 720 }
  }

  const { width: targetW, height: targetH } = config.output
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { width: targetW, height: targetH }
  }

  // Never upscale beyond native source — keeps quality and performance sane
  const scale = Math.min(1, sourceWidth / targetW, sourceHeight / targetH)
  return {
    width: Math.round(targetW * scale),
    height: Math.round(targetH * scale),
  }
}

export function usesCanvasCapture(
  mode: 'composite' | 'camera-only' | 'screen-only',
  aspectPreset: AspectRatioPreset,
): boolean {
  if (mode === 'composite') return true
  return aspectPreset !== 'native'
}

/** Camera-only and screen-only should default to native to avoid unwanted crop. */
export function recommendedAspectForMode(mode: 'composite' | 'camera-only' | 'screen-only'): AspectRatioPreset {
  if (mode === 'camera-only' || mode === 'screen-only') return 'native'
  return '16:9'
}
