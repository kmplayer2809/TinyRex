import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { createDefaultWorkspace } from '../../utils/workspaceDefaults'
import { useWorkspaceStore } from '../../stores/workspaceStore'

vi.mock('axios', () => ({
  default: vi.fn(),
}))

const mockedAxios = vi.mocked(axios)

describe('sendCurrentRequest', () => {
  beforeEach(() => {
    localStorage.clear()
    useWorkspaceStore.setState({ workspace: createDefaultWorkspace() })
    mockedAxios.mockReset()
  })

  it('stores successful response metadata on active tab', async () => {
    useWorkspaceStore.setState((state) => ({
      workspace: {
        ...state.workspace,
        environments: [
          {
            id: 'env-1',
            name: 'Local',
            isActive: true,
            variables: [
              { key: 'baseUrl', value: 'https://api.test.com', enabled: true },
              { key: 'token', value: 'abc123', enabled: true },
            ],
          },
        ],
        tabs: state.workspace.tabs.map((tab) => ({
          ...tab,
          request: {
            ...tab.request,
            method: 'GET',
            url: '{{baseUrl}}/users',
            headers: [{ id: 'h1', key: 'Authorization', value: 'Bearer {{token}}', enabled: true }],
          },
        })),
      },
    }))

    mockedAxios.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { 'x-test': '1' },
      data: { ok: true },
    })

    await useWorkspaceStore.getState().sendCurrentRequest()

    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://api.test.com/users',
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' }),
      }),
    )

    const activeTab = useWorkspaceStore
      .getState()
      .workspace.tabs.find((tab) => tab.id === useWorkspaceStore.getState().workspace.activeTabId)

    expect(activeTab?.response).toMatchObject({
      status: 200,
      statusText: 'OK',
      headers: { 'x-test': '1' },
      body: '{"ok":true}',
    })
    expect(activeTab?.response?.time).toBeTypeOf('number')
    expect(activeTab?.response?.size).toBeGreaterThan(0)
  })

  it('stores failed response metadata on active tab', async () => {
    useWorkspaceStore.setState((state) => ({
      workspace: {
        ...state.workspace,
        tabs: state.workspace.tabs.map((tab) => ({
          ...tab,
          request: {
            ...tab.request,
            method: 'GET',
            url: 'https://api.test.com/missing',
          },
        })),
      },
    }))

    mockedAxios.mockRejectedValue({
      response: {
        status: 404,
        statusText: 'Not Found',
        headers: { 'content-type': 'application/json' },
        data: { error: 'missing' },
      },
      message: 'Request failed',
    })

    await useWorkspaceStore.getState().sendCurrentRequest()

    const activeTab = useWorkspaceStore
      .getState()
      .workspace.tabs.find((tab) => tab.id === useWorkspaceStore.getState().workspace.activeTabId)

    expect(activeTab?.response).toMatchObject({
      status: 404,
      statusText: 'Not Found',
      headers: { 'content-type': 'application/json' },
      body: '{"error":"missing"}',
    })
    expect(activeTab?.response?.time).toBeTypeOf('number')
    expect(activeTab?.response?.size).toBeGreaterThan(0)
  })
})
