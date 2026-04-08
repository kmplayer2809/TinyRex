import type { AxiosRequestConfig } from 'axios'

import type { RequestModel } from '../types/workspace'

function encodeBasicAuth(username: string, password: string): string {
  return btoa(`${username}:${password}`)
}

export function buildAxiosConfig(request: RequestModel): AxiosRequestConfig {
  const url = new URL(request.url)

  request.params
    .filter((param) => param.enabled && param.key)
    .forEach((param) => {
      url.searchParams.append(param.key, param.value)
    })

  const headers: Record<string, string> = {}

  request.headers
    .filter((header) => header.enabled && header.key)
    .forEach((header) => {
      headers[header.key] = header.value
    })

  if (request.auth.type === 'bearer' && request.auth.bearer?.token) {
    headers.Authorization = `Bearer ${request.auth.bearer.token}`
  }

  if (request.auth.type === 'basic' && request.auth.basic) {
    headers.Authorization = `Basic ${encodeBasicAuth(request.auth.basic.username, request.auth.basic.password)}`
  }

  if (request.auth.type === 'api-key' && request.auth.apiKey?.key) {
    if (request.auth.apiKey.addTo === 'header') {
      headers[request.auth.apiKey.key] = request.auth.apiKey.value
    }

    if (request.auth.apiKey.addTo === 'query') {
      url.searchParams.append(request.auth.apiKey.key, request.auth.apiKey.value)
    }
  }

  return {
    method: request.method,
    url: url.toString(),
    headers,
    data: request.body.type === 'none' ? undefined : request.body.content,
  }
}
