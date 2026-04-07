import { useState } from 'react'

import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useTheme } from '../../theme/theme'

export function TabBar() {
  const { colors } = useTheme()
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const tabs = useWorkspaceStore((state) => state.workspace.tabs)
  const activeTabId = useWorkspaceStore((state) => state.workspace.activeTabId)
  const addTab = useWorkspaceStore((state) => state.addTab)
  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab)
  const closeTab = useWorkspaceStore((state) => state.closeTab)
  const reorderTabs = useWorkspaceStore((state) => state.reorderTabs)

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
            <div
              key={tab.id}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
              style={{
                borderColor: isActive ? colors.accent : colors.border,
                color: colors.textPrimary,
                backgroundColor: isActive ? colors.background : colors.surface,
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                draggable
                onClick={() => setActiveTab(tab.id)}
                onDragStart={(event) => {
                  setDraggedTabId(tab.id)
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', tab.id)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  const sourceTabId = draggedTabId ?? event.dataTransfer.getData('text/plain')
                  if (sourceTabId) {
                    reorderTabs(sourceTabId, tab.id)
                    setActiveTab(sourceTabId)
                  }
                  setDraggedTabId(null)
                }}
                onDragEnd={() => {
                  setDraggedTabId(null)
                }}
              >
                <span>{label || `Request ${index + 1}`}</span>
              </button>
              <button
                type="button"
                aria-label={`Close tab ${tab.name || index + 1}`}
                className="text-xs"
                onClick={() => closeTab(tab.id)}
              >
                ×
              </button>
            </div>
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
