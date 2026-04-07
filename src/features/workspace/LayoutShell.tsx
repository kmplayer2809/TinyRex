import { type ReactNode, useState } from 'react'

import { useTheme } from '../../theme/theme'
import { RequestBuilder } from '../request/RequestBuilder'
import { HeaderBar } from './HeaderBar'
import { TabBar } from './TabBar'

type LayoutShellProps = {
  children: ReactNode
}

export function LayoutShell({ children }: LayoutShellProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const { colors } = useTheme()

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: colors.background, color: colors.textPrimary }}
    >
      {sidebarVisible && (
        <aside
          aria-label="Workspace sidebar"
          className="w-64 border-r p-4"
          style={{ borderColor: colors.border, backgroundColor: colors.surface }}
        >
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Workspace
          </p>
        </aside>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <HeaderBar
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => setSidebarVisible((visible) => !visible)}
        />
        <TabBar />
        <main className="flex flex-1 flex-col p-4">
          <RequestBuilder />
          {children}
        </main>
      </div>
    </div>
  )
}
