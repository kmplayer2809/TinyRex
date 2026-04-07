import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { createDefaultWorkspace } from '../../utils/workspaceDefaults'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { ThemeProvider } from '../../theme/theme'
import { ResponsePanel } from './ResponsePanel'

describe('ResponsePanel', () => {
  beforeEach(() => {
    localStorage.clear()
    const workspace = createDefaultWorkspace()

    workspace.tabs[0].response = {
      status: 201,
      statusText: 'Created',
      headers: { 'content-type': 'application/json', 'x-test': '1' },
      body: '{"ok":true}',
      time: 42,
      size: 128,
    }

    useWorkspaceStore.setState({ workspace })
  })

  it('renders status badge and metadata', () => {
    render(
      <ThemeProvider>
        <ResponsePanel />
      </ThemeProvider>,
    )

    expect(screen.getByText('201 Created')).toBeInTheDocument()
    expect(screen.getByText('Time: 42 ms')).toBeInTheDocument()
    expect(screen.getByText('Size: 128 B')).toBeInTheDocument()
  })

  it('renders Pretty, Raw, and Headers tabs', () => {
    render(
      <ThemeProvider>
        <ResponsePanel />
      </ThemeProvider>,
    )

    expect(screen.getByRole('tab', { name: 'Pretty' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Raw' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Headers' })).toBeInTheDocument()

    const prettyBody = screen.getByText(/"ok": true/)
    expect(prettyBody.textContent).toContain('\n')
    expect(prettyBody).toHaveTextContent(/\{\s+"ok": true\s+\}/)

    fireEvent.click(screen.getByRole('tab', { name: 'Headers' }))
    expect(screen.getByText('content-type: application/json')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Raw' }))
    expect(screen.getByText('{"ok":true}')).toBeInTheDocument()
  })

  it('falls back to raw body in Pretty mode when body is not parseable JSON', () => {
    const workspace = createDefaultWorkspace()
    workspace.tabs[0].response = {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain' },
      body: 'not-json-body',
      time: 15,
      size: 13,
    }
    useWorkspaceStore.setState({ workspace })

    render(
      <ThemeProvider>
        <ResponsePanel />
      </ThemeProvider>,
    )

    expect(screen.getByText('not-json-body')).toBeInTheDocument()
  })
})
