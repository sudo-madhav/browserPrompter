type EmptyPreviewProps = {
  onStartScreen: () => void
  onStartCamera: () => void
}

export function EmptyPreview({ onStartScreen, onStartCamera }: EmptyPreviewProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-surface)] p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <svg
          className="h-8 w-8 text-[var(--color-text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--color-text)]">Connect your sources</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Share your screen and start your webcam to see the preview
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onStartScreen}
          className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-sm text-[var(--color-text)] ring-1 ring-[var(--color-border)] hover:ring-[var(--color-border-strong)]"
        >
          Share screen
        </button>
        <button
          type="button"
          onClick={onStartCamera}
          className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-sm text-[var(--color-text)] ring-1 ring-[var(--color-border)] hover:ring-[var(--color-border-strong)]"
        >
          Start webcam
        </button>
      </div>
    </div>
  )
}
