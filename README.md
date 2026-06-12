# Tracker SDK Local Build

面向以下平台的埋点 SDK 本地生成项目：

- Taro 微信小程序
- Taro 支付宝小程序
- H5

## 目录说明

```text
src/
  core/                 # 通用埋点核心
  entries/              # 平台入口
  types/                # 类型声明
scripts/
  generate-sdk.mjs      # 生成对应平台 SDK 文件包
release/
  tracker-sdk-h5/
  tracker-sdk-taro-weapp/
  tracker-sdk-taro-alipay/
```

## 可用命令

```bash
npm install
npm run generate:h5
npm run generate:taro-weapp
npm run generate:taro-alipay
npm run generate:all
```

执行后会在 `release/` 下生成每个平台的独立文件包目录，目录内包含：

- `dist/index.js`
- `dist/index.cjs`
- `dist/index.d.ts`
- `package.json`
- `README.md`

## 接入示例

### H5

```ts
import { createH5Tracker } from './release/tracker-sdk-h5/dist/index.js'

const tracker = createH5Tracker({
  appId: 'goal_app',
  endpoint: 'https://example.com/api/track/batch'
})

void tracker.track('goal_create', { goalId: 'g_1' })
```

### Taro 微信/支付宝小程序

```ts
import { createTaroWeappTracker, createTaroPageLifecycle } from './release/tracker-sdk-taro-weapp/dist/index.js'

const tracker = createTaroWeappTracker({
  appId: 'goal_app',
  endpoint: 'https://example.com/api/track/batch'
})

const pageTracker = createTaroPageLifecycle(tracker)

Page({
  onShow: pageTracker.onShow,
  onHide: pageTracker.onHide,
  onUnload: pageTracker.onUnload
})
```
