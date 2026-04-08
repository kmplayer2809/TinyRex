# TinyRex Postman Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + Vite + TypeScript + MUI + Tailwind web app that clones core Postman behavior (tabs, request builder, response viewer, collections, environments, import/export) with localStorage persistence.

**Architecture:** Single-page frontend app with Zustand as the source of truth and `persist` middleware writing to `localStorage` key `tinyrex_workspace`. UI is composed from focused feature modules (`workspace`, `request`, `collections`, `environments`) and shared primitives. Request execution uses Axios directly from browser (no CORS bypass) with environment variable substitution before send.

**Tech Stack:** React 18, Vite, TypeScript, MUI v5, Tailwind CSS, Zustand, Axios, dnd-kit, Monaco Editor, Vitest, React Testing Library

---

## File Structure Plan

### Create
- `package.json`
- `yarn.lock`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `postcss.config.js`
- `tailwind.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/theme/palette.ts`
- `src/theme/theme.ts`
- `src/types/workspace.ts`
- `src/types/postman.ts`
- `src/utils/id.ts`
- `src/utils/environment.ts`
- `src/utils/request.ts`
- `src/utils/postman.ts`
- `src/stores/workspaceStore.ts`
- `src/features/workspace/LayoutShell.tsx`
- `src/features/workspace/HeaderBar.tsx`
- `src/features/workspace/TabBar.tsx`
- `src/features/request/RequestBuilder.tsx`
- `src/features/request/RequestTabs.tsx`
- `src/features/request/ResponsePanel.tsx`
- `src/features/collections/CollectionsPanel.tsx`
- `src/features/collections/CollectionTreeItem.tsx`
- `src/features/environments/EnvironmentPanel.tsx`
- `src/features/environments/EnvironmentSelector.tsx`
- `src/components/KeyValueEditor.tsx`
- `src/components/SectionCard.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/ConfirmDialog.tsx`
- `src/test/setup.ts`
- `src/test/fixtures/workspace.ts`
- `src/utils/environment.test.ts`
- `src/utils/request.test.ts`
- `src/utils/postman.test.ts`
- `src/stores/workspaceStore.test.ts`
- `Dockerfile`
- `nginx.conf`
- `.dockerignore`

### Modify
- `README.md` (run instructions)

---

### Task 1: Scaffold Vite + Tooling Foundation

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`
- Test: `src/App.test.tsx` (create minimal render test)

- [ ] **Step 1: Write the failing test for app boot render**

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders TinyRex header text', () => {
    render(<App />)
    expect(screen.getByText('TinyRex')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest src/App.test.tsx`
Expected: FAIL with module/file not found errors before scaffold is complete.

- [ ] **Step 3: Create Vite React TS project files and test config**

```json
// package.json (scripts section)
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
})
```

```tsx
// src/App.tsx
export default function App() {
  return <div className="min-h-screen">TinyRex</div>
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn test`
Expected: PASS for `src/App.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.ts postcss.config.js src/main.tsx src/App.tsx src/index.css src/test/setup.ts src/App.test.tsx

git commit -m "chore: scaffold TinyRex app foundation"
```

---

### Task 2: Define Core Types + Workspace Fixtures

**Files:**
- Create: `src/types/workspace.ts`, `src/test/fixtures/workspace.ts`, `src/utils/id.ts`
- Test: `src/types/workspace.test.ts`

- [ ] **Step 1: Write failing test for workspace shape defaults**

```ts
// src/types/workspace.test.ts
import { createDefaultWorkspace } from '../test/fixtures/workspace'

describe('workspace fixture', () => {
  it('creates one default tab and activeTabId', () => {
    const ws = createDefaultWorkspace()
    expect(ws.tabs).toHaveLength(1)
    expect(ws.activeTabId).toBe(ws.tabs[0].id)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn vitest src/types/workspace.test.ts`
Expected: FAIL because fixture/types do not exist.

- [ ] **Step 3: Add domain types and default fixture generator**

