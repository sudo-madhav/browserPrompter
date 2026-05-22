import { useCallback, useEffect, useRef, useState } from 'react'
import type { LayoutPreset } from '../lib/layouts'

const SNAP_THRESHOLD = 0.02
const MIN_SIZE = 0.12
const MAX_SIZE = 0.5

type DraggablePiPProps = {
  layout: LayoutPreset
  containerRef: React.RefObject<HTMLDivElement | null>
  visible: boolean
  onCameraChange: (camera: LayoutPreset['camera']) => void
}

function snapValue(value: number): number {
  const snaps = [0, 0.04, 0.68, 0.72, 1]
  for (const snap of snaps) {
    if (Math.abs(value - snap) < SNAP_THRESHOLD) return snap
  }
  return value
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function DraggablePiP({
  layout,
  containerRef,
  visible,
  onCameraChange,
}: DraggablePiPProps) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragStart = useRef<{ px: number; py: number; cx: number; cy: number } | null>(null)
  const resizeStart = useRef<{ px: number; py: number; w: number; h: number } | null>(null)

  const getRect = useCallback(() => {
    const el = containerRef.current
    if (!el) return null
    return el.getBoundingClientRect()
  }, [containerRef])

  const onPointerDownDrag = (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragging(true)
    dragStart.current = {
      px: event.clientX,
      py: event.clientY,
      cx: layout.camera.x,
      cy: layout.camera.y,
    }
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  const onPointerDownResize = (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setResizing(true)
    resizeStart.current = {
      px: event.clientX,
      py: event.clientY,
      w: layout.camera.width,
      h: layout.camera.height,
    }
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  useEffect(() => {
    if (!dragging && !resizing) return

    const onMove = (event: PointerEvent) => {
      const bounds = getRect()
      if (!bounds) return

      if (dragging && dragStart.current) {
        const dx = (event.clientX - dragStart.current.px) / bounds.width
        const dy = (event.clientY - dragStart.current.py) / bounds.height
        const x = snapValue(
          clamp(dragStart.current.cx + dx, 0, 1 - layout.camera.width),
        )
        const y = snapValue(
          clamp(dragStart.current.cy + dy, 0, 1 - layout.camera.height),
        )
        onCameraChange({ ...layout.camera, x, y })
      }

      if (resizing && resizeStart.current) {
        const dx = (event.clientX - resizeStart.current.px) / bounds.width
        const dy = (event.clientY - resizeStart.current.py) / bounds.height
        const delta = Math.max(dx, dy)
        const width = clamp(resizeStart.current.w + delta, MIN_SIZE, MAX_SIZE)
        const aspect = resizeStart.current.w / resizeStart.current.h
        const height = width / aspect
        onCameraChange({
          ...layout.camera,
          width,
          height: clamp(height, MIN_SIZE, MAX_SIZE),
        })
      }
    }

    const onUp = () => {
      setDragging(false)
      setResizing(false)
      dragStart.current = null
      resizeStart.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, resizing, getRect, layout.camera, onCameraChange])

  if (!visible || layout.camera.width <= 0) return null

  const { x, y, width, height, shape } = layout.camera
  const borderRadius =
    shape === 'circle' ? '9999px' : shape === 'rounded' ? '12px' : '2px'

  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden={!visible}
    >
      <div
        className={`pointer-events-auto absolute touch-none ring-2 ring-white/70 ${
          dragging || resizing ? 'ring-[var(--color-accent-record)]' : ''
        }`}
        style={{
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          width: `${width * 100}%`,
          height: `${height * 100}%`,
          borderRadius,
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={onPointerDownDrag}
      >
        <div className="absolute inset-0 rounded-[inherit] bg-white/5" />
        <div
          className="absolute -bottom-1 -right-1 h-4 w-4 cursor-se-resize rounded-sm bg-white/90 shadow"
          onPointerDown={onPointerDownResize}
          aria-label="Resize webcam"
        />
      </div>
    </div>
  )
}
