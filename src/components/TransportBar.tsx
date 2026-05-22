type TransportBarProps = {
  canRecord: boolean
  isRecording: boolean
  isStopping: boolean
  hasBlob: boolean
  elapsedMs: number
  aspectLabel: string
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

export function TransportBar({
  canRecord,
  isRecording,
  isStopping,
  hasBlob,
  elapsedMs,
  aspectLabel,
  warning,
  onStart,
  onStop,
  onDownload,
  onReset,
}: TransportBarProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-10">
      <div className="flex flex-wrap items-center gap-3">
        {canRecord && !isRecording && !isStopping ? (
          <button
            type="button"
            onClick={onStart}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-accent-record)] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" aria-hidden />
            Record
          </button>
        ) : null}

        {isRecording ? (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-zinc-900" aria-hidden />
            Stop
          </button>
        ) : null}

        {isStopping ? (
          <span className="text-sm text-zinc-300">Finalizing…</span>
        ) : null}

        {isRecording || hasBlob ? (
          <span className="font-mono text-sm tabular-nums text-white">{formatElapsed(elapsedMs)}</span>
        ) : null}

        <span className="text-xs text-zinc-400">{aspectLabel}</span>

        {hasBlob ? (
          <>
            <button
              type="button"
              onClick={onDownload}
              className="rounded-[var(--radius-sm)] border border-zinc-600 px-3 py-1.5 text-sm text-white hover:bg-white/10"
            >
              Download WebM
            </button>
            <button
              type="button"
              onClick={onReset}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          </>
        ) : null}
      </div>
      {warning ? <p className="mt-2 text-xs text-amber-400">{warning}</p> : null}
    </div>
  )
}
