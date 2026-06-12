# Taro 支付宝小程序 Tracker SDK

企业级埋点 SDK，支持批量上报、数据持久化、Mock 模式等功能。

## 安装方式

### 方式一：通过 npm 安装（推荐用于正式项目）

发布到 npm 后，可以直接安装：

```bash
npm install tracker-sdk-taro-alipay
# 或
pnpm add tracker-sdk-taro-alipay
# 或
yarn add tracker-sdk-taro-alipay
```

### 方式二：复制文件到项目（适合本地开发）

将 `dist/` 目录下的文件复制到你的项目中，例如放在 `src/assets/js/` 目录下：

```
your-app/
└── src/
    └── assets/
        └── js/
            ├── taro-alipay.mjs
            └── taro-alipay.d.ts
```

### 方式三：作为本地 npm 包引用（开发环境）

如果你是在本地开发 SDK，可以直接引用本地路径：

```json
{
  "dependencies": {
    "tracker-sdk-taro-alipay": "file:path/to/tracker-sdk/release/tracker-sdk-taro-alipay"
  }
}
```

## 快速开始

### 1. 基础初始化

根据你的安装方式选择对应的引用方法：

#### 使用 npm 包

```typescript
import { createTaroAlipayTracker } from 'tracker-sdk-taro-alipay'

const tracker = createTaroAlipayTracker({
  appId: 'your_app_id',
  endpoint: 'https://your-tracking-endpoint.com/api/track',
  debug: process.env.NODE_ENV === 'development',
  mock: process.env.NODE_ENV === 'development'
})
```

#### 使用本地文件

```typescript
import * as TrackerSDK from '@/assets/js/taro-alipay.mjs'

const tracker = (TrackerSDK as any).createTaroAlipayTracker({
  appId: 'your_app_id',
  endpoint: 'https://your-tracking-endpoint.com/api/track',
  debug: process.env.NODE_ENV === 'development',
  mock: process.env.NODE_ENV === 'development'
})
```

### 2. 完整配置示例

```typescript
import { createTaroAlipayTracker } from 'tracker-sdk-taro-alipay'
// 或使用本地文件
// import * as TrackerSDK from '@/assets/js/taro-alipay.mjs'
// const { createTaroAlipayTracker } = TrackerSDK as any

const tracker = createTaroAlipayTracker({
  appId: 'your_app_id',
  endpoint: 'https://your-tracking-endpoint.com/api/track/batch',
  
  // 上报策略配置
  batchSize: 20,              // 队列满 20 条立即上报
  flushInterval: 5000,        // 每 5 秒自动上报
  maxQueueSize: 500,          // 最大队列长度
  
  // 自动埋点配置（Taro 小程序目前不支持，需要手动调用）
  autoTrackPage: false,
  autoTrackClick: false,
  
  // 调试配置
  debug: true,                // 开启控制台日志
  mock: false,                // 是否开启 mock 模式（不上报真实服务器）
  mockStorageKey: '__tracker_mock_events__', // mock 数据存储 key
  
  // 请求头配置
  headers: {
    'Authorization': 'Bearer token'
  },
  
  // 通用上下文
  commonContext: {
    appVersion: '1.0.0',
    environment: 'production'
  }
})
```

## API 文档

### `createTaroAlipayTracker(config)`

创建一个 Tracker 实例。

**参数：**
- `config.appId` (string, 必填): 应用唯一标识
- `config.endpoint` (string, 必填): 数据上报接口地址
- `config.batchSize` (number, 可选): 批量上报阈值，默认 20
- `config.flushInterval` (number, 可选): 定时上报间隔（毫秒），默认 5000
- `config.maxQueueSize` (number, 可选): 最大队列长度，默认 500
- `config.autoTrackPage` (boolean, 可选): 是否自动页面埋点，默认 false
- `config.autoTrackClick` (boolean, 可选): 是否自动点击埋点，默认 false
- `config.debug` (boolean, 可选): 是否开启调试日志，默认 false
- `config.mock` (boolean, 可选): 是否开启 mock 模式，默认 false
- `config.headers` (object, 可选): 请求头配置
- `config.commonContext` (object, 可选): 通用上下文

### Tracker 实例方法

#### `track(event, properties)`

手动上报自定义事件。

```typescript
// 基础事件上报
tracker.track('button_click')

// 带属性的事件上报
tracker.track('purchase', {
  productId: '123',
  price: 99.99,
  currency: 'CNY'
})
```

#### `pageView(page, properties)`

上报页面访问事件。

```typescript
// 使用当前页面路径
tracker.pageView()

// 手动指定页面
tracker.pageView('/pages/home/index', {
  source: 'share'
})
```

#### `pageLeave(page, properties)`

上报页面离开事件，包含页面停留时长。

```typescript
// 离开当前页面
tracker.pageLeave()

// 手动指定页面
tracker.pageLeave('/pages/home/index')
```

#### `identify(userId)`

设置用户身份，用于关联用户行为。

```typescript
// 用户登录后设置
tracker.identify('user_12345')

// 切换用户
tracker.identify('user_67890')
```

#### `setTenantId(tenantId)`

设置租户身份，用于按租户维度关联用户行为数据。

```typescript
// 用户登录后或获取租户信息后设置
tracker.setTenantId('tenant_12345')

// 切换租户
tracker.setTenantId('tenant_67890')
```

#### `flush()`

手动触发队列上报。

```typescript
// 立即上报所有队列中的事件
tracker.flush()
```

#### `trackFromDataset(dataset, extraProperties)`

从 DOM 或组件的 dataset 属性中解析埋点事件。

