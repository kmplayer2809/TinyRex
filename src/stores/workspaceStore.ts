import axios from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDefaultWorkspace } from '../utils/workspaceDefaults'
import type {
  EnvironmentVariable,
  RequestModel,
  ResponseModel,
  Tab,
  Workspace,
} from '../types/workspace'
import { createId } from '../utils/id'
import { resolveTemplate } from '../utils/environment'
import { buildAxiosConfig } from '../utils/request'

export interface CollectionFolderNode {
  id: string
  name: string
  type: 'collection' | 'folder'
  children: CollectionItemNode[]
}

export interface CollectionRequestNode {
  id: string
  name: string
  type: 'request'
  request: RequestModel
}

export type CollectionItemNode = CollectionFolderNode | CollectionRequestNode

interface WorkspaceState {
  workspace: Workspace
  collections: CollectionFolderNode[]
  addTab: () => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  reorderTabs: (fromTabId: string, toTabId: string) => void
  updateActiveRequest: (patch: Partial<RequestModel>) => void
  sendCurrentRequest: () => Promise<void>
  addCollection: (name: string) => void
  addCollectionFolder: (parentId: string, name: string) => void
  saveActiveRequestToCollection: (parentId: string, name: string) => void
  renameCollectionItem: (id: string, name: string) => void
  deleteCollectionItem: (id: string) => void
  addEnvironment: (name: string) => void
  setActiveEnvironment: (envId: string) => void
  upsertEnvironmentVariable: (envId: string, variable: EnvironmentVariable) => void
  removeEnvironment: (envId: string) => void
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

function stringifyBody(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (value === undefined || value === null) {
    return ''
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function normalizeHeaders(headers: unknown): Record<string, string> {
  if (!headers || typeof headers !== 'object') {
    return {}
  }

  if ('toJSON' in headers && typeof (headers as { toJSON?: () => unknown }).toJSON === 'function') {
    const jsonHeaders = (headers as { toJSON: () => unknown }).toJSON()
    if (jsonHeaders && typeof jsonHeaders === 'object') {
      return Object.entries(jsonHeaders as Record<string, unknown>).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value)
          }
          return acc
        },
        {},
      )
    }
  }

  return Object.entries(headers as Record<string, unknown>).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value)
      }
      return acc
    },
    {},
  )
}

function calculateSize(body: string, headers: Record<string, string>): number {
  return body.length + JSON.stringify(headers).length
}

function resolveRequestTemplates(request: RequestModel, values: Record<string, string>): RequestModel {
  return {
    ...request,
    url: resolveTemplate(request.url, values),
    params: request.params.map((param) => ({
      ...param,
      key: resolveTemplate(param.key, values),
      value: resolveTemplate(param.value, values),
    })),
    headers: request.headers.map((header) => ({
      ...header,
      key: resolveTemplate(header.key, values),
      value: resolveTemplate(header.value, values),
    })),
    body: {
      ...request.body,
      content: resolveTemplate(request.body.content, values),
    },
    auth:
      request.auth.type === 'bearer'
        ? {
            ...request.auth,
            bearer: request.auth.bearer
              ? { token: resolveTemplate(request.auth.bearer.token, values) }
              : request.auth.bearer,
          }
        : request.auth.type === 'basic'
          ? {
              ...request.auth,
              basic: request.auth.basic
                ? {
                    username: resolveTemplate(request.auth.basic.username, values),
                    password: resolveTemplate(request.auth.basic.password, values),
                  }
                : request.auth.basic,
            }
          : request.auth.type === 'api-key'
            ? {
                ...request.auth,
                apiKey: request.auth.apiKey
                  ? {
                      ...request.auth.apiKey,
                      key: resolveTemplate(request.auth.apiKey.key, values),
                      value: resolveTemplate(request.auth.apiKey.value, values),
                    }
                  : request.auth.apiKey,
              }
            : request.auth,
  }
}

function getActiveEnvironmentValues(workspace: Workspace): Record<string, string> {
  const activeEnvironment = workspace.environments.find((environment) => environment.isActive)

  if (!activeEnvironment) {
    return {}
  }

  return activeEnvironment.variables.reduce<Record<string, string>>((acc, variable) => {
    if (variable.enabled && variable.key) {
      acc[variable.key] = variable.value
    }

    return acc
  }, {})
}

function addWorkspaceEnvironment(workspace: Workspace, name: string): Workspace {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return workspace
  }

  const hasActiveEnvironment = workspace.environments.some((environment) => environment.isActive)

  return {
    ...workspace,
    environments: [
      ...workspace.environments,
      {
        id: createId(),
        name: trimmedName,
        variables: [],
        isActive: !hasActiveEnvironment,
      },
    ],
  }
}

