type RecordControlsProps = {
  canRecord: boolean
  isRecording: boolean
  isStopping: boolean
  hasBlob: boolean
  elapsedMs: number
  warning: string | null
  onStart: () => void
  onStop: () => void
  onDownload: () => void
  onReset: () => void
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function RecordControls({
  canRecord,
  isRecording,
  isStopping,
  hasBlob,
  elapsedMs,
  warning,
  onStart,
  onStop,
  onDownload,
  onReset,
}: RecordControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {canRecord && !isRecording && !isStopping ? (
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Record
        </button>
      ) : null}

      {isRecording ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
        >
          Stop
        </button>
      ) : null}

      {isStopping ? (
        <span className="text-sm text-zinc-400">Finalizing recording…</span>
      ) : null}

      {isRecording || hasBlob ? (
        <span className="font-mono text-sm text-zinc-300">{formatElapsed(elapsedMs)}</span>
      ) : null}

      {hasBlob ? (
        <button
          type="button"
          onClick={onDownload}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Download WebM
        </button>
      ) : null}

      {canRecord || hasBlob ? (
        <button
          type="button"
          onClick={onReset}
          disabled={isRecording}
          className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
        >
          Clear recording
        </button>
      ) : null}

      {warning ? <p className="w-full text-sm text-amber-400">{warning}</p> : null}
    </div>
  )
}
