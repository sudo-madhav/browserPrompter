import { useEffect, useRef, useState } from 'react'

export function useTeleprompter(script: string, speed: number, isActive: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [offset, setOffset] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!isActive || paused || !script.trim()) return

    const id = window.setInterval(() => {
      setOffset((current) => current + speed)
    }, 16)

    return () => window.clearInterval(id)
  }, [isActive, paused, script, speed])

  useEffect(() => {
    setOffset(0)
  }, [script])

  return {
    containerRef,
    offset,
    paused,
    setPaused,
    togglePaused: () => setPaused((value) => !value),
  }
}
