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

  it('mounts response panel in the live layout flow', () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    )

    expect(screen.getByText('Send a request to see the response.')).toBeInTheDocument()
  })
})
