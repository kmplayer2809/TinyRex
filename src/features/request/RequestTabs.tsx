type RequestSection = 'params' | 'auth' | 'headers' | 'body'

type RequestTabsProps = {
  value: RequestSection
  onChange: (value: RequestSection) => void
}

const TABS: Array<{ key: RequestSection; label: string }> = [
  { key: 'params', label: 'Params' },
  { key: 'auth', label: 'Auth' },
  { key: 'headers', label: 'Headers' },
  { key: 'body', label: 'Body' },
]

export function RequestTabs({ value, onChange }: RequestTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b px-4 pt-2" role="tablist" aria-label="Request builder sections">
      {TABS.map((tab) => {
        const active = value === tab.key

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={[
              'rounded-t-md border px-3 py-1.5 text-sm',
              active ? 'font-semibold' : '',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
