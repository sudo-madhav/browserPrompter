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
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <label className="block text-sm font-medium text-zinc-300">
        Teleprompter script
        <textarea
          value={script}
          onChange={(event) => onScriptChange(event.target.value)}
          rows={5}
          placeholder="Paste your script here..."
          className="mt-2 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-zinc-400">
          Opacity {opacity}%
          <input
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(event) => onOpacityChange(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="text-xs text-zinc-400">
          Scroll speed {speed}
          <input
            type="range"
            min={0}
            max={4}
            step={0.1}
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="text-xs text-zinc-400">
          Font size {fontSize}px
          <input
            type="range"
            min={16}
            max={48}
            value={fontSize}
            onChange={(event) => onFontSizeChange(Number(event.target.value))}
            className="mt-1 w-full"
          />
        </label>
      </div>
    </div>
  )
}
