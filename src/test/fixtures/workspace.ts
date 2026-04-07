import type { Tab, Workspace } from '../../types/workspace'
import { createId } from '../../utils/id'

function createDefaultTab(): Tab {
  return {
    id: createId(),
    name: 'New Request',
    request: {
      method: 'GET',
      url: '',
      params: [],
      headers: [],
      body: {
        type: 'none',
        content: ''
      },
      auth: {
        type: 'none'
      }
    },
    isDirty: false
  }
}

export function createDefaultWorkspace(): Workspace {
  const firstTab = createDefaultTab()

  return {
    tabs: [firstTab],
    activeTabId: firstTab.id,
    environments: []
  }
}
