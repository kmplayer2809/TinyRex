import { describe, expect, it } from 'vitest'

import { createDefaultWorkspace } from './workspaceDefaults'

describe('workspaceDefaults', () => {
  it('creates one default tab and activeTabId', () => {
    const ws = createDefaultWorkspace()

    expect(ws.tabs).toHaveLength(1)
    expect(ws.activeTabId).toBe(ws.tabs[0].id)
  })
})
