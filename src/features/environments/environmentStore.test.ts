import { beforeEach, describe, expect, it } from 'vitest'

import { createDefaultWorkspace } from '../../utils/workspaceDefaults'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { EnvironmentVariable } from '../../types/workspace'

type EnvironmentActions = {
  addEnvironment: (name: string) => void
  setActiveEnvironment: (envId: string) => void
  upsertEnvironmentVariable: (envId: string, variable: EnvironmentVariable) => void
  removeEnvironment: (envId: string) => void
}

describe('workspace environment actions', () => {
  beforeEach(() => {
    localStorage.clear()
    useWorkspaceStore.setState({
      workspace: createDefaultWorkspace(),
      collections: [],
    })
  })

  it('adds environment and makes first one active', () => {
    const { addEnvironment } = useWorkspaceStore.getState() as unknown as EnvironmentActions

    addEnvironment('Local')

    const environments = useWorkspaceStore.getState().workspace.environments
    expect(environments).toHaveLength(1)
    expect(environments[0]).toMatchObject({
      name: 'Local',
      isActive: true,
      variables: [],
    })
  })

  it('sets active environment by id', () => {
    const { addEnvironment, setActiveEnvironment } = useWorkspaceStore.getState() as unknown as EnvironmentActions

    addEnvironment('Local')
    addEnvironment('Staging')

    const targetId = useWorkspaceStore.getState().workspace.environments[1].id
    setActiveEnvironment(targetId)

    const environments = useWorkspaceStore.getState().workspace.environments
    expect(environments[0].isActive).toBe(false)
    expect(environments[1].isActive).toBe(true)
  })

  it('upserts environment variable by key', () => {
    const { addEnvironment, upsertEnvironmentVariable } = useWorkspaceStore.getState() as unknown as EnvironmentActions

    addEnvironment('Local')
    const envId = useWorkspaceStore.getState().workspace.environments[0].id

    upsertEnvironmentVariable(envId, { key: 'baseUrl', value: 'https://api.local', enabled: true })
    upsertEnvironmentVariable(envId, { key: 'baseUrl', value: 'https://api.dev', enabled: true })

    const environment = useWorkspaceStore.getState().workspace.environments[0]
    expect(environment.variables).toEqual([{ key: 'baseUrl', value: 'https://api.dev', enabled: true }])
  })

  it('removes environment and activates next one when needed', () => {
    const { addEnvironment, removeEnvironment } = useWorkspaceStore.getState() as unknown as EnvironmentActions

    addEnvironment('Local')
    addEnvironment('Staging')

    const [local, staging] = useWorkspaceStore.getState().workspace.environments
    expect(local.isActive).toBe(true)
    expect(staging.isActive).toBe(false)

    removeEnvironment(local.id)

    const environments = useWorkspaceStore.getState().workspace.environments
    expect(environments).toHaveLength(1)
    expect(environments[0]).toMatchObject({ name: 'Staging', isActive: true })
  })
})
