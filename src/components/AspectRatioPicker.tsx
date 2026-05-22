import type { AspectRatioPreset } from '../lib/aspectRatios'
import { ASPECT_PRESETS } from '../lib/aspectRatios'

type AspectRatioPickerProps = {
  value: AspectRatioPreset
  onChange: (preset: AspectRatioPreset) => void
}

function AspectIcon({ id }: { id: AspectRatioPreset }) {
  const shapes: Record<AspectRatioPreset, string> = {
    '16:9': 'w-6 h-3.5',
    '9:16': 'w-3.5 h-6',
    '1:1': 'w-4 h-4',
    '4:3': 'w-5 h-4',
    native: 'w-5 h-3 border-dashed',
  }
  return (
    <span
      className={`inline-block rounded-sm border border-current ${shapes[id]}`}
      aria-hidden
    />
  )
}

export function AspectRatioPicker({ value, onChange }: AspectRatioPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ASPECT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          className={`flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-xs transition ${
            value === preset.id
              ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] ring-1 ring-[var(--color-border-strong)]'
              : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <AspectIcon id={preset.id} />
          <span className="font-medium">{preset.label}</span>
        </button>
      ))}
    </div>
  )
}
