import type { CollectionItemNode } from '../../stores/workspaceStore'
import { useTheme } from '../../theme/theme'

type CollectionTreeItemProps = {
  item: CollectionItemNode
  depth?: number
  onAddFolder: (parentId: string) => void
  onSaveRequest: (parentId: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

export function CollectionTreeItem({
  item,
  depth = 0,
  onAddFolder,
  onSaveRequest,
  onRename,
  onDelete,
}: CollectionTreeItemProps) {
  const { colors } = useTheme()

  return (
    <li>
      <div
        className="flex items-center justify-between gap-2 rounded-md px-2 py-1"
        style={{
          marginLeft: depth * 12,
          backgroundColor: colors.background,
          color: colors.textPrimary,
        }}
      >
        <span className="truncate text-sm">
          {item.type === 'request' ? 'Req' : 'Dir'} {item.name}
        </span>

        <div className="flex items-center gap-1">
          {item.type !== 'request' && (
            <>
              <button
                type="button"
                aria-label={`Add folder under ${item.name}`}
                className="rounded border px-1.5 py-0.5 text-xs"
                style={{ borderColor: colors.border }}
                onClick={() => onAddFolder(item.id)}
              >
                +Folder
              </button>
              <button
                type="button"
                aria-label={`Save request under ${item.name}`}
                className="rounded border px-1.5 py-0.5 text-xs"
                style={{ borderColor: colors.border }}
                onClick={() => onSaveRequest(item.id)}
              >
                +Req
              </button>
            </>
          )}
          <button
            type="button"
            aria-label={`Rename ${item.name}`}
            className="rounded border px-1.5 py-0.5 text-xs"
            style={{ borderColor: colors.border }}
            onClick={() => onRename(item.id)}
          >
            Rename
          </button>
          <button
            type="button"
            aria-label={`Delete ${item.name}`}
            className="rounded border px-1.5 py-0.5 text-xs"
            style={{ borderColor: colors.border }}
            onClick={() => onDelete(item.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {item.type !== 'request' && item.children.length > 0 && (
        <ul className="mt-1 space-y-1">
          {item.children.map((child) => (
            <CollectionTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onAddFolder={onAddFolder}
              onSaveRequest={onSaveRequest}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
