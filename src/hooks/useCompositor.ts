import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  AspectRatioPreset,
  FitMode,
  LetterboxStyle,
} from '../lib/aspectRatios'
import { computeFitRect, resolveOutputSize } from '../lib/aspectRatios'
import { drawVideoFit, drawVideoInRect } from '../lib/drawVideo'
import type { LayoutPreset } from '../lib/layouts'
import { toPixels } from '../lib/layouts'
import type { RecordingMode } from '../lib/mediaConstraints'
import type { StudioBackground } from '../lib/studioBackground'
import type { MediaStreams } from './useMediaStreams'

const CAPTURE_FPS = 30
const RECORDING_FRAME_MS = 1000 / CAPTURE_FPS
const CAPTURE_STREAM_FPS = 0
const MAX_RECORDING_HEIGHT = 1080

type TeleprompterLayoutCache = {
  key: string
  lines: string[]
}

function scaleSizeForRecording(
  size: { width: number; height: number },
  nativeSize: { width: number; height: number },
  shouldScale: boolean,
): { width: number; height: number } {
  if (!shouldScale) return size
  let width = size.width
  let height = size.height

  // Never upscale recording output beyond source resolution.
  if (nativeSize.width > 0 && nativeSize.height > 0) {
    const sourceScale = Math.min(1, nativeSize.width / width, nativeSize.height / height)
    width *= sourceScale
    height *= sourceScale
  }

  // Clamp very large captures to 1080p height for stable frame pacing.
  if (height > MAX_RECORDING_HEIGHT) {
    const heightScale = MAX_RECORDING_HEIGHT / height
    width *= heightScale
    height *= heightScale
  }

  return {
    width: Math.max(2, Math.round(width / 2) * 2),
    height: Math.max(2, Math.round(height / 2) * 2),
  }
}

function resolveNativeSize(
  mode: RecordingMode,
  screenVideo: HTMLVideoElement | null,
  cameraVideo: HTMLVideoElement | null,
): { width: number; height: number } {
  const screenW = screenVideo?.videoWidth ?? 0
  const screenH = screenVideo?.videoHeight ?? 0
  const camW = cameraVideo?.videoWidth ?? 0
  const camH = cameraVideo?.videoHeight ?? 0

  if (mode === 'camera-only' && camW > 0 && camH > 0) {
    return { width: camW, height: camH }
  }
  if (mode === 'screen-only' && screenW > 0 && screenH > 0) {
    return { width: screenW, height: screenH }
  }
  if (screenW > 0 && screenH > 0) {
    return { width: screenW, height: screenH }
  }
  if (camW > 0 && camH > 0) {
    return { width: camW, height: camH }
  }
  return { width: 1280, height: 720 }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }
    const words = paragraph.split(' ')
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

