import { useEffect, useState } from 'react'

type ExportPlaybackProps = {
  blob: Blob
  onDownload: () => void
}

export function ExportPlayback({ blob, onDownload }: ExportPlaybackProps) {
  const [url, setUrl] = useState<string | null>(null)
  const sizeMb = (blob.size / (1024 * 1024)).toFixed(1)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  if (!url) return null

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 p-4">
      <video
        src={url}
        controls
        className="max-h-[70%] max-w-full rounded-[var(--radius-frame)]"
      />
      <p className="text-xs text-zinc-400">{sizeMb} MB · WebM</p>
      <button
        type="button"
        onClick={onDownload}
        className="rounded-[var(--radius-sm)] bg-[var(--color-accent-record)] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
      >
        Download WebM
      </button>
    </div>
  )
}
