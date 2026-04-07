import type { KeyValue } from '../types/workspace'

type KeyValueEditorProps = {
  items: KeyValue[]
  emptyText?: string
}

export function KeyValueEditor({ items, emptyText = 'No items yet.' }: KeyValueEditorProps) {
  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-[auto,1fr,1fr] gap-2 text-sm">
              <input type="checkbox" checked={item.enabled} readOnly aria-label={`Enable ${item.key || 'entry'}`} />
              <input value={item.key} readOnly aria-label="Key" className="rounded border px-2 py-1" />
              <input value={item.value} readOnly aria-label="Value" className="rounded border px-2 py-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
