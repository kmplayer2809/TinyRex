import { type ChangeEvent, useRef, useState } from 'react'

import { CollectionTreeItem } from './CollectionTreeItem'
import { useTheme } from '../../theme/theme'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import type { PostmanCollectionV21 } from '../../types/postman'
import { fromPostmanCollection, toPostmanCollection } from '../../utils/postman'

function toFileName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'collection'
}

export function CollectionsPanel() {
  const { colors } = useTheme()
  const collections = useWorkspaceStore((state) => state.collections)
  const addCollection = useWorkspaceStore((state) => state.addCollection)
  const addCollectionFolder = useWorkspaceStore((state) => state.addCollectionFolder)
  const saveActiveRequestToCollection = useWorkspaceStore((state) => state.saveActiveRequestToCollection)
  const renameCollectionItem = useWorkspaceStore((state) => state.renameCollectionItem)
  const deleteCollectionItem = useWorkspaceStore((state) => state.deleteCollectionItem)

  const importInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const handleExportCollection = (collectionId: string) => {
    const collection = useWorkspaceStore.getState().collections.find((item) => item.id === collectionId)
    if (!collection) {
      return
    }

    const postmanCollection = toPostmanCollection(collection)
    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${toFileName(collection.name)}.postman_collection.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    try {
      const text = await selectedFile.text()
      const parsed = JSON.parse(text) as PostmanCollectionV21
      const importedCollection = fromPostmanCollection(parsed)

      useWorkspaceStore.setState((state) => ({
        ...state,
        collections: [...state.collections, importedCollection],
      }))
      setImportError(null)
    } catch {
      setImportError('Invalid Postman v2.1 collection file.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section aria-label="Collections panel" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          Collections
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs"
            style={{ borderColor: colors.border, color: colors.textPrimary }}
            onClick={() => importInputRef.current?.click()}
          >
            Import
          </button>
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
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      {importError ? (
        <p role="alert" className="text-xs" style={{ color: colors.textSecondary }}>
          {importError}
        </p>
      ) : null}

      {collections.length === 0 ? (
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          No collections yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {collections.map((collection) => (
            <li key={collection.id} className="space-y-1">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  style={{ borderColor: colors.border, color: colors.textPrimary }}
                  onClick={() => handleExportCollection(collection.id)}
                >
                  Export
                </button>
              </div>
              <CollectionTreeItem
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
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
