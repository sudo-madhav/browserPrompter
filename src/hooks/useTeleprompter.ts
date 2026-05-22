import { useEffect, useState } from 'react'

/**
 * Computes a scroll offset that increases over time while active.
 * The offset is consumed exclusively by the canvas compositor
 * (drawTeleprompterOverlay in useCompositor) — there is intentionally
 * no DOM overlay counterpart. Do NOT attach this offset to any DOM
 * element or a second visible teleprompter will appear alongside the
 * canvas-drawn one.
 */
export function useTeleprompter(script: string, speed: number, isActive: boolean) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (!isActive || !script.trim()) return

    const id = window.setInterval(() => {
      setOffset((current) => current + speed)
    }, 16)

    return () => window.clearInterval(id)
  }, [isActive, script, speed])

  useEffect(() => {
    setOffset(0)
  }, [script])

  return { offset }
}
