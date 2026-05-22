import { TeleprompterEditor } from './TeleprompterEditor'

type ScriptPanelProps = {
  script: string
  opacity: number
  speed: number
  fontSize: number
  onScriptChange: (value: string) => void
  onOpacityChange: (value: number) => void
  onSpeedChange: (value: number) => void
  onFontSizeChange: (value: number) => void
}

export function ScriptPanel(props: ScriptPanelProps) {
  return (
    <div className="pl-2">
      <TeleprompterEditor {...props} />
    </div>
  )
}
