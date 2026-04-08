export interface PostmanCollectionInfo {
  name: string
  schema: string
}

export interface PostmanUrl {
  raw?: string
  query?: Array<{
    key?: string
    value?: string
    disabled?: boolean
  }>
}

export interface PostmanHeader {
  key?: string
  value?: string
  disabled?: boolean
}

export interface PostmanBody {
  mode?: 'raw' | 'formdata' | 'urlencoded'
  raw?: string
  formdata?: Array<{
    key?: string
    value?: string
    disabled?: boolean
  }>
  urlencoded?: Array<{
    key?: string
    value?: string
    disabled?: boolean
  }>
}

export interface PostmanAuthParam {
  key?: string
  value?: string
}

export interface PostmanRequest {
  method?: string
  header?: PostmanHeader[]
  url?: string | PostmanUrl
  body?: PostmanBody
  auth?: {
    type?: 'bearer' | 'basic' | 'apikey' | 'noauth'
    bearer?: PostmanAuthParam[]
    basic?: PostmanAuthParam[]
    apikey?: PostmanAuthParam[]
  }
}

export interface PostmanCollectionItem {
  name?: string
  item?: PostmanCollectionItem[]
  request?: PostmanRequest
}

export interface PostmanCollectionV21 {
  info?: PostmanCollectionInfo
  item?: PostmanCollectionItem[]
}
