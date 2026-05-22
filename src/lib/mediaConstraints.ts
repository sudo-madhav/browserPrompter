export type RecordingMode = 'composite' | 'camera-only' | 'screen-only'
export type RecorderContentProfile = 'camera' | 'screen'

export const SCREEN_VIDEO_CONSTRAINTS: DisplayMediaStreamOptions['video'] = {
  frameRate: { ideal: 60, max: 60 },
  width: { ideal: 3840, max: 3840 },
  height: { ideal: 2160, max: 2160 },
}

export const CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: 'user',
  width: { ideal: 3840, max: 3840 },
  height: { ideal: 2160, max: 2160 },
  frameRate: { ideal: 30, max: 60 },
}

export const MIC_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

export function pickRecorderMimeType(profile: RecorderContentProfile = 'screen'): string {
  const candidates =
    profile === 'screen'
      ? ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm']
      : ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? 'video/webm'
}

export function recorderBitrateForResolution(
  width: number,
  height: number,
  profile: RecorderContentProfile = 'screen',
): number {
  const pixels = width * height
  if (profile === 'screen') {
    if (pixels >= 3840 * 2160) return 10_000_000
    if (pixels >= 1920 * 1080) return 6_000_000
    if (pixels >= 1280 * 720) return 4_000_000
    return 2_500_000
  }
  if (pixels >= 3840 * 2160) return 20_000_000
  if (pixels >= 1920 * 1080) return 10_000_000
  if (pixels >= 1280 * 720) return 5_000_000
  return 2_500_000
}

export function formatTrackResolution(stream: MediaStream | null | undefined): string | null {
  const track = stream?.getVideoTracks()[0]
  if (!track) return null
  const settings = track.getSettings()
  if (settings.width && settings.height) {
    return `${settings.width}×${settings.height}${settings.frameRate ? `@${Math.round(settings.frameRate)}fps` : ''}`
  }
  return null
}
