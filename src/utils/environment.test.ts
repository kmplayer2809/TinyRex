import { describe, expect, it } from 'vitest'

import { resolveTemplate } from './environment'

describe('resolveTemplate', () => {
  it('replaces known variables with provided values', () => {
    const result = resolveTemplate('Hello {{NAME}} from {{CITY}}', {
      NAME: 'Alice',
      CITY: 'Hanoi',
    })

    expect(result).toBe('Hello Alice from Hanoi')
  })

  it('replaces lowercase variables with provided values', () => {
    const result = resolveTemplate('API: {{host}}', {
      host: 'localhost',
    })

    expect(result).toBe('API: localhost')
  })

  it('keeps unknown variables unchanged', () => {
    const result = resolveTemplate('Token: {{known}} / {{unknown}}', {
      known: 'abc123',
    })

    expect(result).toBe('Token: abc123 / {{unknown}}')
  })
})
