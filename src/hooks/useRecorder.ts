import { useCallback, useRef } from 'react'
import { pickRecorderMimeType, recorderBitrateForResolution } from '../lib/mediaConstraints'

const TIMESLICE_MS = 1000
const MAX_DURATION_MS = 10 * 60 * 1000
const WARN_DURATION_MS = 8 * 60 * 1000

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const warnTimeoutRef = useRef<number | null>(null)
  const stopTimeoutRef = useRef<number | null>(null)

  const clearTimers = () => {
    if (warnTimeoutRef.current) window.clearTimeout(warnTimeoutRef.current)
    if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current)
    warnTimeoutRef.current = null
    stopTimeoutRef.current = null
  }

  const startRecording = useCallback(
    (
      videoStream: MediaStream,
      micStream: MediaStream | null,
      width: number,
      height: number,
      onWarning: () => void,
    ) => {
      chunksRef.current = []
      clearTimers()

      const combined = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...(micStream?.getAudioTracks() ?? []),
      ])

      const mimeType = pickRecorderMimeType()
      const videoBitsPerSecond = recorderBitrateForResolution(width, height)

      const recorder = new MediaRecorder(combined, {
        mimeType,
        videoBitsPerSecond,
        audioBitsPerSecond: 128_000,
      })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.start(TIMESLICE_MS)

      warnTimeoutRef.current = window.setTimeout(onWarning, WARN_DURATION_MS)
      stopTimeoutRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, MAX_DURATION_MS)

      return recorder
    },
    [],
  )

  const stopRecording = useCallback(async (): Promise<Blob> => {
    clearTimers()
    const recorder = recorderRef.current
    if (!recorder) {
      return new Blob([], { type: 'video/webm' })
    }

    if (recorder.state === 'inactive') {
      return new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
    }

    return await new Promise((resolve, reject) => {
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' }))
      }
      recorder.onerror = () => reject(new Error('Recording failed.'))
      recorder.stop()
    })
  }, [])

  return { startRecording, stopRecording }
}
