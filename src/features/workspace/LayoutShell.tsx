import { type ReactNode, useState } from 'react'

import { useTheme } from '../../theme/theme'
import { CollectionsPanel } from '../collections/CollectionsPanel'
import { RequestBuilder } from '../request/RequestBuilder'
import { ResponsePanel } from '../request/ResponsePanel'
import { EnvironmentPanel } from '../environments/EnvironmentPanel'
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
          <CollectionsPanel />
          <EnvironmentPanel />
        </aside>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <HeaderBar
          sidebarVisible={sidebarVisible}
          onToggleSidebar={() => setSidebarVisible((visible) => !visible)}
        />
        <TabBar />
        <main className="flex flex-1 flex-col gap-4 p-4">
          <RequestBuilder />
          <ResponsePanel />
          {children}
        </main>
      </div>
    </div>
  )
}
