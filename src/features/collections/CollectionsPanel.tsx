import { CollectionTreeItem } from './CollectionTreeItem'
import { useTheme } from '../../theme/theme'
import { useWorkspaceStore } from '../../stores/workspaceStore'

export function CollectionsPanel() {
  const { colors } = useTheme()
  const collections = useWorkspaceStore((state) => state.collections)
  const addCollection = useWorkspaceStore((state) => state.addCollection)
  const addCollectionFolder = useWorkspaceStore((state) => state.addCollectionFolder)
  const saveActiveRequestToCollection = useWorkspaceStore((state) => state.saveActiveRequestToCollection)
  const renameCollectionItem = useWorkspaceStore((state) => state.renameCollectionItem)
  const deleteCollectionItem = useWorkspaceStore((state) => state.deleteCollectionItem)

  return (
    <section aria-label="Collections panel" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          Collections
        </h2>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          style={{ borderColor: colors.border, color: colors.textPrimary }}
          onClick={() => {
            const name = window.prompt('Collection name')?.trim()
            if (name) {
              addCollection(name)
            }
          }}
        >
          + Collection
        </button>
      </div>

      {collections.length === 0 ? (
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          No collections yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {collections.map((collection) => (
            <CollectionTreeItem
              key={collection.id}
              item={collection}
              onAddFolder={(parentId) => {
                const name = window.prompt('Folder name')?.trim()
                if (name) {
                  addCollectionFolder(parentId, name)
                }
              }}
              onSaveRequest={(parentId) => {
                const name = window.prompt('Saved request name')?.trim() || 'Saved Request'
                saveActiveRequestToCollection(parentId, name)
              }}
              onRename={(id) => {
                const name = window.prompt('New name')?.trim()
                if (name) {
                  renameCollectionItem(id, name)
                }
              }}
              onDelete={(id) => {
                if (window.confirm('Delete this collection item?')) {
                  deleteCollectionItem(id)
                }
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
