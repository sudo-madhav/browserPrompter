import type { RecordingMode } from '../lib/mediaConstraints'

type RecordingModePickerProps = {
  value: RecordingMode
  onChange: (mode: RecordingMode) => void
}

const MODES: { id: RecordingMode; label: string; hint: string }[] = [
  { id: 'composite', label: 'Studio view', hint: 'Record exactly what this preview shows' },
  { id: 'camera-only', label: 'Webcam only', hint: 'Native camera resolution, no re-encode' },
  { id: 'screen-only', label: 'Imported screen only', hint: 'External window without webcam PiP' },
]

export function RecordingModePicker({ value, onChange }: RecordingModePickerProps) {
  return (
    <div className="flex flex-col gap-1">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          title={mode.hint}
          onClick={() => onChange(mode.id)}
          className={`rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs transition ${
            value === mode.id
              ? 'bg-[var(--color-surface-raised)] font-medium text-[var(--color-text)] ring-1 ring-[var(--color-border-strong)]'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
