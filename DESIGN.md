# DESIGN.md — LocalFirst Studio

Visual direction: **Loom-inspired warm dark studio**. Task-focused app UI — not a marketing page.

## Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#0a0a0b` | Page background |
| `--color-surface` | `#141416` | Panels, inputs |
| `--color-surface-raised` | `#1c1c1f` | Selected states |
| `--color-border` | `#27272a` | 1px structural borders |
| `--color-text` | `#fafafa` | Primary text |
| `--color-text-muted` | `#a1a1aa` | Labels, hints |
| `--color-accent-record` | `#ff453a` | Record button only |
| `--radius-sm` | `6px` | Buttons, inputs |
| `--radius-frame` | `8px` | Preview container |

## Typography

- **Display/body:** Geist Sans (16px min body)
- **Mono:** Geist Mono — timers, resolution readouts

## Components

| Component | Role |
|-----------|------|
| `StudioShell` | Three-panel grid layout |
| `SetupRail` | Sources, mode, layout, aspect, fit toggles |
| `PreviewStage` | Canvas preview + teleprompter overlay + transport |
| `DraggablePiP` | Drag/resize webcam over preview |
| `TransportBar` | Record/stop/timer docked to preview |
| `ScriptPanel` | Teleprompter editor |

## Anti-slop rules

- **No violet/purple accents** — selected states use zinc/white rings
- **No icon-in-circle feature grids**
- **No decorative gradients** — record red is the only strong color
- **Cards earn existence** — panels use 1px borders, not stacked card shadows
- **Layout picker shows thumbnails**, not text-only pills

## Aspect ratios

Presets: 16:9, 9:16, 1:1, 4:3, Native. Fit modes: letterbox or crop (user toggle). Letterbox bars: black or blur (user toggle).
