import { useEffect, useRef } from 'react'
import { useCompositor } from '../hooks/useCompositor'
import type { MediaStreams } from '../hooks/useMediaStreams'
import type { LayoutPreset } from '../lib/layouts'
import type { RecordingMode } from '../lib/mediaConstraints'

type PreviewStageProps = {
  streams: MediaStreams
  layout: LayoutPreset
  mode: RecordingMode
  isRecording: boolean
  teleprompterScript: string
  teleprompterOpacity: number
  teleprompterOffset: number
  teleprompterFontSize: number
  onCaptureStreamReady: (getStream: () => MediaStream | null) => void
  onCaptureSizeChange: (size: { width: number; height: number } | null) => void
}

export function PreviewStage({
  streams,
  layout,
  mode,
  isRecording,
  teleprompterScript,
  teleprompterOpacity,
  teleprompterOffset,
  teleprompterFontSize,
  onCaptureStreamReady,
  onCaptureSizeChange,
}: PreviewStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { getCaptureStream, captureSize } = useCompositor(
    canvasRef,
    streams,
    layout,
    mode,
    isRecording,
  )

  useEffect(() => {
    onCaptureStreamReady(getCaptureStream)
  }, [getCaptureStream, onCaptureStreamReady])

  useEffect(() => {
    onCaptureSizeChange(captureSize)
  }, [captureSize, onCaptureSizeChange])

  const hasVideo = Boolean(streams.screen || streams.camera)

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-black">
        <canvas ref={canvasRef} className="block w-full" />
        {teleprompterScript.trim() ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden px-8"
            style={{ opacity: teleprompterOpacity / 100 }}
          >
            <p
              className="whitespace-pre-wrap text-center leading-relaxed text-white drop-shadow"
              style={{
                fontSize: teleprompterFontSize,
                transform: `translateY(calc(40% - ${teleprompterOffset}px))`,
              }}
            >
              {teleprompterScript}
            </p>
          </div>
        ) : null}
        {!hasVideo ? (
          <div className="absolute inset-0 flex min-h-48 items-center justify-center bg-zinc-950/80 text-sm text-zinc-400">
            Start webcam and/or screen share to preview
          </div>
        ) : null}
      </div>
      {captureSize ? (
        <p className="text-xs text-zinc-500">
          Capture canvas: {captureSize.width}×{captureSize.height}
          {mode === 'camera-only' ? ' (preview — recording uses native camera stream)' : ''}
        </p>
      ) : null}
    </div>
  )
}
