# TinyRex — Postman Clone Design Spec

**Date:** 2026-04-07
**Project:** TinyRex
**Stack:** React 18 + Vite + TypeScript + MUI v5 + Tailwind CSS + Yarn

---

## 1. Overview

TinyRex là ứng dụng web clone lại Postman, cho phép người dùng gửi HTTP requests, quản lý collections, environments, và workspace. Toàn bộ dữ liệu được lưu trữ trên localStorage — không cần backend.

**Tính năng bao gồm:**
- Gửi HTTP requests (tất cả methods)
- Quản lý tabs + workspace lưu localStorage
- Collections & nested folders
- Environments với variable substitution (`{{VAR_NAME}}`)
- Authentication (Bearer, Basic, API Key)
- Import/Export Postman v2.1 format
- Dual theme (Dark / Light), không dùng gradient
- Layout linh hoạt: sidebar ẩn/hiện được

**Tính năng KHÔNG bao gồm:**
- History
- Pre-request scripts
- Tests/Assertions
- Proxy server (CORS không được bypass — browser native behavior)

---

## 2. Kiến trúc tổng thể

**Single Page Application** — chỉ frontend, không có backend.

```
TinyRex/
  src/
    components/        # UI components tái sử dụng
    features/
      collections/     # Quản lý Collections
      environments/    # Quản lý Environments
      request/         # Tab request chính
      workspace/       # Workspace & tabs
    hooks/             # Custom hooks (useLocalStorage, useTheme...)
    stores/            # Zustand stores
    types/             # TypeScript interfaces
    utils/             # Helpers (import/export, format...)
    theme/             # MUI theme config (light + dark)
  public/
  index.html
  vite.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
  Dockerfile
  nginx.conf
  .dockerignore
```

**Dependencies chính:**
- `zustand` — state management + localStorage persistence
- `axios` — HTTP client để gửi requests
- `@mui/material` — UI components
- `@monaco-editor/react` — JSON/code editor trong request body và response
- `@dnd-kit/core` — drag & drop cho tabs và collection items
- `react-router-dom` — routing (SPA)

---

## 3. Layout & Giao diện

```
┌─────────────────────────────────────────────┐
│  Header (logo, workspace name, theme toggle) │
├──────────┬──────────────────────────────────┤
│          │  [Tab1] [Tab2] [+ New Tab]        │
│ Sidebar  ├──────────────────────────────────┤
│          │  Request Builder                  │
│ - Envs   │  ┌─ Method ─┬─── URL ───┬─Send─┐ │
│ - Colls  │  └──────────┴───────────┴──────┘ │
│          │  [Params][Auth][Headers][Body]    │
│ (ẩn/hiện │  ─────────────────────────────── │
│  được)   │  Response Panel                   │
│          │  Status | Time | Size             │
│          │  [Pretty][Raw][Headers]           │
│          │  Response body                    │
└──────────┴──────────────────────────────────┘
```

**Dark Theme:**
- Background: `#0f1117`
- Sidebar: `#161b22`
- Card/Panel: `#1c2128`
- Accent: `#58a6ff`
- Border: `#30363d`
- Text primary: `#e6edf3`
- Text secondary: `#7d8590`

**Light Theme:**
- Background: `#f6f8fa`
- Sidebar: `#ffffff`
- Card/Panel: `#ffffff`
- Accent: `#0969da`
- Border: `#d0d7de`
- Text primary: `#1f2328`
- Text secondary: `#656d76`

**Font:** Inter (Google Fonts)
**Không dùng gradient** ở bất kỳ đâu.

---

## 4. Data Models

