import axios from 'axios'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createDefaultWorkspace } from '../utils/workspaceDefaults'
import type { RequestModel, ResponseModel, Tab, Workspace } from '../types/workspace'
import { createId } from '../utils/id'
import { resolveTemplate } from '../utils/environment'
import { buildAxiosConfig } from '../utils/request'

interface WorkspaceState {
  workspace: Workspace
  addTab: () => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  reorderTabs: (fromTabId: string, toTabId: string) => void
  updateActiveRequest: (patch: Partial<RequestModel>) => void
  sendCurrentRequest: () => Promise<void>
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

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
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
      sendCurrentRequest: async () => {
        const { workspace } = get()
        const activeTab = workspace.tabs.find((tab) => tab.id === workspace.activeTabId)

        if (!activeTab) {
          return
        }

        const templateValues = getActiveEnvironmentValues(workspace)
        const resolvedRequest = resolveRequestTemplates(activeTab.request, templateValues)
        const config = buildAxiosConfig(resolvedRequest)
        const startedAt = performance.now()

        try {
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
                tab.id === state.workspace.activeTabId ? { ...tab, response: responseModel } : tab,
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
              statusText:
                errorResponse?.statusText ||
                (error instanceof Error && error.message ? error.message : 'Request Error'),
              headers: errorResponse?.headers,
              body: errorResponse?.data,
            },
            elapsed,
          )

          set((state) => ({
            workspace: {
              ...state.workspace,
              tabs: state.workspace.tabs.map((tab) =>
                tab.id === state.workspace.activeTabId ? { ...tab, response: responseModel } : tab,
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
