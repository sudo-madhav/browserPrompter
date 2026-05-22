import type { ReactNode } from 'react'
import type { AspectRatioPreset, FitMode, LetterboxStyle } from '../lib/aspectRatios'
import { ASPECT_PRESETS } from '../lib/aspectRatios'
import type { RecordingMode } from '../lib/mediaConstraints'
import type { StudioBackground, StudioBackgroundKind } from '../lib/studioBackground'
import { AspectRatioPicker } from './AspectRatioPicker'
import { LayoutPicker } from './LayoutPicker'
import { RecordingModePicker } from './RecordingModePicker'
import { StreamControls } from './StreamControls'

type SetupRailProps = {
  mode: RecordingMode
  onModeChange: (mode: RecordingMode) => void
  layoutId: string
  onLayoutChange: (id: string) => void
  isCustomLayout: boolean
  onResetLayout: () => void
  showLayoutPicker: boolean
  aspectPreset: AspectRatioPreset
  onAspectChange: (preset: AspectRatioPreset) => void
  fitMode: FitMode
  onFitModeChange: (mode: FitMode) => void
  letterboxStyle: LetterboxStyle
  onLetterboxStyleChange: (style: LetterboxStyle) => void
  studioBackground: StudioBackground
  onBackgroundKindChange: (kind: StudioBackgroundKind) => void
  onBackgroundPrimaryColorChange: (color: string) => void
  onBackgroundSecondaryColorChange: (color: string) => void
  onBackgroundImageUrlChange: (url: string) => void
  hasScreen: boolean
  hasCamera: boolean
  hasMic: boolean
  isRecording: boolean
  screenLabel: string | null
  cameraLabel: string | null
  onStartScreen: () => void
  onStopScreen: () => void
  onStartCamera: () => void
  onStopCamera: () => void
  onStopMic: () => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function SetupRail({
  mode,
  onModeChange,
  layoutId,
  onLayoutChange,
  isCustomLayout,
  onResetLayout,
  showLayoutPicker,
  aspectPreset,
  onAspectChange,
  fitMode,
  onFitModeChange,
  letterboxStyle,
  onLetterboxStyleChange,
  studioBackground,
  onBackgroundKindChange,
  onBackgroundPrimaryColorChange,
  onBackgroundSecondaryColorChange,
  onBackgroundImageUrlChange,
  hasScreen,
  hasCamera,
  hasMic,
  isRecording,
  screenLabel,
  cameraLabel,
  onStartScreen,
  onStopScreen,
  onStartCamera,
  onStopCamera,
  onStopMic,
}: SetupRailProps) {
  const showFitControls = aspectPreset !== 'native'

  return (
    <div className="flex flex-col gap-6 pr-2">
      <Section title="Sources">
        <p className="mb-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
          Record this studio view. Import an external window only when you want it as the
          background layer.
        </p>
        <StreamControls
          hasScreen={hasScreen}
          hasCamera={hasCamera}
          hasMic={hasMic}
          isRecording={isRecording}
          screenLabel={screenLabel}
          cameraLabel={cameraLabel}
          onStartScreen={onStartScreen}
          onStopScreen={onStopScreen}
          onStartCamera={onStartCamera}
          onStopCamera={onStopCamera}
          onStopMic={onStopMic}
        />
      </Section>

      <Section title="Studio background">
        <div className="flex flex-col gap-2">
          {hasScreen ? (
            <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              External window is active. Remove it to use this background.
            </p>
          ) : null}
            <div className="grid grid-cols-3 gap-1">
              {(['gradient', 'solid', 'image'] as StudioBackgroundKind[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onBackgroundKindChange(option)}
                  className={`rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-medium capitalize transition ${
                    studioBackground.kind === option
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] ring-1 ring-[var(--color-border-strong)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <label className="text-[11px] text-[var(--color-text-muted)]">Primary color</label>
              <input
                type="color"
                value={studioBackground.primaryColor}
                onChange={(event) => onBackgroundPrimaryColorChange(event.target.value)}
                className="h-7 w-10 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0"
              />
            </div>
            {studioBackground.kind === 'gradient' ? (
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <label className="text-[11px] text-[var(--color-text-muted)]">Secondary color</label>
                <input
                  type="color"
                  value={studioBackground.secondaryColor}
                  onChange={(event) => onBackgroundSecondaryColorChange(event.target.value)}
                  className="h-7 w-10 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0"
                />
              </div>
            ) : null}
            {studioBackground.kind === 'image' ? (
              <input
                type="url"
                value={studioBackground.imageUrl}
                onChange={(event) => onBackgroundImageUrlChange(event.target.value)}
                placeholder="https://... (CORS enabled image URL)"
                className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
              />
            ) : null}
        </div>
      </Section>

      <Section title="Mode">
        <RecordingModePicker value={mode} onChange={onModeChange} />
      </Section>

      {showLayoutPicker ? (
        <Section title="Layout">
          <LayoutPicker value={layoutId} onChange={onLayoutChange} />
          {isCustomLayout ? (
            <button
              type="button"
              onClick={onResetLayout}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Reset to preset
            </button>
          ) : null}
        </Section>
      ) : null}

      <Section title="Aspect ratio">
        <AspectRatioPicker value={aspectPreset} onChange={onAspectChange} />
      </Section>

      {showFitControls ? (
        <Section title="Fit">
          <div className="flex flex-col gap-2">
            <div className="flex gap-1">
              {(['letterbox', 'crop'] as FitMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onFitModeChange(option)}
                  className={`flex-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-medium capitalize transition ${
                    fitMode === option
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] ring-1 ring-[var(--color-border-strong)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {fitMode === 'letterbox' ? (
              <div className="flex gap-1">
                {(['black', 'blur'] as LetterboxStyle[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onLetterboxStyleChange(option)}
                    className={`flex-1 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs font-medium capitalize transition ${
                      letterboxStyle === option
                        ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] ring-1 ring-[var(--color-border-strong)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {option} bars
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
        {ASPECT_PRESETS.find((p) => p.id === aspectPreset)?.label} output
        {showFitControls ? ` · ${fitMode}` : ''}
      </p>
    </div>
  )
}
