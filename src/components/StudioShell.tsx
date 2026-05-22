import type { ReactNode } from 'react'

type StudioShellProps = {
  statusBar: ReactNode
  setupRail: ReactNode
  preview: ReactNode
  scriptPanel: ReactNode
}

export function StudioShell({ statusBar, setupRail, preview, scriptPanel }: StudioShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-[var(--color-bg)]">
      <div className="border-b border-[var(--color-border)] px-4 py-3 sm:px-6">{statusBar}</div>
      <div className="studio-grid flex-1 p-4 sm:p-6">
        <aside className="studio-rail overflow-y-auto">{setupRail}</aside>
        <main className="studio-preview min-w-0">{preview}</main>
        <aside className="studio-script overflow-y-auto">{scriptPanel}</aside>
      </div>
    </div>
  )
}
