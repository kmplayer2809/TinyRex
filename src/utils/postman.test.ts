import { describe, expect, it } from 'vitest'

import type { CollectionFolderNode } from '../stores/workspaceStore'
import { fromPostmanCollection, toPostmanCollection } from './postman'

const sampleCollection: CollectionFolderNode = {
  id: 'col-1',
  name: 'TinyRex API',
  type: 'collection',
  children: [
    {
      id: 'folder-1',
      name: 'Users',
      type: 'folder',
      children: [
        {
          id: 'req-1',
          name: 'Get users',
          type: 'request',
          request: {
            method: 'GET',
            url: 'https://api.example.com/users',
            params: [{ id: 'p-1', key: 'page', value: '1', enabled: true }],
            headers: [{ id: 'h-1', key: 'x-test', value: 'yes', enabled: true }],
            body: { type: 'none', content: '' },
            auth: { type: 'none' },
          },
        },
      ],
    },
  ],
}

describe('postman conversion', () => {
  it('exports tinyrex collection to postman v2.1 with recursive items', () => {
    const out = toPostmanCollection(sampleCollection)

    expect(out.info.name).toBe('TinyRex API')
    expect(out.info.schema).toContain('collection.json')
    expect(out.item[0].name).toBe('Users')

    const nestedRequest = out.item[0].item?.[0]
    expect(nestedRequest?.request?.method).toBe('GET')
    expect(nestedRequest?.request?.url).toMatchObject({
      raw: 'https://api.example.com/users',
      query: [{ key: 'page', value: '1' }],
    })
  })

  it('imports postman v2.1 collection into tinyrex structure recursively', () => {
    const result = fromPostmanCollection({
      info: {
        name: 'Imported Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Auth',
          item: [
            {
              name: 'Create Session',
              request: {
                method: 'POST',
                header: [{ key: 'content-type', value: 'application/json' }],
                url: {
                  raw: 'https://api.example.com/login',
                  query: [{ key: 'tenant', value: 'acme' }],
                },
                body: {
                  mode: 'raw',
                  raw: '{"email":"user@test.dev"}',
                },
              },
            },
          ],
        },
      ],
    })

    expect(result.name).toBe('Imported Collection')
    expect(result.type).toBe('collection')

    const authFolder = result.children[0]
    expect(authFolder.type).toBe('folder')

    if (authFolder.type !== 'request') {
      const createSession = authFolder.children[0]
      expect(createSession.type).toBe('request')

      if (createSession.type === 'request') {
        expect(createSession.request.method).toBe('POST')
        expect(createSession.request.url).toBe('https://api.example.com/login')
        expect(createSession.request.params).toMatchObject([
          { key: 'tenant', value: 'acme', enabled: true },
        ])
        expect(createSession.request.headers).toMatchObject([
          { key: 'content-type', value: 'application/json', enabled: true },
        ])
      }
    }
  })

  it('throws on invalid postman input schema', () => {
    expect(() =>
      fromPostmanCollection({
        info: {
          name: 'Invalid',
          schema: 'https://example.com/schema.json',
        },
        item: [],
      }),
    ).toThrow(/Postman v2.1/i)
  })
})
