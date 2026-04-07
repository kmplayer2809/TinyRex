import { useTheme } from '../theme/theme'

export function ThemeToggle() {
  const { theme, toggleTheme, colors } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="rounded-md border px-3 py-2 text-sm font-medium"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.textPrimary
      }}
    >
      {theme === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  )
}