function drawTeleprompterOverlay(
  ctx: CanvasRenderingContext2D,
  script: string,
  offset: number,
  opacity: number,
  fontSize: number,
  canvasWidth: number,
  canvasHeight: number,
  layoutCache: TeleprompterLayoutCache,
) {
  if (!script.trim() || opacity === 0) return

  const scale = canvasHeight / 720
  const scaledFontSize = Math.max(12, Math.round(fontSize * scale))
  const scaledOffset = offset * scale
  const paddingH = 40 * scale
  const paddingV = 14 * scale
  const lineHeight = scaledFontSize * 1.5
  const maxTextWidth = canvasWidth - paddingH * 2
  const alpha = opacity / 100
  // Teleprompter visible in top half of canvas (matches DOM overflow:hidden behavior)
  const clipHeight = canvasHeight * 0.52

  ctx.save()
  ctx.font = `600 ${scaledFontSize}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const layoutKey = `${scaledFontSize}:${Math.round(maxTextWidth)}:${script}`
  const lines =
    layoutCache.key === layoutKey
      ? layoutCache.lines
      : wrapText(ctx, script, maxTextWidth)
  if (layoutCache.key !== layoutKey) {
    layoutCache.key = layoutKey
    layoutCache.lines = lines
  }
  if (lines.length === 0) {
    ctx.restore()
    return
  }

  const totalTextHeight = lines.length * lineHeight
  // Mirror DOM: translateY(calc(40% of text block height - offset))
  const startY = totalTextHeight * 0.4 - scaledOffset

  // Clip draw to top portion
  ctx.beginPath()
  ctx.rect(0, 0, canvasWidth, clipHeight)
  ctx.clip()

  const visible: Array<{ text: string; y: number }> = []
  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight
    if (y + lineHeight < 0) continue
    if (y > clipHeight) break
    visible.push({ text: lines[i], y })
  }

  if (visible.length === 0) {
    ctx.restore()
    return
  }

  // Semi-transparent dark scrim behind visible text block — readable on white or black
  const scrimPadH = 24 * scale
  const firstY = visible[0].y
  const lastY = visible[visible.length - 1].y + lineHeight
  const scrimY = Math.max(0, firstY - paddingV)
  const scrimH = Math.min(lastY + paddingV, clipHeight) - scrimY

  if (scrimH > 0) {
    // Ensure scrim is always dark enough for white text to be readable, regardless
    // of the user-set opacity. At low opacity the scrim would otherwise be too
    // transparent on white or light backgrounds.
    ctx.globalAlpha = Math.max(alpha * 0.82, 0.65)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
    ctx.beginPath()
    ctx.roundRect(scrimPadH, scrimY, canvasWidth - scrimPadH * 2, scrimH, 10 * scale)
    ctx.fill()
  }

  // White text with shadow for additional depth
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
  ctx.shadowBlur = 3 * scale
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 1 * scale

  for (const { text, y } of visible) {
    ctx.fillText(text, canvasWidth / 2, y)
  }

  ctx.restore()
}

function drawCameraOverlay(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  preset: LayoutPreset,
  canvasWidth: number,
  canvasHeight: number,
  fitMode: FitMode,
) {
  if (preset.camera.width <= 0 || preset.camera.height <= 0) return

  const cam = toPixels(preset.camera, canvasWidth, canvasHeight)

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (preset.camera.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(cam.x + cam.width / 2, cam.y + cam.height / 2, cam.width / 2, 0, Math.PI * 2)
    ctx.clip()
    drawVideoInRect(
      ctx,
      video,
      cam.x,
      cam.y,
      cam.width,
      cam.height,
      'crop',
      preset.camera.mirror,
    )
  } else if (preset.camera.shape === 'rounded' && preset.camera.borderRadius) {
    ctx.beginPath()
    ctx.roundRect(cam.x, cam.y, cam.width, cam.height, preset.camera.borderRadius)
    ctx.clip()
    drawVideoInRect(
      ctx,
      video,
      cam.x,
      cam.y,
      cam.width,
      cam.height,
      'crop',
      preset.camera.mirror,
    )
  } else {
    drawVideoInRect(
      ctx,
      video,
      cam.x,
      cam.y,
      cam.width,
      cam.height,
      fitMode,
      preset.camera.mirror,
    )
  }

  ctx.restore()
}

function drawStudioBackground(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  background: StudioBackground,
  image: HTMLImageElement | null,
  fitMode: FitMode,
) {
  if (background.kind === 'solid') {
    ctx.fillStyle = background.primaryColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    return
  }

  if (background.kind === 'image' && image && image.naturalWidth > 0 && image.naturalHeight > 0) {
    const rect = computeFitRect(
      image.naturalWidth,
      image.naturalHeight,
      canvasWidth,
      canvasHeight,
      fitMode,
    )
    if (fitMode === 'letterbox') {
      ctx.fillStyle = background.primaryColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }
    ctx.drawImage(
      image,
      rect.sourceX,
      rect.sourceY,
      rect.sourceWidth,
      rect.sourceHeight,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    )
    return
  }

  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
  gradient.addColorStop(0, background.primaryColor)
  gradient.addColorStop(1, background.secondaryColor)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
}

export function useCompositor(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  streams: MediaStreams | null,
  layout: LayoutPreset,
  mode: RecordingMode,
  studioBackground: StudioBackground,
  isRecording: boolean,
  aspectPreset: AspectRatioPreset,
  fitMode: FitMode,
  letterboxStyle: LetterboxStyle,
  teleprompterScript: string,
  teleprompterOffset: number,
  teleprompterOpacity: number,
  teleprompterFontSize: number,
) {
  const screenVideoRef = useRef<HTMLVideoElement | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const recordingIntervalRef = useRef<number | null>(null)
  const captureStreamRef = useRef<MediaStream | null>(null)
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)
  const teleprompterLayoutCacheRef = useRef<TeleprompterLayoutCache>({ key: '', lines: [] })
  const [captureSize, setCaptureSize] = useState<{ width: number; height: number } | null>(null)

  // Store teleprompter values in a ref so drawFrame reads current values without
  // being recreated on every offset/script change (which would restart RAF/interval loops).
  const teleprompterRef = useRef({ teleprompterScript, teleprompterOffset, teleprompterOpacity, teleprompterFontSize })
  teleprompterRef.current = { teleprompterScript, teleprompterOffset, teleprompterOpacity, teleprompterFontSize }

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const nativeSize = resolveNativeSize(
      mode,
      screenVideoRef.current,
      cameraVideoRef.current,
    )
    const size = resolveOutputSize(aspectPreset, nativeSize.width, nativeSize.height)
    const shouldScaleForRecording =
      isRecording && mode !== 'camera-only' && Boolean(screenVideoRef.current?.videoWidth)
    const outputSize = scaleSizeForRecording(size, nativeSize, shouldScaleForRecording)

    if (canvas.width !== outputSize.width || canvas.height !== outputSize.height) {
      canvas.width = outputSize.width
      canvas.height = outputSize.height
      setCaptureSize(outputSize)
      captureStreamRef.current = null
    }
    return outputSize
  }, [canvasRef, mode, aspectPreset, isRecording])

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    const screenVideo = screenVideoRef.current
    const cameraVideo = cameraVideoRef.current
    if (!canvas) return

    syncCanvasSize()

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    const showScreen =
      mode !== 'camera-only' &&
      screenVideo &&
      screenVideo.readyState >= 2 &&
      layout.screen.width > 0
    const showCamera =
      mode !== 'screen-only' &&
      cameraVideo &&
      cameraVideo.readyState >= 2 &&
      layout.camera.width > 0

    const useFit = aspectPreset !== 'native'

    const effectiveLetterboxStyle = letterboxStyle

    if (showScreen) {
      if (useFit) {
        drawVideoFit(ctx, screenVideo, width, height, fitMode, effectiveLetterboxStyle)
      } else {
        drawVideoFit(ctx, screenVideo, width, height, 'letterbox', 'black')
      }
    } else if (showCamera && mode === 'camera-only') {
      if (useFit) {
        drawVideoFit(ctx, cameraVideo, width, height, fitMode, effectiveLetterboxStyle)
      } else {
        drawVideoFit(ctx, cameraVideo, width, height, 'letterbox', 'black')
      }
    } else {
      drawStudioBackground(
        ctx,
        width,
        height,
        studioBackground,
        backgroundImageRef.current,
        fitMode,
      )
    }

    if (showCamera && mode !== 'camera-only') {
      drawCameraOverlay(ctx, cameraVideo, layout, width, height, fitMode)
    }

    const tp = teleprompterRef.current
    drawTeleprompterOverlay(
      ctx,
      tp.teleprompterScript,
      tp.teleprompterOffset,
      tp.teleprompterOpacity,
      tp.teleprompterFontSize,
      width,
      height,
      teleprompterLayoutCacheRef.current,
    )
  }, [
    canvasRef,
    layout,
    mode,
    aspectPreset,
    fitMode,
    letterboxStyle,
    isRecording,
    studioBackground,
    syncCanvasSize,
  ])

  useEffect(() => {
    let screenVideo: HTMLVideoElement | null = null
    let cameraVideo: HTMLVideoElement | null = null
    const cleanups: Array<() => void> = []

    if (streams?.screen) {
      screenVideo = document.createElement('video')
      screenVideo.muted = true
      screenVideo.playsInline = true
      screenVideo.srcObject = streams.screen
      screenVideoRef.current = screenVideo
      const onMeta = () => syncCanvasSize()
      screenVideo.addEventListener('loadedmetadata', onMeta)
      cleanups.push(() => screenVideo?.removeEventListener('loadedmetadata', onMeta))
      void screenVideo.play()
    } else {
      screenVideoRef.current = null
    }

    if (streams?.camera) {
      cameraVideo = document.createElement('video')
      cameraVideo.muted = true
      cameraVideo.playsInline = true
      cameraVideo.srcObject = streams.camera
      cameraVideoRef.current = cameraVideo
      const onMeta = () => syncCanvasSize()
      cameraVideo.addEventListener('loadedmetadata', onMeta)
      cleanups.push(() => cameraVideo?.removeEventListener('loadedmetadata', onMeta))
      void cameraVideo.play()
    } else {
      cameraVideoRef.current = null
    }

    return () => {
      for (const cleanup of cleanups) cleanup()
      if (screenVideo) screenVideo.srcObject = null
      if (cameraVideo) cameraVideo.srcObject = null
      screenVideoRef.current = null
      cameraVideoRef.current = null
    }
  }, [streams?.screen, streams?.camera, syncCanvasSize])

  useEffect(() => {
    if (studioBackground.kind !== 'image' || !studioBackground.imageUrl.trim()) {
      backgroundImageRef.current = null
      return
    }

    let cancelled = false
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'
    image.src = studioBackground.imageUrl.trim()
    image.onload = () => {
      if (cancelled) return
      backgroundImageRef.current = image
      drawFrame()
    }
    image.onerror = () => {
      if (cancelled) return
      backgroundImageRef.current = null
      drawFrame()
    }

    return () => {
      cancelled = true
    }
  }, [studioBackground.kind, studioBackground.imageUrl, drawFrame])

  const requestCaptureFrame = useCallback(() => {
    const stream = captureStreamRef.current
    if (!stream) return
    const track = stream.getVideoTracks()[0] as MediaStreamTrack & {
      requestFrame?: () => void
    }
    track.requestFrame?.()
  }, [])

  // Preview loop — RAF when idle
  useEffect(() => {
    if (isRecording) return

    const tick = () => {
      drawFrame()
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [streams, drawFrame, isRecording])

  // Recording loop — fixed 30fps interval (reliable for captureStream; RAF throttles in background)
  useEffect(() => {
    if (!isRecording) {
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      return
    }

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const drawRecordingFrame = () => {
      drawFrame()
      requestCaptureFrame()
    }

    drawFrame()
    requestCaptureFrame()
    recordingIntervalRef.current = window.setInterval(drawRecordingFrame, RECORDING_FRAME_MS)
    return () => {
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording, drawFrame, requestCaptureFrame])

  const getCaptureStream = useCallback((): MediaStream | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    syncCanvasSize()

    if (!captureStreamRef.current) {
      captureStreamRef.current = canvas.captureStream(CAPTURE_STREAM_FPS)
    }

    return captureStreamRef.current
  }, [canvasRef, syncCanvasSize])

  return { getCaptureStream, captureSize }
}
