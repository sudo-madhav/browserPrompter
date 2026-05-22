import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { get, set } from 'idb-keyval'
import { LayoutPicker } from './components/LayoutPicker'
import { PreviewStage } from './components/PreviewStage'
import { RecordControls } from './components/RecordControls'
import { RecordingModePicker } from './components/RecordingModePicker'
import { StreamControls } from './components/StreamControls'
import { TeleprompterEditor } from './components/TeleprompterEditor'
import { useMediaStreams } from './hooks/useMediaStreams'
import { useRecorder } from './hooks/useRecorder'
import { useTeleprompter } from './hooks/useTeleprompter'
import { downloadBlob } from './lib/download'
import {
  getLayoutPreset,
  SCREEN_ONLY_LAYOUT,
  WEBCAM_ONLY_LAYOUT,
} from './lib/layouts'
import {
  formatTrackResolution,
  type RecordingMode,
} from './lib/mediaConstraints'
import { recordingReducer } from './lib/recordingReducer'

const SCRIPT_KEY = 'localfirst-script'

function videoDimensions(stream: MediaStream): { width: number; height: number } {
  const track = stream.getVideoTracks()[0]
  const settings = track?.getSettings()
  return {
    width: settings?.width ?? 1280,
    height: settings?.height ?? 720,
  }
}

export default function App() {
  const [state, dispatch] = useReducer(recordingReducer, { status: 'idle' })
  const [mode, setMode] = useState<RecordingMode>('composite')
  const [layoutId, setLayoutId] = useState('pip-bottom-right')
  const [script, setScript] = useState('')
  const [opacity, setOpacity] = useState(60)
  const [speed, setSpeed] = useState(1)
  const [fontSize, setFontSize] = useState(28)
  const [warning, setWarning] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
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

  const isRecording = state.status === 'recording'
  const isStopping = state.status === 'stopping'
  const hasBlob = state.status === 'ready'
  const teleprompter = useTeleprompter(
    script,
    speed,
    isRecording || Boolean(streams.screen || streams.camera),
  )

  const layout =
    mode === 'camera-only'
      ? WEBCAM_ONLY_LAYOUT
      : mode === 'screen-only'
        ? SCREEN_ONLY_LAYOUT
        : getLayoutPreset(layoutId)

  const canRecord =
    mode === 'camera-only'
      ? Boolean(streams.camera)
      : mode === 'screen-only'
        ? Boolean(streams.screen)
        : Boolean(streams.screen)

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

  const handleStart = () => {
    if (!canRecord || isRecording) return
    setError(null)

    const onWarning = () => {
      setWarning('Recording is getting long. It will stop automatically at 10 minutes.')
    }

    try {
      if (mode === 'camera-only' && streams.camera) {
        const videoStream = new MediaStream([...streams.camera.getVideoTracks()])
        const { width, height } = videoDimensions(videoStream)
        startRecording(videoStream, streams.mic, width, height, onWarning)
      } else if (mode === 'screen-only' && streams.screen) {
        const videoStream = new MediaStream([...streams.screen.getVideoTracks()])
        const { width, height } = videoDimensions(videoStream)
        startRecording(videoStream, streams.mic, width, height, onWarning)
      } else {
        const capture = getCaptureStreamRef.current?.()
        if (!capture) {
          setError('Preview is not ready yet.')
          return
        }
        const size = captureSizeRef.current ?? { width: 1280, height: 720 }
        startRecording(capture, streams.mic, size.width, size.height, onWarning)
      }

      dispatch({ type: 'START_RECORDING' })
      setWarning(null)
    } catch {
      setError('Could not start recording.')
    }
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
  }

  const onCaptureStreamReady = useCallback((getter: () => MediaStream | null) => {
    getCaptureStreamRef.current = getter
  }, [])

  const onCaptureSizeChange = useCallback((size: { width: number; height: number } | null) => {
    setCaptureSize(size)
  }, [])

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">LocalFirst Studio</h1>
          <p className="text-sm text-zinc-400">
            Record locally at native resolution. No upload. No sign-up.
          </p>
        </div>
        <RecordingModePicker value={mode} onChange={setMode} />
        {mode === 'composite' ? (
          <LayoutPicker value={layoutId} onChange={setLayoutId} />
        ) : null}
      </header>

      <StreamControls
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

      <PreviewStage
        streams={streams}
        layout={layout}
        mode={mode}
        isRecording={isRecording}
        teleprompterScript={script}
        teleprompterOpacity={opacity}
        teleprompterOffset={teleprompter.offset}
        teleprompterFontSize={fontSize}
        onCaptureStreamReady={onCaptureStreamReady}
        onCaptureSizeChange={onCaptureSizeChange}
      />

      <RecordControls
        canRecord={canRecord}
        isRecording={isRecording}
        isStopping={isStopping}
        hasBlob={hasBlob}
        elapsedMs={elapsedMs}
        warning={warning}
        onStart={handleStart}
        onStop={handleStop}
        onDownload={handleDownload}
        onReset={handleClearRecording}
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleResetAll}
          disabled={isRecording}
          className="text-sm text-zinc-500 hover:text-zinc-300 disabled:opacity-40"
        >
          Disconnect all
        </button>
      </div>

      <TeleprompterEditor
        script={script}
        opacity={opacity}
        speed={speed}
        fontSize={fontSize}
        onScriptChange={setScript}
        onOpacityChange={setOpacity}
        onSpeedChange={setSpeed}
        onFontSizeChange={setFontSize}
      />
    </div>
  )
}
