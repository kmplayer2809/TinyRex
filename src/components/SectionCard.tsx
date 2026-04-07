import type { ReactNode } from 'react'

import { useTheme } from '../theme/theme'

type SectionCardProps = {
  title: string
  children: ReactNode
}

export function SectionCard({ title, children }: SectionCardProps) {
  const { colors } = useTheme()

  return (
    <section
      className="rounded-lg border p-4"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.textPrimary
      }}
    >
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div>{children}</div>
    </section>
  )
}