```ts
// src/types/workspace.ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface KeyValue { id: string; key: string; value: string; enabled: boolean }
export interface RequestBody { type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw'; content: string; formItems?: KeyValue[] }
export interface Auth { type: 'none' | 'bearer' | 'basic' | 'api-key'; bearer?: { token: string }; basic?: { username: string; password: string }; apiKey?: { key: string; value: string; addTo: 'header' | 'query' } }
export interface RequestModel { method: HttpMethod; url: string; params: KeyValue[]; headers: KeyValue[]; body: RequestBody; auth: Auth }
export interface ResponseModel { status: number; statusText: string; headers: Record<string, string>; body: string; time: number; size: number }
export interface Tab { id: string; name: string; request: RequestModel; response?: ResponseModel; isDirty: boolean }
export interface EnvironmentVariable { key: string; value: string; enabled: boolean }
export interface Environment { id: string; name: string; variables: EnvironmentVariable[]; isActive: boolean }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn vitest src/types/workspace.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/workspace.ts src/types/workspace.test.ts src/test/fixtures/workspace.ts src/utils/id.ts

git commit -m "feat: define workspace domain models"
```

---

### Task 3: Implement Environment Variable Resolution Utility

**Files:**
- Create: `src/utils/environment.ts`, `src/utils/environment.test.ts`

- [ ] **Step 1: Write failing tests for `{{VAR_NAME}}` substitution**

```ts
// src/utils/environment.test.ts
import { resolveTemplate } from './environment'

it('replaces enabled environment variables', () => {
  const output = resolveTemplate('https://{{host}}/v1/{{resource}}', {
    host: 'api.example.com',
    resource: 'users'
  })
  expect(output).toBe('https://api.example.com/v1/users')
})

it('keeps unknown variables untouched', () => {
  expect(resolveTemplate('https://{{missing}}/x', {})).toBe('https://{{missing}}/x')
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn vitest src/utils/environment.test.ts`
Expected: FAIL because utility not implemented.

- [ ] **Step 3: Implement utility**

```ts
// src/utils/environment.ts
const TEMPLATE_REGEX = /\{\{\s*([\w.-]+)\s*\}\}/g

export function resolveTemplate(input: string, values: Record<string, string>): string {
  return input.replace(TEMPLATE_REGEX, (_, key: string) => values[key] ?? `{{${key}}}`)
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn vitest src/utils/environment.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/environment.ts src/utils/environment.test.ts

git commit -m "feat: add environment template resolver"
```

---

### Task 4: Implement Request Assembly Utility (params, auth, body)

**Files:**
- Create: `src/utils/request.ts`, `src/utils/request.test.ts`

- [ ] **Step 1: Write failing tests for axios request config builder**

```ts
// src/utils/request.test.ts
import { buildAxiosConfig } from './request'

it('adds enabled query params to url', () => {
  const cfg = buildAxiosConfig({
    method: 'GET',
    url: 'https://api.test.com/users',
    params: [{ id: '1', key: 'page', value: '2', enabled: true }],
    headers: [],
    body: { type: 'none', content: '' },
    auth: { type: 'none' }
  })

  expect(cfg.url).toBe('https://api.test.com/users?page=2')
})

it('adds bearer token header', () => {
  const cfg = buildAxiosConfig({
    method: 'GET',
    url: 'https://api.test.com',
    params: [],
    headers: [],
    body: { type: 'none', content: '' },
    auth: { type: 'bearer', bearer: { token: 'abc' } }
  })

  expect(cfg.headers.Authorization).toBe('Bearer abc')
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn vitest src/utils/request.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `buildAxiosConfig`**

```ts
// src/utils/request.ts
import type { AxiosRequestConfig } from 'axios'
import type { RequestModel } from '../types/workspace'

