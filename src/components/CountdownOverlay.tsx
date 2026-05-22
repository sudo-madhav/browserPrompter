type CountdownOverlayProps = {
  count: number | null
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count === null) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <span className="font-mono text-8xl font-semibold text-white tabular-nums animate-pulse">
        {count}
      </span>
    </div>
  )
}