```typescript
// Workspace — toàn bộ state lưu vào localStorage key: "tinyrex_workspace"
interface Workspace {
  id: string
  name: string
  collections: Collection[]
  environments: Environment[]
  tabs: Tab[]
  activeTabId: string
}

// Tab — mỗi tab là một request đang làm việc
interface Tab {
  id: string
  name: string
  request: Request
  response?: Response
  isDirty: boolean
}

// Request
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

interface Request {
  method: HttpMethod
  url: string
  params: KeyValue[]
  headers: KeyValue[]
  body: RequestBody
  auth: Auth
}

interface RequestBody {
  type: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw'
  content: string  // JSON string hoặc raw text
  formItems?: KeyValue[]  // cho form-data và urlencoded
}

interface Auth {
  type: 'none' | 'bearer' | 'basic' | 'api-key'
  bearer?: { token: string }
  basic?: { username: string; password: string }
  apiKey?: { key: string; value: string; addTo: 'header' | 'query' }
}

// Response
interface Response {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  time: number   // ms
  size: number   // bytes
}

// Collection
interface Collection {
  id: string
  name: string
  items: CollectionItem[]
}

type CollectionItem = CollectionFolder | CollectionRequest

interface CollectionFolder {
  type: 'folder'
  id: string
  name: string
  items: CollectionItem[]
}

interface CollectionRequest {
  type: 'request'
  id: string
  name: string
  request: Request
}

// Environment
interface Environment {
  id: string
  name: string
  variables: EnvironmentVariable[]
  isActive: boolean
}

interface EnvironmentVariable {
  key: string
  value: string
  enabled: boolean
}

interface KeyValue {
  id: string
  key: string
  value: string
  enabled: boolean
}
```

---

## 5. Tính năng chi tiết

### 5.1 Request Builder
- Method dropdown: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- URL bar: hỗ trợ `{{variable}}` syntax — highlight màu, tự replace từ active Environment
- **Params tab:** key-value editor, checkbox bật/tắt từng param, tự động append vào URL
- **Auth tab:** dropdown type → form phù hợp
  - Bearer: input token
  - Basic: username + password
  - API Key: key name + value + location (header/query)
- **Headers tab:** key-value editor, checkbox bật/tắt
- **Body tab:** chọn type → hiển thị editor tương ứng
  - JSON: Monaco editor với syntax highlight
  - form-data / urlencoded: key-value editor
  - raw: textarea
- **Send button:** loading state khi đang gửi, Cancel button để abort request
- Khi nhận response → hiển thị xuống Response Panel

### 5.2 Response Panel
- Status badge: xanh (2xx), vàng (3xx), đỏ (4xx/5xx), xám (network error)
- Metadata: status code + text, thời gian (ms), kích thước (KB/MB)
- **Tab Pretty:** format JSON/XML với syntax highlighting, collapse/expand nodes
- **Tab Raw:** text thuần
- **Tab Headers:** bảng response headers
- Copy response body button

### 5.3 Tabs
- Mở tab mới: nút `+` hoặc click vào request trong Collection
- Đóng tab: nút `×`, nếu `isDirty` thì hỏi xác nhận
- Reorder tabs: drag & drop
- Tên tab: "New Request" mặc định, đổi thành tên Collection item nếu có

### 5.4 Collections
- CRUD: tạo/sửa/xóa collection, folder, request
- Drag & drop reorder
- Right-click context menu: Rename, Duplicate, Delete, Save current request here
- Click request → mở trong tab mới
- Nested folders (tối đa không giới hạn độ sâu)

### 5.5 Environments
- CRUD: tạo/sửa/xóa environment
- Active environment selector ở header (dropdown)
- Variable `{{VAR_NAME}}` được highlight trong URL bar và headers
- Chỉ một environment active tại một thời điểm

### 5.6 Import/Export
- **Export:** chọn collection → download `.json` Postman Collection v2.1 format
- **Import:** chọn file `.json` → parse → validate → thêm vào workspace
- Xử lý lỗi: hiển thị message nếu file không hợp lệ

---

## 6. State Management

Dùng **Zustand** với middleware `persist`:

```typescript
// store/workspaceStore.ts
const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      workspace: defaultWorkspace,
      // actions: addTab, closeTab, updateRequest, addCollection, ...
    }),
    {
      name: 'tinyrex_workspace',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

Mỗi action (addTab, updateRequest, v.v.) là một function trong store — components không thao tác trực tiếp với localStorage.

---

## 7. Deployment

**Dockerfile (multi-stage build):**
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

**nginx.conf** — SPA routing (redirect 404 về `index.html`):
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

K8s: deploy như một Deployment + Service, không cần Ingress đặc biệt gì ngoài standard HTTP.

---

## 8. Quyết định đã xác nhận

| Quyết định | Lựa chọn | Lý do |
|-----------|---------|-------|
| Architecture | SPA thuần | Đơn giản, không cần backend |
| CORS | Không bypass | Chấp nhận browser behavior |
| State | Zustand + persist | Nhẹ, đơn giản, localStorage auto-sync |
| Theme | Dual (Dark/Light) | Không gradient |
| Import/Export | Postman v2.1 | Tương thích với ecosystem Postman |
| Deploy | K8s + nginx | Static files, 1 container |
