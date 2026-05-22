import type { LayoutPreset } from '../lib/layouts'
import { LAYOUT_PRESETS } from '../lib/layouts'

type LayoutPickerProps = {
  value: string
  onChange: (layoutId: string) => void
}

export function LayoutPicker({ value, onChange }: LayoutPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {LAYOUT_PRESETS.map((preset: LayoutPreset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(preset.id)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            value === preset.id
              ? 'bg-violet-600 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {preset.name}
        </button>
      ))}
    </div>
  )
}
