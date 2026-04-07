export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface KeyValue {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface RequestBody {
  type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw'
  content: string
  formItems?: KeyValue[]
}

export interface Auth {
  type: 'none' | 'bearer' | 'basic' | 'api-key'
  bearer?: { token: string }
  basic?: { username: string; password: string }
  apiKey?: { key: string; value: string; addTo: 'header' | 'query' }
}

export interface RequestModel {
  method: HttpMethod
  url: string
  params: KeyValue[]
  headers: KeyValue[]
  body: RequestBody
  auth: Auth
}

export interface ResponseModel {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number
  size: number
}

export interface Tab {
  id: string
  name: string
  request: RequestModel
  response?: ResponseModel
  isDirty: boolean
}

export interface EnvironmentVariable {
  key: string
  value: string
  enabled: boolean
}

export interface Environment {
  id: string
  name: string
  variables: EnvironmentVariable[]
  isActive: boolean
}

export interface Workspace {
  tabs: Tab[]
  activeTabId: string
  environments: Environment[]
}
