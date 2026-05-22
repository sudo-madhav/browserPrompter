import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getLayoutPreset,
  type LayoutPreset,
  LAYOUT_PRESETS,
} from '../lib/layouts'

export type CameraRect = LayoutPreset['camera']

function cameraEquals(a: CameraRect, b: CameraRect): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.shape === b.shape
  )
}

export function useLayoutState(initialLayoutId = 'pip-bottom-right') {
  const [layoutId, setLayoutIdState] = useState(initialLayoutId)
  const [customCamera, setCustomCamera] = useState<CameraRect | null>(null)

  const basePreset = useMemo(() => getLayoutPreset(layoutId), [layoutId])

  const layout: LayoutPreset = useMemo(
    () =>
      customCamera
        ? { ...basePreset, camera: customCamera }
        : basePreset,
    [basePreset, customCamera],
  )

  const isCustom = customCamera !== null && !cameraEquals(customCamera, basePreset.camera)

  const setLayoutId = useCallback((id: string) => {
    setLayoutIdState(id)
    setCustomCamera(null)
  }, [])

  const updateCamera = useCallback((camera: CameraRect) => {
    setCustomCamera(camera)
  }, [])

  const resetToPreset = useCallback(() => {
    setCustomCamera(null)
  }, [])

  useEffect(() => {
    if (customCamera && cameraEquals(customCamera, basePreset.camera)) {
      setCustomCamera(null)
    }
  }, [basePreset, customCamera])

  return {
    layoutId,
    layout,
    isCustom,
    setLayoutId,
    updateCamera,
    resetToPreset,
    presets: LAYOUT_PRESETS,
  }
}
