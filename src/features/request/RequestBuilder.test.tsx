import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

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

  it('renders separate close buttons and no nested interactive controls in tabs', () => {
    render(
      <ThemeProvider>
        <TabBar />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'New tab' }))

    const tabList = screen.getByRole('tablist', { name: 'Request tabs' })
    const tabs = within(tabList).getAllByRole('tab')
    const closeButtons = within(tabList).getAllByRole('button', { name: /Close tab/i })

    expect(closeButtons).toHaveLength(tabs.length)

    tabs.forEach((tab) => {
      expect(within(tab).queryByRole('button')).toBeNull()
    })
  })

  it('reorders tabs when dragging a tab onto another tab', () => {
    render(
      <ThemeProvider>
        <TabBar />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'New tab' }))
    fireEvent.click(screen.getByRole('button', { name: 'New tab' }))

    const initialOrder = useWorkspaceStore.getState().workspace.tabs.map((tab) => tab.id)
    const dragData = {
      setData: () => {},
      getData: () => '',
      effectAllowed: 'move',
      dropEffect: 'move',
    }

    const tabs = screen.getAllByRole('tab')
    fireEvent.dragStart(tabs[2], { dataTransfer: dragData })
    fireEvent.drop(tabs[0], { dataTransfer: dragData })
    fireEvent.dragEnd(tabs[2], { dataTransfer: dragData })

    const state = useWorkspaceStore.getState().workspace
    expect(state.tabs.map((tab) => tab.id)).toEqual([initialOrder[2], initialOrder[0], initialOrder[1]])
    expect(state.activeTabId).toBe(initialOrder[2])
  })
})
