import { ThemeToggle } from '../../components/ThemeToggle'
import { useTheme } from '../../theme/theme'
import { EnvironmentSelector } from '../environments/EnvironmentSelector'

type HeaderBarProps = {
  sidebarVisible: boolean
  onToggleSidebar: () => void
}

export function HeaderBar({ sidebarVisible, onToggleSidebar }: HeaderBarProps) {
  const { colors } = useTheme()

  return (
    <header
      className="flex items-center justify-between border-b px-4 py-3"
      style={{ borderColor: colors.border, backgroundColor: colors.surface }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          className="rounded-md border px-3 py-2 text-sm font-medium"
          style={{
            borderColor: colors.border,
            color: colors.textPrimary,
            backgroundColor: colors.surface
          }}
        >
          {sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        </button>
        <h1 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
          TinyRex
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <EnvironmentSelector />
        <ThemeToggle />
      </div>
    </header>
  )
}
