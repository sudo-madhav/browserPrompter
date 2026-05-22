import { useEffect, useRef } from 'react'
import { useCompositor } from '../hooks/useCompositor'
import type { MediaStreams } from '../hooks/useMediaStreams'
import type {
  AspectRatioPreset,
  FitMode,
  LetterboxStyle,
} from '../lib/aspectRatios'
import { formatAspectLabel, previewAspectRatio } from '../lib/aspectRatios'
import type { LayoutPreset } from '../lib/layouts'
import type { RecordingMode } from '../lib/mediaConstraints'
import type { StudioBackground } from '../lib/studioBackground'
import { CountdownOverlay } from './CountdownOverlay'
import { DraggablePiP } from './DraggablePiP'
import { EmptyPreview } from './EmptyPreview'
import { ExportPlayback } from './ExportPlayback'
import { TransportBar } from './TransportBar'

type PreviewStageProps = {
  streams: MediaStreams
  layout: LayoutPreset
  mode: RecordingMode
  studioBackground: StudioBackground
  isRecording: boolean
  aspectPreset: AspectRatioPreset
  fitMode: FitMode
  letterboxStyle: LetterboxStyle
  teleprompterScript: string
  teleprompterOpacity: number
  teleprompterOffset: number
  teleprompterFontSize: number
  countdown: number | null
  canRecord: boolean
  isStopping: boolean
  hasBlob: boolean
  elapsedMs: number
  warning: string | null
  recordingBlob: Blob | null
  onCameraChange: (camera: LayoutPreset['camera']) => void
  onCaptureStreamReady: (getStream: () => MediaStream | null) => void
  onCaptureSizeChange: (size: { width: number; height: number } | null) => void
  onStartRecord: () => void
  onStopRecord: () => void
  onDownload: () => void
  onResetRecording: () => void
  onStartScreen: () => void
  onStartCamera: () => void
}

export function PreviewStage({
  streams,
  layout,
  mode,
  studioBackground,
  isRecording,
  aspectPreset,
  fitMode,
  letterboxStyle,
  teleprompterScript,
  teleprompterOpacity,
  teleprompterOffset,
  teleprompterFontSize,
  countdown,
  canRecord,
  isStopping,
  hasBlob,
  elapsedMs,
  warning,
  recordingBlob,
  onCameraChange,
  onCaptureStreamReady,
  onCaptureSizeChange,
  onStartRecord,
  onStopRecord,
  onDownload,
  onResetRecording,
  onStartScreen,
  onStartCamera,
}: PreviewStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { getCaptureStream, captureSize } = useCompositor(
    canvasRef,
    streams,
    layout,
    mode,
    studioBackground,
    isRecording,
    aspectPreset,
    fitMode,
    letterboxStyle,
    teleprompterScript,
    teleprompterOffset,
    teleprompterOpacity,
    teleprompterFontSize,
  )

  useEffect(() => {
    onCaptureStreamReady(getCaptureStream)
  }, [getCaptureStream, onCaptureStreamReady])

  useEffect(() => {
    onCaptureSizeChange(captureSize)
  }, [captureSize, onCaptureSizeChange])

  const hasVideo = Boolean(streams.screen || streams.camera)
  const showEmptyPreview = !hasVideo && mode !== 'composite'
  const showDraggablePiP =
    mode === 'composite' && Boolean(streams.camera) && layout.camera.width > 0
  const aspectLabel = captureSize
    ? `${captureSize.width}×${captureSize.height} · ${formatAspectLabel(aspectPreset)}`
    : formatAspectLabel(aspectPreset)

  return (
    <div className="flex h-full flex-col gap-2">
      <div
        ref={containerRef}
        className="preview-frame relative w-full overflow-hidden rounded-[var(--radius-frame)] bg-black ring-1 ring-[var(--color-border)]"
        style={{
          aspectRatio: previewAspectRatio(
            aspectPreset,
            captureSize?.width,
            captureSize?.height,
          ),
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain" />

        <DraggablePiP
          layout={layout}
          containerRef={containerRef}
          visible={showDraggablePiP}
          onCameraChange={onCameraChange}
        />

        {showEmptyPreview ? (
          <EmptyPreview onStartScreen={onStartScreen} onStartCamera={onStartCamera} />
        ) : null}

        <CountdownOverlay count={countdown} />

        {hasBlob && recordingBlob && !isRecording ? (
          <ExportPlayback blob={recordingBlob} onDownload={onDownload} />
        ) : null}

        <TransportBar
          canRecord={canRecord}
          isRecording={isRecording}
          isStopping={isStopping}
          hasBlob={hasBlob}
          elapsedMs={elapsedMs}
          aspectLabel={aspectLabel}
          warning={warning}
          onStart={onStartRecord}
          onStop={onStopRecord}
          onDownload={onDownload}
          onReset={onResetRecording}
        />
      </div>
    </div>
  )
}
