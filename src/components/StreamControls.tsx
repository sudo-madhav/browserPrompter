type StreamControlsProps = {
  hasScreen: boolean
  hasCamera: boolean
  hasMic: boolean
  isRecording: boolean
  screenLabel: string | null
  cameraLabel: string | null
  onStartScreen: () => void
  onStopScreen: () => void
  onStartCamera: () => void
  onStopCamera: () => void
  onStopMic: () => void
}

function SourceRow({
  label,
  active,
  activeAction,
  inactiveAction,
  onClick,
  disabled,
  detail,
}: {
  label: string
  active: boolean
  activeAction: string
  inactiveAction: string
  onClick: () => void
  disabled?: boolean
  detail: string | null
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            active ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-zinc-600'
          }`}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-text)]">{label}</p>
          {detail ? (
            <p className="truncate font-mono text-[10px] text-[var(--color-text-muted)]">{detail}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] disabled:opacity-40"
      >
        {active ? activeAction : inactiveAction}
      </button>
    </div>
  )
}

export function StreamControls({
  hasScreen,
  hasCamera,
  hasMic,
  isRecording,
  screenLabel,
  cameraLabel,
  onStartScreen,
  onStopScreen,
  onStartCamera,
  onStopCamera,
  onStopMic,
}: StreamControlsProps) {
  const locked = isRecording

  return (
    <div className="flex flex-col gap-1.5">
      <SourceRow
        label="External window"
        active={hasScreen}
        activeAction="Remove"
        inactiveAction="Import"
        onClick={hasScreen ? onStopScreen : onStartScreen}
        disabled={locked}
        detail={screenLabel}
      />
      <SourceRow
        label="Webcam"
        active={hasCamera}
        activeAction="Stop"
        inactiveAction="Start"
        onClick={hasCamera ? onStopCamera : onStartCamera}
        disabled={locked}
        detail={cameraLabel}
      />
      {hasMic ? (
        <SourceRow
          label="Microphone"
          active={hasMic}
          activeAction="Mute"
          inactiveAction="On"
          onClick={onStopMic}
          disabled={locked}
          detail="Connected"
        />
      ) : null}
    </div>
  )
}
