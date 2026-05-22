export type StudioBackgroundKind = 'gradient' | 'solid' | 'image'

export type StudioBackground = {
  kind: StudioBackgroundKind
  primaryColor: string
  secondaryColor: string
  imageUrl: string
}

export const DEFAULT_STUDIO_BACKGROUND: StudioBackground = {
  kind: 'gradient',
  primaryColor: '#0f172a',
  secondaryColor: '#1d4ed8',
  imageUrl: '',
}
