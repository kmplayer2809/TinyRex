import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { ThemeProvider } from '../../theme/theme'
import { createDefaultWorkspace } from '../../utils/workspaceDefaults'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { RequestBuilder } from './RequestBuilder'
import { TabBar } from '../workspace/TabBar'

describe('RequestBuilder', () => {
  beforeEach(() => {
    localStorage.clear()
    useWorkspaceStore.setState({ workspace: createDefaultWorkspace() })
  })

  it('updates active request method and url from form controls', () => {
    render(
      <ThemeProvider>
        <RequestBuilder />
      </ThemeProvider>
    )

    fireEvent.change(screen.getByLabelText('HTTP method'), { target: { value: 'POST' } })
    fireEvent.change(screen.getByLabelText('Request URL'), {
      target: { value: 'https://api.example.com/users' },
    })

    const activeTab = useWorkspaceStore
      .getState()
      .workspace.tabs.find((tab) => tab.id === useWorkspaceStore.getState().workspace.activeTabId)

    expect(activeTab?.request.method).toBe('POST')
    expect(activeTab?.request.url).toBe('https://api.example.com/users')
  })
})

describe('TabBar', () => {
  beforeEach(() => {
    localStorage.clear()
    useWorkspaceStore.setState({ workspace: createDefaultWorkspace() })
  })

  it('creates a new tab from the tab bar action', () => {
    render(
      <ThemeProvider>
        <TabBar />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'New tab' }))

    const state = useWorkspaceStore.getState().workspace
    expect(state.tabs).toHaveLength(2)
    expect(state.activeTabId).toBe(state.tabs[1].id)
  })
})