```typescript
// 在 Taro 组件中使用
const handleClick = (e) => {
  tracker.trackFromDataset(e.currentTarget.dataset)
}

// 组件中
<View data-track="button_click" data-track-props='{"buttonName":"submit"}' onClick={handleClick}>
  点击
</View>
```

#### `destroy()`

销毁 tracker 实例，清理定时器和事件监听。

```typescript
tracker.destroy()
```

## Taro 小程序集成示例

### 1. 创建统一的 tracker 配置文件

```typescript
// src/utils/tracker.ts
import { createTaroAlipayTracker } from 'tracker-sdk-taro-alipay'
// 或使用本地文件
// import * as TrackerSDK from '@/assets/js/taro-alipay.mjs'
import Taro from '@tarojs/taro'

// 配置是否启用 mock 模式（开发环境默认开启）
const MOCK_MODE = process.env.NODE_ENV === 'development'

// 类型声明
export interface TrackerConfig {
  appId: string
  endpoint: string
  batchSize?: number
  flushInterval?: number
  maxQueueSize?: number
  storageKey?: string
  autoTrackPage?: boolean
  autoTrackClick?: boolean
  debug?: boolean
  headers?: Record<string, string>
  commonContext?: Record<string, unknown>
  mock?: boolean
  mockStorageKey?: string
}

// 创建 tracker 配置
const trackerConfig: TrackerConfig = {
  appId: 'your_app_id',
  endpoint: 'https://your-tracking-endpoint.com/api/track',
  debug: process.env.NODE_ENV === 'development',
  mock: MOCK_MODE,
  mockStorageKey: '__tracker_mock_events__',
  batchSize: 20,
  flushInterval: 5000,
  maxQueueSize: 500,
}

// 创建 tracker 实例
export const tracker = createTaroAlipayTracker(trackerConfig)
// 或使用本地文件
// export const tracker = (TrackerSDK as any).createTaroAlipayTracker(trackerConfig)

// ==================== Mock 模式辅助工具 ====================
export const trackerMock = {
  getMockEvents: () => {
    try {
      const data = Taro.getStorageSync('__tracker_mock_events__')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },
  clearMockEvents: () => {
    Taro.removeStorageSync('__tracker_mock_events__')
  },
  isMockMode: () => MOCK_MODE
}
```

### 2. 页面生命周期埋点 Hook

```typescript
// src/hooks/useTracker.ts
import { useDidShow, useDidHide, useRouter } from '@tarojs/taro'
import { useEffect } from 'react'
import { tracker } from '@/utils/tracker'

export function usePageTracker() {
  const router = useRouter()
  const path = router.path

  useDidShow(() => {
    tracker.pageView(path)
  })

  useDidHide(() => {
    tracker.pageLeave(path)
  })

  useEffect(() => {
    return () => {
      tracker.pageLeave(path)
    }
  }, [path])
}

export { tracker }
```

### 3. 在页面中使用

```typescript
// src/pages/home/index.tsx
import { tracker, usePageTracker } from '@/hooks/useTracker'

export default function HomePage() {
  // 自动页面埋点
  usePageTracker()

  const handleButtonClick = () => {
    // 手动事件埋点
    tracker.track('home_button_click', {
      buttonName: 'start'
    })
  }

  return (
    <View>
      <Button onClick={handleButtonClick}>开始</Button>
    </View>
  )
}
```

### 4. 用户身份关联

```typescript
// 在登录或用户信息获取后设置
import { tracker } from '@/utils/tracker'

// 用户登录成功后
const onLoginSuccess = (userInfo) => {
  tracker.identify(userInfo.userId)
}

// 切换用户或退出登录时
const onLogout = () => {
  // 如果需要重置身份，可调用 resetIdentity（需要 SDK 暴露此方法）
  // 或者创建新的 tracker 实例
}
```

## Mock 模式使用

在开发环境下，可以开启 mock 模式来：
- 不上报真实服务器
- 在控制台打印埋点数据
- 保存到本地存储供调试查看

```typescript
// 查看所有 mock 的事件
import { trackerMock } from '@/utils/tracker'

console.log(trackerMock.getMockEvents())

// 清空 mock 数据
trackerMock.clearMockEvents()

// 检查是否在 mock 模式
console.log(trackerMock.isMockMode())
```

## 数据结构

### 上报数据格式

```json
{
  "events": [
    {
      "appId": "your_app_id",
      "event": "page_view",
      "userId": "user_123",
      "tenantId": "tenant_456",
      "deviceId": "taro-alipay_abc123...",
      "page": "/pages/home/index",
      "timestamp": 1688888888888,
      "properties": {
        "source": "share"
      },
      "context": {
        "sdkVersion": "0.2.0",
        "platform": "taro-alipay",
        "system": "iOS 16.0",
        "model": "iPhone 14",
        "appVersion": "10.2.60",
        "networkType": "wifi"
      }
    }
  ]
}
```

## 常见问题

### Q: 如何关闭自动上报？
A: 将 `flushInterval` 设置为 `0`，然后手动调用 `flush()`。

### Q: 如何保证数据不丢失？
A: SDK 会将未上报的事件持久化到本地存储，即使 App 重启也会恢复。

### Q: 如何切换不同的上报环境？
A: 根据环境变量修改 `endpoint` 配置即可。

### Q: Taro 小程序的自动埋点为什么不工作？
A: 目前 Taro 适配器没有实现自动埋点功能，需要手动调用方法或使用我们提供的 Hook。

## 版本历史

- **v0.2.0**: 添加租户身份支持
  - 新增 `setTenantId` 方法
  - 上报数据包含 `tenantId` 字段
  - 支持按租户维度分析数据

- **v0.1.0**: 初始版本
  - 支持基础事件上报
  - 支持队列和批量上报
  - 支持 mock 模式
  - 支持用户身份关联
