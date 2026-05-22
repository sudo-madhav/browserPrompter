import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CAMERA_VIDEO_CONSTRAINTS,
  MIC_AUDIO_CONSTRAINTS,
  SCREEN_VIDEO_CONSTRAINTS,
} from '../lib/mediaConstraints'

export type MediaStreams = {
  screen: MediaStream | null
  camera: MediaStream | null
  mic: MediaStream | null
}

const EMPTY_STREAMS: MediaStreams = { screen: null, camera: null, mic: null }

function stopStream(stream: MediaStream | null) {
  if (!stream) return
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

export function useMediaStreams() {
  const [streams, setStreams] = useState<MediaStreams>(EMPTY_STREAMS)
  const [error, setError] = useState<string | null>(null)
  const streamsRef = useRef(streams)
  streamsRef.current = streams

  const updateStreams = useCallback((patch: Partial<MediaStreams>) => {
    setStreams((current) => ({ ...current, ...patch }))
  }, [])

  const stopAll = useCallback(() => {
    const current = streamsRef.current
    stopStream(current.screen)
    stopStream(current.camera)
    stopStream(current.mic)
    setStreams(EMPTY_STREAMS)
  }, [])

  const startMic = useCallback(async (): Promise<MediaStream | null> => {
    setError(null)
    if (streamsRef.current.mic) return streamsRef.current.mic
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: MIC_AUDIO_CONSTRAINTS,
        video: false,
      })
      updateStreams({ mic })
      return mic
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not access microphone.'
      setError(message)
      return null
    }
  }, [updateStreams])

  const stopMic = useCallback(() => {
    stopStream(streamsRef.current.mic)
    updateStreams({ mic: null })
  }, [updateStreams])

  const startCamera = useCallback(async (): Promise<MediaStream | null> => {
    setError(null)
    if (streamsRef.current.camera) return streamsRef.current.camera
    try {
      await startMic()
      const camera = await navigator.mediaDevices.getUserMedia({
        video: CAMERA_VIDEO_CONSTRAINTS,
        audio: false,
      })
      updateStreams({ camera })
      return camera
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not access camera.'
      setError(message)
      return null
    }
  }, [startMic, updateStreams])

  const stopCamera = useCallback(() => {
    stopStream(streamsRef.current.camera)
    updateStreams({ camera: null })
  }, [updateStreams])

  const startScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    setError(null)
    if (streamsRef.current.screen) return streamsRef.current.screen
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: SCREEN_VIDEO_CONSTRAINTS,
        audio: false,
      })

      const track = screen.getVideoTracks()[0]
      track?.addEventListener('ended', () => {
        updateStreams({ screen: null })
        setError('Screen sharing stopped.')
      })

      updateStreams({ screen })
      return screen
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not share screen.'
      setError(message)
      return null
    }
  }, [updateStreams])

  const stopScreenShare = useCallback(() => {
    stopStream(streamsRef.current.screen)
    updateStreams({ screen: null })
  }, [updateStreams])

  const hasVideoSource = useCallback(() => {
    const current = streamsRef.current
    return Boolean(current.screen?.getVideoTracks().length || current.camera?.getVideoTracks().length)
  }, [])

  useEffect(() => {
    return () => {
      const current = streamsRef.current
      stopStream(current.screen)
      stopStream(current.camera)
      stopStream(current.mic)
    }
  }, [])

  return {
    streams,
    error,
    setError,
    startMic,
    stopMic,
    startCamera,
    stopCamera,
    startScreenShare,
    stopScreenShare,
    stopAll,
    hasVideoSource,
  }
}
