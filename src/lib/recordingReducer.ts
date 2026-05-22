export type RecordingState =
  | { status: 'idle' }
  | { status: 'recording'; startedAt: number }
  | { status: 'stopping' }
  | { status: 'ready'; blob: Blob }

export type RecordingAction =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'RECORDING_READY'; blob: Blob }
  | { type: 'RESET' }

const VALID_TRANSITIONS: Record<RecordingState['status'], RecordingAction['type'][]> = {
  idle: ['START_RECORDING'],
  recording: ['STOP_RECORDING'],
  stopping: ['RECORDING_READY', 'RESET'],
  ready: ['START_RECORDING', 'RESET'],
}

function assertTransition(state: RecordingState, action: RecordingAction): void {
  if (import.meta.env.DEV) {
    const allowed = VALID_TRANSITIONS[state.status]
    if (!allowed.includes(action.type)) {
      throw new Error(`Invalid transition: ${state.status} + ${action.type}`)
    }
  }
}

export function recordingReducer(
  state: RecordingState,
  action: RecordingAction,
): RecordingState {
  assertTransition(state, action)

  switch (action.type) {
    case 'START_RECORDING':
      if (state.status === 'idle' || state.status === 'ready') {
        return { status: 'recording', startedAt: Date.now() }
      }
      return state
    case 'STOP_RECORDING':
      if (state.status === 'recording') {
        return { status: 'stopping' }
      }
      return state
    case 'RECORDING_READY':
      if (state.status === 'stopping') {
        return { status: 'ready', blob: action.blob }
      }
      return state
    case 'RESET':
      return { status: 'idle' }
    default:
      return state
  }
}
