import type { LayoutPreset } from '../lib/layouts'
import { LAYOUT_PRESETS } from '../lib/layouts'

type LayoutPickerProps = {
  value: string
  onChange: (layoutId: string) => void
}

function LayoutThumbnail({ preset, active }: { preset: LayoutPreset; active: boolean }) {
  return (
    <div
      className={`relative h-10 w-14 overflow-hidden rounded-[4px] border ${
        active ? 'border-[var(--color-text)]' : 'border-[var(--color-border)]'
      } bg-[var(--color-bg)]`}
    >
      <div className="absolute inset-0.5 rounded-sm bg-zinc-700/80" />
      {preset.camera.width > 0 ? (
        <div
          className={`absolute bg-zinc-400/90 ${
            preset.camera.shape === 'circle' ? 'rounded-full' : 'rounded-sm'
          }`}
          style={{
            left: `${preset.camera.x * 100}%`,
            top: `${preset.camera.y * 100}%`,
            width: `${preset.camera.width * 100}%`,
            height: `${preset.camera.height * 100}%`,
          }}
        />
      ) : null}
      {preset.screen.width > 0 && preset.screen.width < 1 ? (
        <div
          className="absolute bg-zinc-500/70"
          style={{
            left: `${preset.screen.x * 100}%`,
            top: `${preset.screen.y * 100}%`,
            width: `${preset.screen.width * 100}%`,
            height: `${preset.screen.height * 100}%`,
          }}
        />
      ) : null}
    </div>
  )
}

export function LayoutPicker({ value, onChange }: LayoutPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {LAYOUT_PRESETS.map((preset) => {
        const active = value === preset.id
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={`flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition ${
              active
                ? 'bg-[var(--color-surface-raised)] ring-1 ring-[var(--color-border-strong)]'
                : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)]'
            }`}
          >
            <LayoutThumbnail preset={preset} active={active} />
            <span
              className={`text-xs font-medium ${
                active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {preset.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
