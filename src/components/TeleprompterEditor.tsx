type TeleprompterEditorProps = {
  script: string
  opacity: number
  speed: number
  fontSize: number
  onScriptChange: (value: string) => void
  onOpacityChange: (value: number) => void
  onSpeedChange: (value: number) => void
  onFontSizeChange: (value: number) => void
}

const SAMPLE_SCRIPT = `Welcome to today's video.

In this recording, I'll walk you through the key points step by step.

Let's get started.`

export function TeleprompterEditor({
  script,
  opacity,
  speed,
  fontSize,
  onScriptChange,
  onOpacityChange,
  onSpeedChange,
  onFontSizeChange,
}: TeleprompterEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Script
        </label>
        {!script.trim() ? (
          <button
            type="button"
            onClick={() => onScriptChange(SAMPLE_SCRIPT)}
            className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Insert sample
          </button>
        ) : null}
      </div>
      <textarea
        value={script}
        onChange={(event) => onScriptChange(event.target.value)}
        rows={8}
        placeholder="Paste your script here…"
        className="w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-strong)]"
      />
      <div className="grid gap-3">
        <label className="text-[11px] text-[var(--color-text-muted)]">
          Opacity {opacity}%
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(event) => onOpacityChange(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--color-accent-record)]"
          />
        </label>
        <label className="text-[11px] text-[var(--color-text-muted)]">
          Scroll speed {speed}
          <input
            type="range"
            min={0}
            max={4}
            step={0.1}
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--color-accent-record)]"
          />
        </label>
        <label className="text-[11px] text-[var(--color-text-muted)]">
          Font size {fontSize}px
          <input
            type="range"
            min={16}
            max={48}
            value={fontSize}
            onChange={(event) => onFontSizeChange(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--color-accent-record)]"
          />
        </label>
      </div>
    </div>
  )
}
