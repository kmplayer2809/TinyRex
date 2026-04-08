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

    const usersItem = useWorkspaceStore.getState().collections[0].children?.[0]
    expect(usersItem?.name).toBe('Users')
    expect(usersItem?.type).toBe('folder')

    if (!usersItem || usersItem.type !== 'folder') {
      throw new Error('Expected Users item to be a folder')
    }

    addCollectionFolder(usersItem.id, 'Admin')

    const usersFolder = useWorkspaceStore.getState().collections[0].children?.[0]

    if (!usersFolder || usersFolder.type !== 'folder') {
      throw new Error('Expected Users folder after adding Admin')
    }

    const adminFolder = usersFolder.children?.[0]
    expect(adminFolder?.name).toBe('Admin')
    expect(adminFolder?.type).toBe('folder')
  })

  it('saves active request into selected collection folder', () => {
    const { addCollection, addCollectionFolder, saveActiveRequestToCollection, updateActiveRequest } =
      useWorkspaceStore.getState()

    addCollection('Backend')
    const rootCollection = useWorkspaceStore.getState().collections[0]
    addCollectionFolder(rootCollection.id, 'Auth')
    const authItem = useWorkspaceStore.getState().collections[0].children?.[0]

    if (!authItem || authItem.type !== 'folder') {
      throw new Error('Expected Auth item to be a folder')
    }

    updateActiveRequest({ method: 'POST', url: 'https://api.example.com/login' })
    saveActiveRequestToCollection(authItem.id, 'Create Session')

    const authFolder = useWorkspaceStore.getState().collections[0].children?.[0]

    if (!authFolder || authFolder.type !== 'folder') {
      throw new Error('Expected Auth folder after saving request')
    }

    const savedItem = authFolder.children?.[0]
    expect(savedItem?.type).toBe('request')
    expect(savedItem?.name).toBe('Create Session')

    if (savedItem?.type === 'request') {
      expect(savedItem.request.method).toBe('POST')
      expect(savedItem.request.url).toBe('https://api.example.com/login')
    }
  })
})
