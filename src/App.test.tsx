import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'
import { ThemeProvider } from './theme/theme'

describe('App', () => {
  it('renders TinyRex text', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )

    expect(screen.getByText('TinyRex')).toBeInTheDocument()
  })
})
