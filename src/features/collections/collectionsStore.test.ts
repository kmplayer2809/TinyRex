import { beforeEach, describe, expect, it } from 'vitest'

import { useWorkspaceStore } from '../../stores/workspaceStore'
import { createDefaultWorkspace } from '../../utils/workspaceDefaults'

describe('collections store actions', () => {
  beforeEach(() => {
    localStorage.clear()
    useWorkspaceStore.setState({ workspace: createDefaultWorkspace(), collections: [] })
  })

  it('creates nested folders under a collection', () => {
    const { addCollection, addCollectionFolder } = useWorkspaceStore.getState()

    addCollection('API')

    const rootCollection = useWorkspaceStore.getState().collections[0]
    addCollectionFolder(rootCollection.id, 'Users')

    const usersFolder = useWorkspaceStore.getState().collections[0].children?.[0]
    expect(usersFolder?.name).toBe('Users')
    expect(usersFolder?.type).toBe('folder')

    addCollectionFolder(usersFolder!.id, 'Admin')

    const adminFolder =
      useWorkspaceStore.getState().collections[0].children?.[0].children?.[0]
    expect(adminFolder?.name).toBe('Admin')
    expect(adminFolder?.type).toBe('folder')
  })

  it('saves active request into selected collection folder', () => {
    const { addCollection, addCollectionFolder, saveActiveRequestToCollection, updateActiveRequest } =
      useWorkspaceStore.getState()

    addCollection('Backend')
    const rootCollection = useWorkspaceStore.getState().collections[0]
    addCollectionFolder(rootCollection.id, 'Auth')
    const authFolder = useWorkspaceStore.getState().collections[0].children?.[0]

    updateActiveRequest({ method: 'POST', url: 'https://api.example.com/login' })
    saveActiveRequestToCollection(authFolder!.id, 'Create Session')

    const savedItem = useWorkspaceStore.getState().collections[0].children?.[0].children?.[0]
    expect(savedItem?.type).toBe('request')
    expect(savedItem?.name).toBe('Create Session')

    if (savedItem?.type === 'request') {
      expect(savedItem.request.method).toBe('POST')
      expect(savedItem.request.url).toBe('https://api.example.com/login')
    }
  })
})
