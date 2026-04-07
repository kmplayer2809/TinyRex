import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDefaultWorkspace } from '../test/fixtures/workspace'
import type { RequestModel, Tab, Workspace } from '../types/workspace'
import { createId } from '../utils/id'

interface WorkspaceState {
  workspace: Workspace
  addTab: () => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateActiveRequest: (patch: Partial<RequestModel>) => void
}

function createNewTab(): Tab {
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
        content: '',
      },
      auth: {
        type: 'none',
      },
    },
    isDirty: false,
  }
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspace: createDefaultWorkspace(),
      addTab: () => {
        set((state) => {
          const newTab = createNewTab()

          return {
            workspace: {
              ...state.workspace,
              tabs: [...state.workspace.tabs, newTab],
              activeTabId: newTab.id,
            },
          }
        })
      },
      closeTab: (tabId) => {
        set((state) => {
          if (state.workspace.tabs.length <= 1) {
            return state
          }

          const closingIndex = state.workspace.tabs.findIndex((tab) => tab.id === tabId)
          if (closingIndex === -1) {
            return state
          }

          const nextTabs = state.workspace.tabs.filter((tab) => tab.id !== tabId)
          const nextActiveTabId =
            state.workspace.activeTabId === tabId
              ? nextTabs[Math.max(0, closingIndex - 1)]?.id ?? nextTabs[0].id
              : state.workspace.activeTabId

          return {
            workspace: {
              ...state.workspace,
              tabs: nextTabs,
              activeTabId: nextActiveTabId,
            },
          }
        })
      },
      setActiveTab: (tabId) => {
        set((state) => {
          const tabExists = state.workspace.tabs.some((tab) => tab.id === tabId)
          if (!tabExists) {
            return state
          }

          return {
            workspace: {
              ...state.workspace,
              activeTabId: tabId,
            },
          }
        })
      },
      updateActiveRequest: (patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            tabs: state.workspace.tabs.map((tab) => {
              if (tab.id !== state.workspace.activeTabId) {
                return tab
              }

              return {
                ...tab,
                request: {
                  ...tab.request,
                  ...patch,
                },
                isDirty: true,
              }
            }),
          },
        }))
      },
    }),
    {
      name: 'tinyrex_workspace',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
