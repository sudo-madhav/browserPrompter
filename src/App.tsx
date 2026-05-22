import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { get, set } from 'idb-keyval'
import { PreviewStage } from './components/PreviewStage'
import { ScriptPanel } from './components/ScriptPanel'
import { SetupRail } from './components/SetupRail'
import { StudioShell } from './components/StudioShell'
import { useLayoutState } from './hooks/useLayoutState'
import { useMediaStreams } from './hooks/useMediaStreams'
import { useRecorder } from './hooks/useRecorder'
import { useTeleprompter } from './hooks/useTeleprompter'
import type {
  AspectRatioPreset,
  FitMode,
  LetterboxStyle,
} from './lib/aspectRatios'
import { recommendedAspectForMode } from './lib/aspectRatios'
import { downloadBlob } from './lib/download'
import { SCREEN_ONLY_LAYOUT, WEBCAM_ONLY_LAYOUT } from './lib/layouts'
import {
  formatTrackResolution,
  type RecordingMode,
} from './lib/mediaConstraints'
import { recordingReducer } from './lib/recordingReducer'
import { DEFAULT_STUDIO_BACKGROUND } from './lib/studioBackground'

const SCRIPT_KEY = 'localfirst-script'

function StatusBar({
  ready,
  onDisconnectAll,
  disabled,
}: {
  ready: boolean
  onDisconnectAll: () => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
          LocalFirst Studio
        </h1>
        <p className="text-xs text-[var(--color-text-muted)]">
          Record locally. No upload. No sign-up.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span
            className={`h-2 w-2 rounded-full ${
              ready ? 'bg-emerald-400' : 'bg-zinc-600'
            }`}
            aria-hidden
          />
          {ready ? 'Ready' : 'Setup'}
        </span>
        <button
          type="button"
          onClick={onDisconnectAll}
          disabled={disabled}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
        >
          Disconnect all
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [state, dispatch] = useReducer(recordingReducer, { status: 'idle' })
  const [mode, setMode] = useState<RecordingMode>('composite')
  const {
    layoutId,
    layout,
    isCustom,
    setLayoutId,
    updateCamera,
    resetToPreset,
  } = useLayoutState('pip-bottom-right')
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('16:9')
  const [fitMode, setFitMode] = useState<FitMode>('letterbox')
  const [letterboxStyle, setLetterboxStyle] = useState<LetterboxStyle>('black')
  const [script, setScript] = useState('')
  const [opacity, setOpacity] = useState(60)
  const [speed, setSpeed] = useState(1)
  const [fontSize, setFontSize] = useState(28)
  const [studioBackground, setStudioBackground] = useState(DEFAULT_STUDIO_BACKGROUND)
  const [warning, setWarning] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [captureSize, setCaptureSize] = useState<{ width: number; height: number } | null>(
    null,
  )

  const {
    streams,
    error,
    setError,
    startCamera,
    stopCamera,
    startScreenShare,
    stopScreenShare,
    stopMic,
    stopAll,
  } = useMediaStreams()
  const { startRecording, stopRecording } = useRecorder()
  const getCaptureStreamRef = useRef<(() => MediaStream | null) | null>(null)
  const captureSizeRef = useRef(captureSize)
  captureSizeRef.current = captureSize
  const countdownTimerRef = useRef<number | null>(null)

  const isRecording = state.status === 'recording'
  const isStopping = state.status === 'stopping'
  const hasBlob = state.status === 'ready'
  const recordingBlob = state.status === 'ready' ? state.blob : null

  const { offset: teleprompterOffset } = useTeleprompter(
    script,
    speed,
    isRecording,
  )

  const activeLayout =
    mode === 'camera-only'
      ? WEBCAM_ONLY_LAYOUT
      : mode === 'screen-only'
        ? SCREEN_ONLY_LAYOUT
        : layout

  const canRecord =
    mode === 'composite'
      ? true
      : mode === 'camera-only'
      ? Boolean(streams.camera)
      : mode === 'screen-only'
        ? Boolean(streams.screen)
        : true

  const isReady = canRecord

  useEffect(() => {
    void get<string>(SCRIPT_KEY).then((saved) => {
      if (saved) setScript(saved)
    })
  }, [])

  useEffect(() => {
    void set(SCRIPT_KEY, script)
  }, [script])

  useEffect(() => {
    if (state.status !== 'recording') return
    const startedAt = state.startedAt
    const id = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 250)
    return () => window.clearInterval(id)
  }, [state])

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
    }
  }, [])

  const handleModeChange = useCallback((newMode: RecordingMode) => {
    setMode(newMode)
    setAspectPreset(recommendedAspectForMode(newMode))
  }, [])

  const beginRecording = useCallback(() => {
    setError(null)
    const onWarning = () => {
      setWarning('Recording is getting long. It will stop automatically at 10 minutes.')
    }

    try {
      const capture = getCaptureStreamRef.current?.()
      if (!capture) {
        setError('Preview is not ready yet.')
        return
      }
      const size = captureSizeRef.current ?? { width: 1280, height: 720 }
      startRecording(capture, streams.mic, size.width, size.height, 'screen', onWarning)

      dispatch({ type: 'START_RECORDING' })
      setWarning(null)
    } catch {
      setError('Could not start recording.')
    }
  }, [setError, startRecording, streams.mic])

  const handleStart = () => {
    if (!canRecord || isRecording || countdown !== null) return
    setCountdown(3)

    let remaining = 3
    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
        setCountdown(null)
        beginRecording()
      }
    }, 1000)
  }

  const handleStop = async () => {
    if (state.status !== 'recording') return
    dispatch({ type: 'STOP_RECORDING' })
    try {
      const blob = await stopRecording()
      dispatch({ type: 'RECORDING_READY', blob })
    } catch {
      setError('Failed to save recording.')
      dispatch({ type: 'RESET' })
    }
  }

  const handleDownload = () => {
    if (state.status !== 'ready') return
    downloadBlob(state.blob, `localfirst-${Date.now()}.webm`)
  }

  const handleClearRecording = () => {
    if (isRecording) return
    dispatch({ type: 'RESET' })
    setWarning(null)
    setElapsedMs(0)
  }

  const handleResetAll = () => {
    if (isRecording) return
    stopAll()
    dispatch({ type: 'RESET' })
    setWarning(null)
    setElapsedMs(0)
    setError(null)
    setCountdown(null)
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current)
  }

  const onCaptureStreamReady = useCallback((getter: () => MediaStream | null) => {
    getCaptureStreamRef.current = getter
  }, [])

  const onCaptureSizeChange = useCallback((size: { width: number; height: number } | null) => {
    setCaptureSize(size)
  }, [])

  return (
    <>
      <StudioShell
        statusBar={
          <StatusBar
            ready={isReady}
            onDisconnectAll={handleResetAll}
            disabled={isRecording}
          />
        }
        setupRail={
          <SetupRail
            mode={mode}
            onModeChange={handleModeChange}
            layoutId={layoutId}
            onLayoutChange={setLayoutId}
            isCustomLayout={isCustom}
            onResetLayout={resetToPreset}
            showLayoutPicker={mode === 'composite'}
            aspectPreset={aspectPreset}
            onAspectChange={setAspectPreset}
            fitMode={fitMode}
            onFitModeChange={setFitMode}
            letterboxStyle={letterboxStyle}
            onLetterboxStyleChange={setLetterboxStyle}
            studioBackground={studioBackground}
            onBackgroundKindChange={(kind) =>
              setStudioBackground((current) => ({ ...current, kind }))
            }
            onBackgroundPrimaryColorChange={(primaryColor) =>
              setStudioBackground((current) => ({ ...current, primaryColor }))
            }
            onBackgroundSecondaryColorChange={(secondaryColor) =>
              setStudioBackground((current) => ({ ...current, secondaryColor }))
            }
            onBackgroundImageUrlChange={(imageUrl) =>
              setStudioBackground((current) => ({ ...current, imageUrl }))
            }
            hasScreen={Boolean(streams.screen)}
            hasCamera={Boolean(streams.camera)}
            hasMic={Boolean(streams.mic)}
            isRecording={isRecording}
            screenLabel={formatTrackResolution(streams.screen)}
            cameraLabel={formatTrackResolution(streams.camera)}
            onStartScreen={startScreenShare}
            onStopScreen={stopScreenShare}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
            onStopMic={stopMic}
          />
        }
        preview={
          <PreviewStage
            streams={streams}
            layout={activeLayout}
            mode={mode}
            studioBackground={studioBackground}
            isRecording={isRecording}
            aspectPreset={aspectPreset}
            fitMode={fitMode}
            letterboxStyle={letterboxStyle}
            teleprompterScript={script}
            teleprompterOpacity={opacity}
            teleprompterOffset={teleprompterOffset}
            teleprompterFontSize={fontSize}
            countdown={countdown}
            canRecord={canRecord}
            isStopping={isStopping}
            hasBlob={hasBlob}
            elapsedMs={elapsedMs}
            warning={warning}
            recordingBlob={recordingBlob}
            onCameraChange={updateCamera}
            onCaptureStreamReady={onCaptureStreamReady}
            onCaptureSizeChange={onCaptureSizeChange}
            onStartRecord={handleStart}
            onStopRecord={handleStop}
            onDownload={handleDownload}
            onResetRecording={handleClearRecording}
            onStartScreen={startScreenShare}
            onStartCamera={startCamera}
          />
        }
        scriptPanel={
          <ScriptPanel
            script={script}
            opacity={opacity}
            speed={speed}
            fontSize={fontSize}
            onScriptChange={setScript}
            onOpacityChange={setOpacity}
            onSpeedChange={setSpeed}
            onFontSizeChange={setFontSize}
          />
        }
      />
      {error ? (
        <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-[var(--radius-sm)] bg-red-950 px-4 py-2 text-sm text-red-200 ring-1 ring-red-800">
          {error}
        </p>
      ) : null}
    </>
  )
}
