import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useTheme } from '../../theme/theme'

export function TabBar() {
  const { colors } = useTheme()
  const tabs = useWorkspaceStore((state) => state.workspace.tabs)
  const activeTabId = useWorkspaceStore((state) => state.workspace.activeTabId)
  const addTab = useWorkspaceStore((state) => state.addTab)
  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab)
  const closeTab = useWorkspaceStore((state) => state.closeTab)

  return (
    <div
      className="flex items-center gap-2 border-b px-3 py-2"
      style={{ borderColor: colors.border, backgroundColor: colors.surface }}
    >
      <div className="flex flex-1 items-center gap-2 overflow-x-auto" role="tablist" aria-label="Request tabs">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId
          const label = tab.isDirty ? `${tab.name} *` : tab.name

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
              style={{
                borderColor: isActive ? colors.accent : colors.border,
                color: colors.textPrimary,
                backgroundColor: isActive ? colors.background : colors.surface,
              }}
            >
              <span>{label || `Request ${index + 1}`}</span>
              <span
                role="button"
                aria-label={`Close tab ${tab.name || index + 1}`}
                tabIndex={0}
                className="text-xs"
                onClick={(event) => {
                  event.stopPropagation()
                  closeTab(tab.id)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    event.stopPropagation()
                    closeTab(tab.id)
                  }
                }}
              >
                ×
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        aria-label="New tab"
        onClick={addTab}
        className="rounded-md border px-3 py-1.5 text-sm font-medium"
        style={{ borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }}
      >
        +
      </button>
    </div>
  )
}
