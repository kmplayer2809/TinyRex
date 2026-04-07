import { useMemo, useState } from 'react'

import { KeyValueEditor } from '../../components/KeyValueEditor'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { Auth, HttpMethod, RequestBody } from '../../types/workspace'
import { useTheme } from '../../theme/theme'
import { RequestTabs } from './RequestTabs'

type RequestSection = 'params' | 'auth' | 'headers' | 'body'

const METHOD_OPTIONS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

function createEmptyAuth(type: Auth['type']): Auth {
  if (type === 'bearer') {
    return { type, bearer: { token: '' } }
  }

  if (type === 'basic') {
    return { type, basic: { username: '', password: '' } }
  }

  if (type === 'api-key') {
    return { type, apiKey: { key: '', value: '', addTo: 'header' } }
  }

  return { type: 'none' }
}

function createBodyFromType(type: RequestBody['type'], currentContent: string): RequestBody {
  return {
    type,
    content: type === 'none' ? '' : currentContent,
  }
}

export function RequestBuilder() {
  const { colors } = useTheme()
  const [section, setSection] = useState<RequestSection>('params')
  const workspace = useWorkspaceStore((state) => state.workspace)
  const updateActiveRequest = useWorkspaceStore((state) => state.updateActiveRequest)
  const sendCurrentRequest = useWorkspaceStore((state) => state.sendCurrentRequest)

  const activeTab = useMemo(
    () => workspace.tabs.find((tab) => tab.id === workspace.activeTabId),
    [workspace.activeTabId, workspace.tabs]
  )

  if (!activeTab) {
    return null
  }

  const request = activeTab.request

  return (
    <section className="flex flex-1 flex-col" style={{ backgroundColor: colors.background }}>
      <div className="flex items-center gap-2 border-b p-4" style={{ borderColor: colors.border }}>
        <label htmlFor="method-select" className="sr-only">
          HTTP method
        </label>
        <select
          id="method-select"
          aria-label="HTTP method"
          value={request.method}
          onChange={(event) => updateActiveRequest({ method: event.target.value as HttpMethod })}
          className="rounded-md border px-2 py-2 text-sm"
          style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
        >
          {METHOD_OPTIONS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        <label htmlFor="request-url" className="sr-only">
          Request URL
        </label>
        <input
          id="request-url"
          aria-label="Request URL"
          placeholder="https://api.example.com"
          value={request.url}
          onChange={(event) => updateActiveRequest({ url: event.target.value })}
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
        />

        <button
          type="button"
          onClick={() => {
            void sendCurrentRequest()
          }}
          className="rounded-md border px-3 py-2 text-sm font-medium"
          style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
        >
          Send
        </button>
      </div>

      <RequestTabs value={section} onChange={setSection} />

      <div className="p-4">
        {section === 'params' && <KeyValueEditor items={request.params} emptyText="No query params yet." />}

        {section === 'headers' && <KeyValueEditor items={request.headers} emptyText="No headers yet." />}

        {section === 'auth' && (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block">Auth type</span>
              <select
                aria-label="Auth type"
                value={request.auth.type}
                onChange={(event) => {
                  const nextType = event.target.value as Auth['type']
                  updateActiveRequest({ auth: createEmptyAuth(nextType) })
                }}
                className="rounded-md border px-2 py-2"
                style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="api-key">API Key</option>
              </select>
            </label>

            {request.auth.type === 'bearer' && (
              <label className="block text-sm">
                <span className="mb-1 block">Token</span>
                <input
                  aria-label="Bearer token"
                  value={request.auth.bearer?.token ?? ''}
                  onChange={(event) =>
                    updateActiveRequest({
                      auth: { type: 'bearer', bearer: { token: event.target.value } },
                    })
                  }
                  className="w-full rounded-md border px-2 py-2"
                  style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
                />
              </label>
            )}
          </div>
        )}

        {section === 'body' && (
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block">Body type</span>
              <select
                aria-label="Body type"
                value={request.body.type}
                onChange={(event) => {
                  const nextType = event.target.value as RequestBody['type']
                  updateActiveRequest({ body: createBodyFromType(nextType, request.body.content) })
                }}
                className="rounded-md border px-2 py-2"
                style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
              >
                <option value="none">None</option>
                <option value="json">JSON</option>
                <option value="raw">Raw</option>
                <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                <option value="form-data">form-data</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block">Body content</span>
              <textarea
                aria-label="Body content"
                value={request.body.content}
                onChange={(event) =>
                  updateActiveRequest({ body: { ...request.body, content: event.target.value } })
                }
                className="min-h-40 w-full rounded-md border p-2"
                style={{ borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary }}
              />
            </label>
          </div>
        )}
      </div>
    </section>
  )
}
