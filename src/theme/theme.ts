import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { palette } from './palette'

export type ThemeName = keyof typeof palette

type ThemeContextValue = {
  theme: ThemeName
  colors: (typeof palette)[ThemeName]
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      colors: palette[theme],
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light'))
    }),
    [theme]
  )

  return createElement(ThemeContext.Provider, { value }, children)
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
