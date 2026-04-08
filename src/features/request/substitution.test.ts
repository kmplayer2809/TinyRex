import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'

import { createDefaultWorkspace } from '../../utils/workspaceDefaults'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { EnvironmentVariable } from '../../types/workspace'

vi.mock('axios', () => ({
  default: vi.fn(),
}))

const mockedAxios = vi.mocked(axios)

type EnvironmentActions = {
  addEnvironment: (name: string) => void
  setActiveEnvironment: (envId: string) => void
  upsertEnvironmentVariable: (envId: string, variable: EnvironmentVariable) => void
}

describe('request substitution before send', () => {
  beforeEach(() => {
    localStorage.clear()
    useWorkspaceStore.setState({ workspace: createDefaultWorkspace(), collections: [] })
    mockedAxios.mockReset()
  })

  it('replaces {{baseUrl}} before send from active environment', async () => {
    const { addEnvironment, setActiveEnvironment, upsertEnvironmentVariable } =
      useWorkspaceStore.getState() as unknown as EnvironmentActions

    addEnvironment('Local')
    addEnvironment('Staging')

    const [local, staging] = useWorkspaceStore.getState().workspace.environments
    upsertEnvironmentVariable(local.id, { key: 'baseUrl', value: 'https://local.test', enabled: true })
    upsertEnvironmentVariable(staging.id, { key: 'baseUrl', value: 'https://api.test.com', enabled: true })
    setActiveEnvironment(staging.id)

    useWorkspaceStore.setState((state) => ({
      workspace: {
        ...state.workspace,
        tabs: state.workspace.tabs.map((tab) => ({
          ...tab,
          request: {
            ...tab.request,
            method: 'GET',
            url: '{{baseUrl}}/users',
          },
        })),
      },
    }))

    mockedAxios.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { ok: true },
    })

    await useWorkspaceStore.getState().sendCurrentRequest()

    expect(mockedAxios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://api.test.com/users',
      }),
    )
  })
})
