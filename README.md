# Tracker SDK Local Build

面向多平台的埋点 SDK 本地生成项目，支持以下平台：

- Taro 微信小程序
- Taro 支付宝小程序
- H5

## 项目简介

本项目是一个轻量级、高性能的埋点 SDK 解决方案，提供以下核心功能：

- ✅ **多平台支持**: H5、Taro 微信小程序、Taro 支付宝小程序
- ✅ **批量上报**: 支持配置上报阈值和定时上报
- ✅ **数据持久化**: 本地存储未上报的事件，确保不丢失数据
- ✅ **Mock 模式**: 开发环境支持本地调试，不上报真实服务器
- ✅ **用户身份关联**: 支持设备 ID 和用户 ID 的绑定
- ✅ **类型安全**: 完整的 TypeScript 类型声明

## 目录结构

```text
.
├── src/
│   ├── core/                 # 通用埋点核心
│   │   ├── adapters/         # 平台适配器
│   │   ├── factory.ts        # Tracker 工厂
│   │   ├── tracker.ts        # 核心 Tracker 类
│   │   ├── queue.ts          # 事件队列管理
│   │   ├── types.ts          # 类型定义
│   │   └── utils.ts          # 工具函数
│   ├── entries/              # 平台入口文件
│   │   ├── h5.ts
│   │   ├── taro-alipay.ts
│   │   └── taro-weapp.ts
│   └── types/                # 类型声明
├── scripts/
│   └── generate-sdk.mjs      # SDK 生成脚本
├── release/                  # 编译后的 SDK 输出
│   ├── tracker-sdk-h5/
│   ├── tracker-sdk-taro-weapp/
│   └── tracker-sdk-taro-alipay/
└── docs/                     # 项目文档
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 生成 SDK

```bash
# 生成所有平台的 SDK
npm run generate:all

# 单个平台生成
npm run generate:h5
npm run generate:taro-weapp
npm run generate:taro-alipay
```

执行后会在 `release/` 目录下生成各平台的独立文件包，包含：

- `dist/` - 编译后的文件（.mjs, .cjs, .d.ts 等）
- `README.md` - 平台专属的使用文档
- `package.json` - 包配置文件

## 平台使用文档

每个平台都有完整的使用文档，查看对应目录的 `README.md`：

- [Taro 支付宝小程序](release/tracker-sdk-taro-alipay/README.md)
- [Taro 微信小程序](release/tracker-sdk-taro-weapp/README.md)
- [H5](release/tracker-sdk-h5/README.md)

## 快速接入示例

### H5 平台

```typescript
import { createH5Tracker } from './release/tracker-sdk-h5/dist/index.js'

const tracker = createH5Tracker({
  appId: 'your_app_id',
  endpoint: 'https://example.com/api/track/batch',
  debug: true
})

// 发送事件
tracker.track('goal_create', { goalId: 'g_1' })

// 页面访问
tracker.pageView('/home')
```

### Taro 微信/支付宝小程序

```typescript
import { 
  createTaroAlipayTracker,
  createTaroPageLifecycle 
} from './release/tracker-sdk-taro-alipay/dist/taro-alipay.mjs'

const tracker = createTaroAlipayTracker({
  appId: 'your_app_id',
  endpoint: 'https://example.com/api/track/batch',
  debug: true,
  mock: process.env.NODE_ENV === 'development'
})

// 页面生命周期埋点（可选）
const pageTracker = createTaroPageLifecycle(tracker)

// 在 React Hook 或页面组件中调用
tracker.track('button_click', { buttonName: 'submit' })
```

## 核心配置选项

所有平台都支持以下配置：

```typescript
{
  appId: 'your_app_id',              // 必填，应用唯一标识
  endpoint: 'https://...',            // 必填，上报接口地址
  
  // 上报策略
  batchSize: 20,                      // 队列满多少条立即上报
  flushInterval: 5000,                // 多少毫秒自动上报一次
  maxQueueSize: 500,                  // 队列最大容量
  
  // 调试配置
  debug: false,                       // 是否开启控制台日志
  mock: false,                        // 是否开启 mock 模式（开发模式）
  mockStorageKey: '__tracker_mock__', // mock 数据存储 key
  
  // 高级配置
  headers: {},                        // 请求头
  commonContext: {},                  // 通用上下文
  storageKey: '__tracker_events__',   // 存储 key
  
  // 自动埋点（仅 H5 平台支持）
  autoTrackPage: false,
  autoTrackClick: false
}
```

## 核心 API

所有平台共享统一的 API：

### 创建实例

```typescript
createH5Tracker(config)
createTaroWeappTracker(config)
createTaroAlipayTracker(config)
```

### Tracker 实例方法

- `track(event, properties)` - 发送自定义事件
- `pageView(page, properties)` - 上报页面访问
- `pageLeave(page, properties)` - 上报页面离开
- `identify(userId)` - 关联用户身份
- `setTenantId(tenantId | TenantInfo)` - 设置租户身份，支持 `sessionId`、`robotId` 等扩展字段
- `flush()` - 立即上报所有队列中的事件
- `destroy()` - 销毁实例

更多 API 详情请查看各平台的 README 文档。

## 项目设计

### 架构设计

项目采用适配器模式设计：

```
┌─────────────────────────────────────────┐
│         Tracker Core (通用逻辑)          │
├─────────────────────────────────────────┤
│  Queue  |  Identity  |  Persistence    │
└─────────────────────────────────────────┘
         ▲
         │
    ┌────┴────┐
    │ Adapter │
    └────┬────┘
         │
┌────────┼────────┐
│        │        │
▼        ▼        ▼
H5    Taro    Taro
      Weapp  Alipay
```

### 关键特性

1. **队列管理** - 使用本地存储持久化未上报事件
2. **批量上报** - 支持配置批量阈值和定时上报
3. **Mock 模式** - 开发时拦截上报，打印并保存到本地
4. **设备指纹** - 自动生成并持久化设备 ID
5. **平台适配** - 统一 API，各平台差异在 Adapter 层处理

## 项目文档

- [企业级埋点系统整体方案](docs/企业级埋点系统整体方案.md)
- [Taro 埋点系统设计方案](docs/Taro_埋点系统设计方案.md)

## 常见问题

### Q: 如何在多个项目间共享 SDK？

A: 可以将生成的 SDK 文件复制到各项目中，或使用 npm link 方式引用。

### Q: 如何修改 SDK 源码并重新编译？

A: 修改 `src/` 目录下的代码后，重新运行 `npm run generate:all` 即可。

### Q: 生产环境和开发环境如何切换配置？

A: 使用环境变量控制，例如 `mock: process.env.NODE_ENV === 'development'`。

## 开发与贡献

欢迎提出 Issue 和 Pull Request！

## 版本历史

- **v0.1.0** - 初始版本
  - 支持 H5、Taro 微信小程序、Taro 支付宝小程序
  - 基础事件上报、队列、批量上报
  - Mock 模式支持
  - 用户身份关联

