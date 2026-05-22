import type { RecordingMode } from '../lib/mediaConstraints'

type RecordingModePickerProps = {
  value: RecordingMode
  onChange: (mode: RecordingMode) => void
}

const MODES: { id: RecordingMode; label: string; hint: string }[] = [
  { id: 'composite', label: 'Screen + Cam', hint: 'PiP layout over screen capture' },
  { id: 'camera-only', label: 'Webcam only', hint: 'Native camera resolution, no re-encode' },
  { id: 'screen-only', label: 'Screen only', hint: 'Screen capture at source resolution' },
]

export function RecordingModePicker({ value, onChange }: RecordingModePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          title={mode.hint}
          onClick={() => onChange(mode.id)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            value === mode.id
              ? 'bg-violet-600 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
