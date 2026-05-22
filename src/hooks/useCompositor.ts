import { useCallback, useEffect, useRef, useState } from 'react'
import type { LayoutPreset } from '../lib/layouts'
import { toPixels } from '../lib/layouts'
import type { RecordingMode } from '../lib/mediaConstraints'
import type { MediaStreams } from './useMediaStreams'

const CAPTURE_FPS = 30
const BACKUP_INTERVAL_MS = 33

function drawCamera(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  preset: LayoutPreset,
  canvasWidth: number,
  canvasHeight: number,
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
  } else if (preset.camera.shape === 'rounded' && preset.camera.borderRadius) {
    const radius = preset.camera.borderRadius
    ctx.beginPath()
    ctx.roundRect(cam.x, cam.y, cam.width, cam.height, radius)
    ctx.clip()
  }

  if (preset.camera.mirror) {
    ctx.translate(cam.x + cam.width, cam.y)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, cam.width, cam.height)
  } else {
    ctx.drawImage(video, cam.x, cam.y, cam.width, cam.height)
  }
  ctx.restore()
}

function resolveCanvasSize(
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

export function useCompositor(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  streams: MediaStreams | null,
  layout: LayoutPreset,
  mode: RecordingMode,
  isRecording: boolean,
) {
  const screenVideoRef = useRef<HTMLVideoElement | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const [captureSize, setCaptureSize] = useState<{ width: number; height: number } | null>(null)

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const size = resolveCanvasSize(
      mode,
      screenVideoRef.current,
      cameraVideoRef.current,
    )
    if (canvas.width !== size.width || canvas.height !== size.height) {
      canvas.width = size.width
      canvas.height = size.height
      setCaptureSize(size)
    }
    return size
  }, [canvasRef, mode])

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
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const showScreen =
      mode !== 'camera-only' && screenVideo && screenVideo.readyState >= 2 && layout.screen.width > 0
    const showCamera =
      mode !== 'screen-only' && cameraVideo && cameraVideo.readyState >= 2 && layout.camera.width > 0

    if (showScreen) {
      const screen = toPixels(layout.screen, width, height)
      ctx.drawImage(screenVideo, screen.x, screen.y, screen.width, screen.height)
    }

    if (showCamera) {
      drawCamera(ctx, cameraVideo, layout, width, height)
    }
  }, [canvasRef, layout, mode, syncCanvasSize])

  useEffect(() => {
    if (!streams?.screen && !streams?.camera) {
      screenVideoRef.current = null
      cameraVideoRef.current = null
      setCaptureSize(null)
      return
    }

    let screenVideo: HTMLVideoElement | null = null
    let cameraVideo: HTMLVideoElement | null = null
    const cleanups: Array<() => void> = []

    if (streams.screen) {
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

    if (streams.camera) {
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
      if (screenVideo) {
        screenVideo.srcObject = null
      }
      if (cameraVideo) {
        cameraVideo.srcObject = null
      }
      screenVideoRef.current = null
      cameraVideoRef.current = null
    }
  }, [streams?.screen, streams?.camera, syncCanvasSize])

  useEffect(() => {
    if (!streams?.screen && !streams?.camera) return

    const tick = () => {
      drawFrame()
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [streams, drawFrame])

  useEffect(() => {
    if (!isRecording || !streams) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(drawFrame, BACKUP_INTERVAL_MS)
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRecording, streams, drawFrame])

  const getCaptureStream = useCallback((): MediaStream | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    syncCanvasSize()
    return canvas.captureStream(CAPTURE_FPS)
  }, [canvasRef, syncCanvasSize])

  return { getCaptureStream, captureSize }
}
