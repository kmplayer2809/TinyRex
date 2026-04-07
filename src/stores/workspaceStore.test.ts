import { beforeEach, describe, expect, it } from 'vitest'

import { createDefaultWorkspace } from '../test/fixtures/workspace'
import { useWorkspaceStore } from './workspaceStore'

describe('workspaceStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useWorkspaceStore.setState({
      workspace: createDefaultWorkspace(),
    })
  })

  it('creates new tab and sets it active', () => {
    const { addTab } = useWorkspaceStore.getState()

    addTab()

    const state = useWorkspaceStore.getState()
    expect(state.workspace.tabs).toHaveLength(2)
    expect(state.workspace.activeTabId).toBe(state.workspace.tabs[1].id)
  })

  it('sets active tab when tab id exists', () => {
    const { addTab, setActiveTab } = useWorkspaceStore.getState()
    addTab()

    const firstTabId = useWorkspaceStore.getState().workspace.tabs[0].id
    setActiveTab(firstTabId)

    expect(useWorkspaceStore.getState().workspace.activeTabId).toBe(firstTabId)
  })

  it('closes tab and keeps at least one tab open', () => {
    const { addTab, closeTab } = useWorkspaceStore.getState()
    addTab()

    const stateAfterAdd = useWorkspaceStore.getState()
    const firstTabId = stateAfterAdd.workspace.tabs[0].id
    const secondTabId = stateAfterAdd.workspace.tabs[1].id

    closeTab(secondTabId)

    const stateAfterClose = useWorkspaceStore.getState()
    expect(stateAfterClose.workspace.tabs).toHaveLength(1)
    expect(stateAfterClose.workspace.tabs[0].id).toBe(firstTabId)
    expect(stateAfterClose.workspace.activeTabId).toBe(firstTabId)

    closeTab(firstTabId)
    expect(useWorkspaceStore.getState().workspace.tabs).toHaveLength(1)
  })

  it('updates active request with partial patch', () => {
    const { updateActiveRequest } = useWorkspaceStore.getState()

    updateActiveRequest({ method: 'POST', url: 'https://api.example.com/users' })

    const activeTab = useWorkspaceStore.getState().workspace.tabs[0]
    expect(activeTab.request.method).toBe('POST')
    expect(activeTab.request.url).toBe('https://api.example.com/users')
    expect(activeTab.isDirty).toBe(true)
  })
})
