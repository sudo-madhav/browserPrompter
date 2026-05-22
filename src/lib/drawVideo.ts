import type { FitMode, LetterboxStyle } from './aspectRatios'
import { computeFitRect, type FitRect } from './aspectRatios'

export function drawVideoFit(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number,
  fitMode: FitMode,
  letterboxStyle: LetterboxStyle,
  offsetX = 0,
  offsetY = 0,
): FitRect {
  const fit = computeFitRect(
    video.videoWidth,
    video.videoHeight,
    canvasWidth,
    canvasHeight,
    fitMode,
  )

  const drawX = offsetX + fit.x
  const drawY = offsetY + fit.y

  if (letterboxStyle === 'blur' && fitMode === 'letterbox') {
    ctx.save()
    ctx.filter = 'blur(24px) brightness(0.4)'
    const cover = computeFitRect(
      video.videoWidth,
      video.videoHeight,
      canvasWidth,
      canvasHeight,
      'crop',
    )
    ctx.drawImage(
      video,
      cover.sourceX,
      cover.sourceY,
      cover.sourceWidth,
      cover.sourceHeight,
      offsetX,
      offsetY,
      canvasWidth,
      canvasHeight,
    )
    ctx.restore()
  } else if (offsetX === 0 && offsetY === 0) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    video,
    fit.sourceX,
    fit.sourceY,
    fit.sourceWidth,
    fit.sourceHeight,
    drawX,
    drawY,
    fit.width,
    fit.height,
  )

  return { ...fit, x: drawX, y: drawY }
}

/** Draw video into a sub-rect preserving aspect ratio (letterbox within bounds). */
export function drawVideoInRect(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
  fitMode: FitMode,
  mirror: boolean,
): void {
  if (rectW <= 0 || rectH <= 0 || video.videoWidth <= 0) return

  ctx.save()
  ctx.beginPath()
  ctx.rect(rectX, rectY, rectW, rectH)
  ctx.clip()

  const fit = computeFitRect(video.videoWidth, video.videoHeight, rectW, rectH, fitMode)
  const drawX = rectX + fit.x
  const drawY = rectY + fit.y

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (mirror) {
    ctx.translate(drawX + fit.width, drawY)
    ctx.scale(-1, 1)
    ctx.drawImage(
      video,
      fit.sourceX,
      fit.sourceY,
      fit.sourceWidth,
      fit.sourceHeight,
      0,
      0,
      fit.width,
      fit.height,
    )
  } else {
    ctx.drawImage(
      video,
      fit.sourceX,
      fit.sourceY,
      fit.sourceWidth,
      fit.sourceHeight,
      drawX,
      drawY,
      fit.width,
      fit.height,
    )
  }

  ctx.restore()
}
