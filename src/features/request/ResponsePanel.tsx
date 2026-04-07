import { useMemo, useState } from 'react'

import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useTheme } from '../../theme/theme'

type ResponseView = 'pretty' | 'raw' | 'headers'

function formatPrettyBody(body: string): string {
  return body
}

export function ResponsePanel() {
  const { colors } = useTheme()
  const [view, setView] = useState<ResponseView>('pretty')
  const workspace = useWorkspaceStore((state) => state.workspace)

  const activeTab = useMemo(
    () => workspace.tabs.find((tab) => tab.id === workspace.activeTabId),
    [workspace.activeTabId, workspace.tabs],
  )

  const response = activeTab?.response

  if (!response) {
    return (
      <section className="rounded-lg border p-4" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Send a request to see the response.
        </p>
      </section>
    )
  }

  const prettyBody = formatPrettyBody(response.body)

  return (
    <section className="rounded-lg border" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3" style={{ borderColor: colors.border }}>
        <span className="rounded-full border px-2.5 py-0.5 text-sm font-medium" style={{ borderColor: colors.border }}>
          {response.status} {response.statusText}
        </span>
        <span className="text-sm" style={{ color: colors.textSecondary }}>
          Time: {response.time} ms
        </span>
        <span className="text-sm" style={{ color: colors.textSecondary }}>
          Size: {response.size} B
        </span>
      </header>

      <div className="flex items-center gap-2 border-b px-4 pt-2" role="tablist" aria-label="Response panel sections" style={{ borderColor: colors.border }}>
        <button type="button" role="tab" aria-selected={view === 'pretty'} onClick={() => setView('pretty')} className="rounded-t-md border px-3 py-1.5 text-sm">
          Pretty
        </button>
        <button type="button" role="tab" aria-selected={view === 'raw'} onClick={() => setView('raw')} className="rounded-t-md border px-3 py-1.5 text-sm">
          Raw
        </button>
        <button type="button" role="tab" aria-selected={view === 'headers'} onClick={() => setView('headers')} className="rounded-t-md border px-3 py-1.5 text-sm">
          Headers
        </button>
      </div>

      <div className="p-4 text-sm">
        {view === 'headers' ? (
          <ul className="space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <li key={key}>{`${key}: ${value}`}</li>
            ))}
          </ul>
        ) : (
          <pre className="whitespace-pre-wrap break-words">{view === 'pretty' ? prettyBody : response.body}</pre>
        )}
      </div>
    </section>
  )
}