function setWorkspaceActiveEnvironment(workspace: Workspace, envId: string): Workspace {
  const hasEnvironment = workspace.environments.some((environment) => environment.id === envId)
  if (!hasEnvironment) {
    return workspace
  }

  return {
    ...workspace,
    environments: workspace.environments.map((environment) => ({
      ...environment,
      isActive: environment.id === envId,
    })),
  }
}

function upsertWorkspaceEnvironmentVariable(
  workspace: Workspace,
  envId: string,
  variable: EnvironmentVariable,
): Workspace {
  const trimmedKey = variable.key.trim()
  if (!trimmedKey) {
    return workspace
  }

  const hasEnvironment = workspace.environments.some((environment) => environment.id === envId)
  if (!hasEnvironment) {
    return workspace
  }

  return {
    ...workspace,
    environments: workspace.environments.map((environment) => {
      if (environment.id !== envId) {
        return environment
      }

      const existingIndex = environment.variables.findIndex((item) => item.key === trimmedKey)
      const nextVariable = { ...variable, key: trimmedKey }

      if (existingIndex === -1) {
        return {
          ...environment,
          variables: [...environment.variables, nextVariable],
        }
      }

      return {
        ...environment,
        variables: environment.variables.map((item, index) => (index === existingIndex ? nextVariable : item)),
      }
    }),
  }
}

function removeWorkspaceEnvironment(workspace: Workspace, envId: string): Workspace {
  const removingEnvironment = workspace.environments.find((environment) => environment.id === envId)
  if (!removingEnvironment) {
    return workspace
  }

  const remainingEnvironments = workspace.environments.filter((environment) => environment.id !== envId)

  if (remainingEnvironments.length === 0) {
    return {
      ...workspace,
      environments: [],
    }
  }

  if (!removingEnvironment.isActive) {
    return {
      ...workspace,
      environments: remainingEnvironments,
    }
  }

  return {
    ...workspace,
    environments: remainingEnvironments.map((environment, index) => ({
      ...environment,
      isActive: index === 0,
    })),
  }
}

function toResponseModel(
  input: {
    status?: number
    statusText?: string
    headers?: unknown
    body?: unknown
  },
  time: number,
): ResponseModel {
  const body = stringifyBody(input.body)
  const headers = normalizeHeaders(input.headers)

  return {
    status: input.status ?? 0,
    statusText: input.statusText ?? 'Request Error',
    headers,
    body,
    time,
    size: calculateSize(body, headers),
  }
}

function appendCollectionChild(
  items: CollectionFolderNode[],
  parentId: string,
  item: CollectionItemNode,
): CollectionFolderNode[] {
  return items.map((collection) => {
    if (collection.id === parentId) {
      return {
        ...collection,
        children: [...collection.children, item],
      }
    }

    return {
      ...collection,
      children: appendToChildren(collection.children, parentId, item),
    }
  })
}

function appendToChildren(
  children: CollectionItemNode[],
  parentId: string,
  item: CollectionItemNode,
): CollectionItemNode[] {
  return children.map((child) => {
    if (child.type === 'request') {
      return child
    }

    if (child.id === parentId) {
      return {
        ...child,
        children: [...child.children, item],
      }
    }

    return {
      ...child,
      children: appendToChildren(child.children, parentId, item),
    }
  })
}

function renameCollectionInChildren(
  children: CollectionItemNode[],
  id: string,
  name: string,
): CollectionItemNode[] {
  return children.map((child) => {
    if (child.id === id) {
      return {
        ...child,
        name,
      }
    }

    if (child.type === 'request') {
      return child
    }

    return {
      ...child,
      children: renameCollectionInChildren(child.children, id, name),
    }
  })
}

