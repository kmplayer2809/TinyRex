import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '../../theme/theme'
import { LayoutShell } from './LayoutShell'

describe('LayoutShell', () => {
  it('toggles sidebar visibility from header control', () => {
    render(
      <ThemeProvider>
        <LayoutShell>
          <div>Main workspace</div>
        </LayoutShell>
      </ThemeProvider>
    )

    expect(
      screen.getByRole('complementary', { name: 'Workspace sidebar' })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hide sidebar' }))

    expect(
      screen.queryByRole('complementary', { name: 'Workspace sidebar' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show sidebar' })).toBeInTheDocument()
  })
})
