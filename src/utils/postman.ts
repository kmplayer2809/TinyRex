import type { HttpMethod, KeyValue, RequestBody, RequestModel } from '../types/workspace'
import { createId } from './id'
import type { CollectionFolderNode, CollectionItemNode, CollectionRequestNode } from '../stores/workspaceStore'
import type {
  PostmanAuthParam,
  PostmanCollectionItem,
  PostmanCollectionV21,
  PostmanRequest,
  PostmanUrl,
} from '../types/postman'

const POSTMAN_V21_SCHEMA = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
const VALID_HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

function toPostmanKeyValues(items: KeyValue[]): Array<{ key: string; value: string }> {
  return items
    .filter((item) => item.enabled && item.key)
    .map((item) => ({
      key: item.key,
      value: item.value,
    }))
}

function toPostmanBody(body: RequestBody): PostmanRequest['body'] {
  if (body.type === 'none') {
    return undefined
  }

  if (body.type === 'form-data') {
    return {
      mode: 'formdata',
      formdata: (body.formItems ?? [])
        .filter((item) => item.enabled && item.key)
        .map((item) => ({ key: item.key, value: item.value })),
    }
  }

  if (body.type === 'x-www-form-urlencoded') {
    return {
      mode: 'urlencoded',
      urlencoded: (body.formItems ?? [])
        .filter((item) => item.enabled && item.key)
        .map((item) => ({ key: item.key, value: item.value })),
    }
  }

  return {
    mode: 'raw',
    raw: body.content,
  }
}

function toPostmanAuth(request: RequestModel): PostmanRequest['auth'] {
  if (request.auth.type === 'none') {
    return { type: 'noauth' }
  }

  if (request.auth.type === 'bearer') {
    return {
      type: 'bearer',
      bearer: [{ key: 'token', value: request.auth.bearer?.token ?? '' }],
    }
  }

  if (request.auth.type === 'basic') {
    return {
      type: 'basic',
      basic: [
        { key: 'username', value: request.auth.basic?.username ?? '' },
        { key: 'password', value: request.auth.basic?.password ?? '' },
      ],
    }
  }

  return {
    type: 'apikey',
    apikey: [
      { key: 'key', value: request.auth.apiKey?.key ?? '' },
      { key: 'value', value: request.auth.apiKey?.value ?? '' },
      { key: 'in', value: request.auth.apiKey?.addTo === 'query' ? 'query' : 'header' },
    ],
  }
}

function toPostmanRequestItem(item: CollectionRequestNode): PostmanCollectionItem {
  return {
    name: item.name,
    request: {
      method: item.request.method,
      header: toPostmanKeyValues(item.request.headers),
      url: {
        raw: item.request.url,
        query: toPostmanKeyValues(item.request.params),
      },
      body: toPostmanBody(item.request.body),
      auth: toPostmanAuth(item.request),
    },
  }
}

function toPostmanItem(item: CollectionItemNode): PostmanCollectionItem {
  if (item.type === 'request') {
    return toPostmanRequestItem(item)
  }

  return {
    name: item.name,
    item: item.children.map(toPostmanItem),
  }
}

export function toPostmanCollection(collection: CollectionFolderNode): PostmanCollectionV21 {
  return {
    info: {
      name: collection.name,
      schema: POSTMAN_V21_SCHEMA,
    },
    item: collection.children.map(toPostmanItem),
  }
}

function getAuthValue(items: PostmanAuthParam[] | undefined, key: string): string {
  return items?.find((item) => item.key === key)?.value ?? ''
}

function normalizeMethod(method: string | undefined): HttpMethod {
  const upper = (method ?? '').toUpperCase()
  if (VALID_HTTP_METHODS.includes(upper as HttpMethod)) {
    return upper as HttpMethod
  }

  return 'GET'
}

function normalizeUrl(url: string | PostmanUrl | undefined): { raw: string; query: KeyValue[] } {
  if (typeof url === 'string') {
    return { raw: url, query: [] }
  }

  return {
    raw: url?.raw ?? '',
    query: (url?.query ?? [])
      .filter((entry) => entry.key)
      .map((entry) => ({
        id: createId(),
        key: entry.key ?? '',
        value: entry.value ?? '',
        enabled: !entry.disabled,
      })),
  }
}

function fromPostmanBody(body: PostmanRequest['body']): RequestBody {
  if (!body?.mode) {
    return {
      type: 'none',
      content: '',
    }
  }

  if (body.mode === 'formdata') {
    return {
      type: 'form-data',
      content: '',
      formItems: (body.formdata ?? [])
        .filter((item) => item.key)
        .map((item) => ({
          id: createId(),
          key: item.key ?? '',
          value: item.value ?? '',
          enabled: !item.disabled,
        })),
    }
  }

  if (body.mode === 'urlencoded') {
    return {
      type: 'x-www-form-urlencoded',
      content: '',
      formItems: (body.urlencoded ?? [])
        .filter((item) => item.key)
        .map((item) => ({
          id: createId(),
          key: item.key ?? '',
          value: item.value ?? '',
          enabled: !item.disabled,
        })),
    }
  }

  return {
    type: 'raw',
    content: body.raw ?? '',
  }
}

function fromPostmanAuth(auth: PostmanRequest['auth']): RequestModel['auth'] {
  if (auth?.type === 'bearer') {
    return {
      type: 'bearer',
      bearer: {
        token: getAuthValue(auth.bearer, 'token'),
      },
    }
  }

  if (auth?.type === 'basic') {
    return {
      type: 'basic',
      basic: {
        username: getAuthValue(auth.basic, 'username'),
        password: getAuthValue(auth.basic, 'password'),
      },
    }
  }

  if (auth?.type === 'apikey') {
    const inLocation = getAuthValue(auth.apikey, 'in')
    return {
      type: 'api-key',
      apiKey: {
        key: getAuthValue(auth.apikey, 'key'),
        value: getAuthValue(auth.apikey, 'value'),
        addTo: inLocation === 'query' ? 'query' : 'header',
      },
    }
  }

  return { type: 'none' }
}

function fromPostmanRequest(item: PostmanCollectionItem): CollectionRequestNode {
  const url = normalizeUrl(item.request?.url)

  return {
    id: createId(),
    name: item.name ?? 'Imported Request',
    type: 'request',
    request: {
      method: normalizeMethod(item.request?.method),
      url: url.raw,
      params: url.query,
      headers: (item.request?.header ?? [])
        .filter((header) => header.key)
        .map((header) => ({
          id: createId(),
          key: header.key ?? '',
          value: header.value ?? '',
          enabled: !header.disabled,
        })),
      body: fromPostmanBody(item.request?.body),
      auth: fromPostmanAuth(item.request?.auth),
    },
  }
}

function fromPostmanItem(item: PostmanCollectionItem): CollectionItemNode {
  if (Array.isArray(item.item)) {
    return {
      id: createId(),
      name: item.name ?? 'Imported Folder',
      type: 'folder',
      children: item.item.map(fromPostmanItem),
    }
  }

  return fromPostmanRequest(item)
}

export function fromPostmanCollection(input: PostmanCollectionV21): CollectionFolderNode {
  if (!input?.info?.schema?.includes('v2.1.0/collection.json')) {
    throw new Error('Invalid Postman v2.1 collection file')
  }

  if (!Array.isArray(input.item)) {
    throw new Error('Invalid Postman v2.1 collection file')
  }

  return {
    id: createId(),
    name: input.info.name || 'Imported Collection',
    type: 'collection',
    children: input.item.map(fromPostmanItem),
  }
}