function removeCollectionInChildren(children: CollectionItemNode[], id: string): CollectionItemNode[] {
  return children
    .filter((child) => child.id !== id)
    .map((child) => {
      if (child.type === 'request') {
        return child
      }

      return {
        ...child,
        children: removeCollectionInChildren(child.children, id),
      }
    })
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspace: createDefaultWorkspace(),
      collections: [],
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
      reorderTabs: (fromTabId, toTabId) => {
        set((state) => {
          if (fromTabId === toTabId) {
            return state
          }

          const fromIndex = state.workspace.tabs.findIndex((tab) => tab.id === fromTabId)
          const toIndex = state.workspace.tabs.findIndex((tab) => tab.id === toTabId)

          if (fromIndex === -1 || toIndex === -1) {
            return state
          }

          const nextTabs = [...state.workspace.tabs]
          const [movedTab] = nextTabs.splice(fromIndex, 1)
          nextTabs.splice(toIndex, 0, movedTab)

          return {
            workspace: {
              ...state.workspace,
              tabs: nextTabs,
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
      addCollection: (name) => {
        set((state) => ({
          collections: [
            ...state.collections,
            {
              id: createId(),
              name,
              type: 'collection',
              children: [],
            },
          ],
        }))
      },
      addCollectionFolder: (parentId, name) => {
        set((state) => ({
          collections: appendCollectionChild(state.collections, parentId, {
            id: createId(),
            name,
            type: 'folder',
            children: [],
          }),
        }))
      },
      saveActiveRequestToCollection: (parentId, name) => {
        set((state) => {
          const activeTab = state.workspace.tabs.find((tab) => tab.id === state.workspace.activeTabId)
          if (!activeTab) {
            return state
          }

          return {
            collections: appendCollectionChild(state.collections, parentId, {
              id: createId(),
              name,
              type: 'request',
              request: {
                ...activeTab.request,
                params: activeTab.request.params.map((param) => ({ ...param })),
                headers: activeTab.request.headers.map((header) => ({ ...header })),
                body: {
                  ...activeTab.request.body,
                  formItems: activeTab.request.body.formItems?.map((item) => ({ ...item })),
                },
                auth: {
                  ...activeTab.request.auth,
                  bearer: activeTab.request.auth.bearer ? { ...activeTab.request.auth.bearer } : undefined,
                  basic: activeTab.request.auth.basic ? { ...activeTab.request.auth.basic } : undefined,
                  apiKey: activeTab.request.auth.apiKey ? { ...activeTab.request.auth.apiKey } : undefined,
                },
              },
            }),
          }
        })
      },
      renameCollectionItem: (id, name) => {
        set((state) => ({
          collections: state.collections.map((collection) => {
            if (collection.id === id) {
              return {
                ...collection,
                name,
              }
            }

            return {
              ...collection,
              children: renameCollectionInChildren(collection.children, id, name),
            }
          }),
        }))
      },
      deleteCollectionItem: (id) => {
        set((state) => ({
          collections: state.collections
            .filter((collection) => collection.id !== id)
            .map((collection) => ({
              ...collection,
              children: removeCollectionInChildren(collection.children, id),
            })),
        }))
      },
      addEnvironment: (name) => {
        set((state) => ({
          workspace: addWorkspaceEnvironment(state.workspace, name),
        }))
      },
      setActiveEnvironment: (envId) => {
        set((state) => ({
          workspace: setWorkspaceActiveEnvironment(state.workspace, envId),
        }))
      },
      upsertEnvironmentVariable: (envId, variable) => {
        set((state) => ({
          workspace: upsertWorkspaceEnvironmentVariable(state.workspace, envId, variable),
        }))
      },
      removeEnvironment: (envId) => {
        set((state) => ({
          workspace: removeWorkspaceEnvironment(state.workspace, envId),
        }))
      },
      sendCurrentRequest: async () => {
        const { workspace } = get()
        const initiatingTabId = workspace.activeTabId
        const initiatingTab = workspace.tabs.find((tab) => tab.id === initiatingTabId)

        if (!initiatingTab) {
          return
        }

        const requestSnapshot = initiatingTab.request
        const templateValues = getActiveEnvironmentValues(workspace)
        const resolvedRequest = resolveRequestTemplates(requestSnapshot, templateValues)
        const startedAt = performance.now()

        try {
          const config = buildAxiosConfig(resolvedRequest)
          const response = await axios(config)
          const elapsed = Math.max(0, Math.round(performance.now() - startedAt))
          const responseModel = toResponseModel(
            {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
              body: response.data,
            },
            elapsed,
          )

          set((state) => ({
            workspace: {
              ...state.workspace,
              tabs: state.workspace.tabs.map((tab) =>
                tab.id === initiatingTabId ? { ...tab, response: responseModel } : tab,
              ),
            },
          }))
        } catch (error) {
          const elapsed = Math.max(0, Math.round(performance.now() - startedAt))
          const errorResponse =
            typeof error === 'object' && error && 'response' in error
              ? (error as { response?: { status?: number; statusText?: string; headers?: unknown; data?: unknown } })
                  .response
              : undefined

          const responseModel = toResponseModel(
            {
              status: errorResponse?.status,
              statusText: errorResponse?.statusText || 'Request Error',
              headers: errorResponse?.headers,
              body:
                errorResponse?.data ||
                (error instanceof Error && error.message ? error.message : 'Request Error'),
            },
            elapsed,
          )

          set((state) => ({
            workspace: {
              ...state.workspace,
              tabs: state.workspace.tabs.map((tab) =>
                tab.id === initiatingTabId ? { ...tab, response: responseModel } : tab,
              ),
            },
          }))
        }
      },
    }),
    {
      name: 'tinyrex_workspace',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