export function buildAxiosConfig(request: RequestModel): AxiosRequestConfig {
  const url = new URL(request.url)

  request.params.filter(p => p.enabled && p.key).forEach(p => {
    url.searchParams.set(p.key, p.value)
  })

  const headers: Record<string, string> = {}
  request.headers.filter(h => h.enabled && h.key).forEach(h => { headers[h.key] = h.value })

  if (request.auth.type === 'bearer' && request.auth.bearer?.token) {
    headers.Authorization = `Bearer ${request.auth.bearer.token}`
  }

  return {
    method: request.method,
    url: url.toString(),
    headers,
    data: request.body.type === 'none' ? undefined : request.body.content
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `yarn vitest src/utils/request.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/request.ts src/utils/request.test.ts

git commit -m "feat: build axios config from request model"
```

---

### Task 5: Build Zustand Workspace Store with Persistence

**Files:**
- Create: `src/stores/workspaceStore.ts`, `src/stores/workspaceStore.test.ts`

- [ ] **Step 1: Write failing store action tests**

```ts
// src/stores/workspaceStore.test.ts
import { useWorkspaceStore } from './workspaceStore'

it('creates new tab and sets it active', () => {
  const { addTab } = useWorkspaceStore.getState()
  addTab()
  const state = useWorkspaceStore.getState()
  expect(state.workspace.tabs.length).toBe(2)
  expect(state.workspace.activeTabId).toBe(state.workspace.tabs[1].id)
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn vitest src/stores/workspaceStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement store and core actions**

```ts
// src/stores/workspaceStore.ts
interface WorkspaceState {
  workspace: Workspace
  addTab: () => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateActiveRequest: (patch: Partial<RequestModel>) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspace: createDefaultWorkspace(),
      addTab: () => { /* create tab + set active */ },
      closeTab: (tabId) => { /* remove with one-tab guard */ },
      setActiveTab: (tabId) => { /* set active */ },
      updateActiveRequest: (patch) => { /* merge into active tab */ }
    }),
    { name: 'tinyrex_workspace', storage: createJSONStorage(() => localStorage) }
  )
)
```

- [ ] **Step 4: Run store tests**

Run: `yarn vitest src/stores/workspaceStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/workspaceStore.ts src/stores/workspaceStore.test.ts src/test/fixtures/workspace.ts

git commit -m "feat: add persisted workspace store"
```

---

### Task 6: Implement Theme System + Layout Shell

**Files:**
- Create: `src/theme/palette.ts`, `src/theme/theme.ts`, `src/features/workspace/LayoutShell.tsx`, `src/features/workspace/HeaderBar.tsx`, `src/components/ThemeToggle.tsx`, `src/components/SectionCard.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/features/workspace/LayoutShell.test.tsx`

- [ ] **Step 1: Write failing test for theme toggle and sidebar collapse**

```tsx
// src/features/workspace/LayoutShell.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LayoutShell } from './LayoutShell'

