import { describe, expect, it } from 'vitest'

import type { RequestModel } from '../types/workspace'
import { buildAxiosConfig } from './request'

function makeRequest(overrides: Partial<RequestModel> = {}): RequestModel {
  return {
    method: 'GET',
    url: 'https://api.test.com/users',
    params: [],
    headers: [],
    body: { type: 'none', content: '' },
    auth: { type: 'none' },
    ...overrides,
  }
}

describe('buildAxiosConfig', () => {
  it('adds enabled query params to url', () => {
    const cfg = buildAxiosConfig(
      makeRequest({
        params: [
          { id: '1', key: 'page', value: '2', enabled: true },
          { id: '2', key: 'ignored', value: 'x', enabled: false },
        ],
      }),
    )

    expect(cfg.url).toBe('https://api.test.com/users?page=2')
  })

  it('includes enabled headers and bearer auth header', () => {
    const cfg = buildAxiosConfig(
      makeRequest({
        headers: [{ id: '1', key: 'x-test', value: 'yes', enabled: true }],
        auth: { type: 'bearer', bearer: { token: 'abc' } },
      }),
    )

    expect(cfg.headers).toMatchObject({
      'x-test': 'yes',
      Authorization: 'Bearer abc',
    })
  })

  it('adds basic auth header', () => {
    const cfg = buildAxiosConfig(
      makeRequest({
        auth: { type: 'basic', basic: { username: 'aladdin', password: 'opensesame' } },
      }),
    )

    expect(cfg.headers).toMatchObject({
      Authorization: 'Basic YWxhZGRpbjpvcGVuc2VzYW1l',
    })
  })

  it('injects api key to header or query based on addTo', () => {
    const headerCfg = buildAxiosConfig(
      makeRequest({
        auth: {
          type: 'api-key',
          apiKey: { key: 'x-api-key', value: 'secret', addTo: 'header' },
        },
      }),
    )

    const queryCfg = buildAxiosConfig(
      makeRequest({
        auth: {
          type: 'api-key',
          apiKey: { key: 'api_key', value: 'secret', addTo: 'query' },
        },
      }),
    )

    expect(headerCfg.headers).toMatchObject({ 'x-api-key': 'secret' })
    expect(queryCfg.url).toBe('https://api.test.com/users?api_key=secret')
  })

  it('includes body data when body type is not none', () => {
    const cfg = buildAxiosConfig(
      makeRequest({
        method: 'POST',
        body: { type: 'json', content: '{"ok":true}' },
      }),
    )

    expect(cfg.data).toBe('{"ok":true}')
  })
})
