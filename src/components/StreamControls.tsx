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

function StreamButton({
  active,
  activeLabel,
  inactiveLabel,
  onStart,
  onStop,
  disabled,
  resolution,
}: {
  active: boolean
  activeLabel: string
  inactiveLabel: string
  onStart: () => void
  onStop: () => void
  disabled?: boolean
  resolution: string | null
}) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={active ? onStop : onStart}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${
          active
            ? 'bg-emerald-900/60 text-emerald-200 ring-1 ring-emerald-700 hover:bg-emerald-900'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
        }`}
      >
        {active ? activeLabel : inactiveLabel}
      </button>
      {resolution ? <span className="text-xs text-zinc-500">{resolution}</span> : null}
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
    <div className="flex flex-wrap items-start gap-3">
      <StreamButton
        active={hasScreen}
        activeLabel="Stop screen share"
        inactiveLabel="Share screen"
        onStart={onStartScreen}
        onStop={onStopScreen}
        disabled={locked}
        resolution={screenLabel}
      />
      <StreamButton
        active={hasCamera}
        activeLabel="Stop webcam"
        inactiveLabel="Start webcam"
        onStart={onStartCamera}
        onStop={onStopCamera}
        disabled={locked}
        resolution={cameraLabel}
      />
      {hasMic ? (
        <button
          type="button"
          disabled={locked}
          onClick={onStopMic}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
        >
          Mute mic
        </button>
      ) : null}
    </div>
  )
}