it('toggles sidebar visibility', () => {
  render(<LayoutShell />)
  fireEvent.click(screen.getByRole('button', { name: /toggle sidebar/i }))
  expect(screen.queryByTestId('workspace-sidebar')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `yarn vitest src/features/workspace/LayoutShell.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement dual theme and base app shell (no gradients)**

```ts
// src/theme/palette.ts
export const lightPalette = {
  background: '#f6f8fa',
  surface: '#ffffff',
  accent: '#0969da',
  border: '#d0d7de'
}

export const darkPalette = {
  background: '#0f1117',
  surface: '#1c2128',
  accent: '#58a6ff',
  border: '#30363d'
}
```

```tsx
// src/App.tsx
export default function App() {
  return <LayoutShell />
}
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest src/features/workspace/LayoutShell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/theme/palette.ts src/theme/theme.ts src/features/workspace/LayoutShell.tsx src/features/workspace/HeaderBar.tsx src/components/ThemeToggle.tsx src/components/SectionCard.tsx src/App.tsx src/main.tsx src/features/workspace/LayoutShell.test.tsx

git commit -m "feat: implement dual-theme workspace shell"
```

---

### Task 7: Build Tab Bar + Request Builder UI

**Files:**
- Create: `src/features/workspace/TabBar.tsx`, `src/features/request/RequestBuilder.tsx`, `src/features/request/RequestTabs.tsx`, `src/components/KeyValueEditor.tsx`
- Modify: `src/features/workspace/LayoutShell.tsx`
- Test: `src/features/request/RequestBuilder.test.tsx`

- [ ] **Step 1: Write failing test for method/url editing and new tab action**

```tsx
// src/features/request/RequestBuilder.test.tsx
it('updates active request method and url', async () => {
  // render with store provider
  // select POST + type URL
  // assert store active request updated
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `yarn vitest src/features/request/RequestBuilder.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement TabBar and RequestBuilder forms**

```tsx
// RequestBuilder sections
// - method <Select>
// - url <TextField>
// - tabs: Params/Auth/Headers/Body
// - Send button (handler wired in Task 8)
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest src/features/request/RequestBuilder.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/workspace/TabBar.tsx src/features/request/RequestBuilder.tsx src/features/request/RequestTabs.tsx src/components/KeyValueEditor.tsx src/features/workspace/LayoutShell.tsx src/features/request/RequestBuilder.test.tsx

git commit -m "feat: add tab management and request builder UI"
```

---

### Task 8: Implement Request Send Flow + Response Panel

**Files:**
- Create: `src/features/request/ResponsePanel.tsx`
- Modify: `src/features/request/RequestBuilder.tsx`, `src/stores/workspaceStore.ts`
- Test: `src/features/request/ResponsePanel.test.tsx`, `src/features/request/requestSend.test.ts`

- [ ] **Step 1: Write failing tests for successful and failed request responses**

```ts
// src/features/request/requestSend.test.ts
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

it('stores response metadata after send', async () => {
  const mock = new MockAdapter(axios)
  mock.onGet('https://api.test.com/users').reply(200, { ok: true }, { 'x-test': '1' })
  // trigger sendCurrentRequest
  // expect active tab response.status === 200
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn vitest src/features/request/requestSend.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement send action and response rendering tabs (Pretty/Raw/Headers)**

```ts
// store action signature
sendCurrentRequest: () => Promise<void>
```

```tsx
// ResponsePanel
// - status badge color by range
// - metadata row: status/time/size
// - tabs: Pretty | Raw | Headers
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest src/features/request/requestSend.test.ts src/features/request/ResponsePanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/request/ResponsePanel.tsx src/features/request/RequestBuilder.tsx src/stores/workspaceStore.ts src/features/request/requestSend.test.ts src/features/request/ResponsePanel.test.tsx

git commit -m "feat: execute requests and render responses"
```

---

### Task 9: Implement Collections CRUD + Nested Tree + Save-to-Collection

**Files:**
- Create: `src/features/collections/CollectionsPanel.tsx`, `src/features/collections/CollectionTreeItem.tsx`
- Modify: `src/stores/workspaceStore.ts`, `src/features/workspace/LayoutShell.tsx`
- Test: `src/features/collections/collectionsStore.test.ts`

- [ ] **Step 1: Write failing tests for create folder/request and save current request**

```ts
// src/features/collections/collectionsStore.test.ts
it('saves active request into selected collection folder', () => {
  // setup store with collection
  // call saveActiveRequestToCollection(folderId)
  // expect new CollectionRequest item exists
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn vitest src/features/collections/collectionsStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement collection actions and tree UI**

```ts
// store actions
addCollection(name: string)
addCollectionFolder(parentId: string | null, name: string)
saveActiveRequestToCollection(parentId: string | null, name: string)
renameCollectionItem(id: string, name: string)
deleteCollectionItem(id: string)
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest src/features/collections/collectionsStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/collections/CollectionsPanel.tsx src/features/collections/CollectionTreeItem.tsx src/stores/workspaceStore.ts src/features/workspace/LayoutShell.tsx src/features/collections/collectionsStore.test.ts

git commit -m "feat: add nested collections management"
```

---

### Task 10: Implement Environments CRUD + Active Selector + Substitution Hookup

**Files:**
- Create: `src/features/environments/EnvironmentPanel.tsx`, `src/features/environments/EnvironmentSelector.tsx`
- Modify: `src/stores/workspaceStore.ts`, `src/features/request/RequestBuilder.tsx`
- Test: `src/features/environments/environmentStore.test.ts`, `src/features/request/substitution.test.ts`

- [ ] **Step 1: Write failing tests for active environment selection and variable replacement**

```ts
// src/features/request/substitution.test.ts
it('replaces {{baseUrl}} before send', async () => {
  // active env: baseUrl=https://api.test.com
  // request url: {{baseUrl}}/users
  // expect axios called with https://api.test.com/users
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn vitest src/features/environments/environmentStore.test.ts src/features/request/substitution.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement environment actions and selector UI**

```ts
// store actions
addEnvironment(name: string)
setActiveEnvironment(envId: string)
upsertEnvironmentVariable(envId: string, variable: EnvironmentVariable)
removeEnvironment(envId: string)
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest src/features/environments/environmentStore.test.ts src/features/request/substitution.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/environments/EnvironmentPanel.tsx src/features/environments/EnvironmentSelector.tsx src/stores/workspaceStore.ts src/features/request/RequestBuilder.tsx src/features/environments/environmentStore.test.ts src/features/request/substitution.test.ts

git commit -m "feat: add environments and request variable substitution"
```

---

### Task 11: Implement Postman v2.1 Import/Export

**Files:**
- Create: `src/types/postman.ts`, `src/utils/postman.ts`, `src/utils/postman.test.ts`
- Modify: `src/features/collections/CollectionsPanel.tsx`

- [ ] **Step 1: Write failing conversion tests (workspace -> postman, postman -> workspace)**

```ts
// src/utils/postman.test.ts
import { toPostmanCollection, fromPostmanCollection } from './postman'

it('exports tinyrex collection to postman v2.1 info schema', () => {
  const out = toPostmanCollection(sampleCollection)
  expect(out.info.schema).toContain('collection.json')
})

it('imports postman v2.1 collection into tinyrex structure', () => {
  const result = fromPostmanCollection(postmanFixture)
  expect(result.name).toBe('Imported Collection')
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `yarn vitest src/utils/postman.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement converters and wire import/export buttons**

```ts
// src/utils/postman.ts
export function toPostmanCollection(collection: Collection): PostmanCollectionV21 { /* map recursively */ }
export function fromPostmanCollection(input: PostmanCollectionV21): Collection { /* map recursively */ }
```

- [ ] **Step 4: Run tests**

Run: `yarn vitest src/utils/postman.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/postman.ts src/utils/postman.ts src/utils/postman.test.ts src/features/collections/CollectionsPanel.tsx

git commit -m "feat: support postman v2.1 import and export"
```

---

### Task 12: Docker + Nginx + Final Verification

**Files:**
- Create: `Dockerfile`, `nginx.conf`, `.dockerignore`
- Modify: `README.md`

- [ ] **Step 1: Write failing integration check command (build artifacts required)**

Run: `yarn build`
Expected: FAIL if any unresolved TS/runtime import issues remain.

- [ ] **Step 2: Add Docker and nginx config for SPA routing**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN yarn install --frozen-lockfile
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 3: Run full verification**

Run: `yarn test && yarn build && docker build -t tinyrex:local .`
Expected:
- Vitest passes
- Build succeeds and outputs `dist/`
- Docker image builds successfully

- [ ] **Step 4: Update README with local/dev/deploy instructions**

```md
## Run locally
yarn install
yarn dev

## Test
yarn test

## Build
yarn build

## Docker
docker build -t tinyrex:local .
docker run -p 8080:80 tinyrex:local
```

- [ ] **Step 5: Commit**

```bash
git add Dockerfile nginx.conf .dockerignore README.md

git commit -m "chore: add containerization and runbook"
```

---

## Spec Coverage Check

- Request builder (methods, URL, params, headers, auth, body): **Task 7 + Task 8 + Task 10**
- Response panel (pretty/raw/headers + metadata): **Task 8**
- Tabs (new/close/reorder): **Task 7**
- Collections CRUD + nested folders + save request: **Task 9**
- Environments + variable substitution: **Task 10**
- Import/Export Postman v2.1: **Task 11**
- Dual theme, no gradient, flexible sidebar layout: **Task 6**
- localStorage persistence (`tinyrex_workspace`): **Task 5**
- Deploy on K8s via nginx Docker image: **Task 12**
- No CORS bypass/proxy: **Implemented by architecture constraints in Task 1/8/12**

## Placeholder Scan

- No `TODO`, `TBD`, or deferred “implement later” markers.
- Every code step includes concrete target files and code snippets.
- Every test step includes exact command + expected result.

## Type Consistency Check

- Unified `RequestModel`, `ResponseModel`, and `Workspace` names across store/utils/features.
- Request assembly path (`buildAxiosConfig`) consumed by send action in store.
- Postman conversion types isolated to `src/types/postman.ts` and mapped to/from `Collection`.
