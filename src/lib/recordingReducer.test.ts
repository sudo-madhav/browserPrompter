import { describe, expect, it } from 'vitest'
import { recordingReducer } from './recordingReducer'

describe('recordingReducer', () => {
  it('moves idle → recording → ready', () => {
    let state = recordingReducer({ status: 'idle' }, { type: 'START_RECORDING' })
    expect(state.status).toBe('recording')

    state = recordingReducer(state, { type: 'STOP_RECORDING' })
    expect(state.status).toBe('stopping')

    const blob = new Blob(['test'], { type: 'video/webm' })
    state = recordingReducer(state, { type: 'RECORDING_READY', blob })
    expect(state.status).toBe('ready')
    if (state.status === 'ready') {
      expect(state.blob).toBe(blob)
    }
  })

  it('resets to idle', () => {
    const state = recordingReducer({ status: 'ready', blob: new Blob() }, { type: 'RESET' })
    expect(state.status).toBe('idle')
  })
})
