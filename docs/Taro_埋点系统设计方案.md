# Taro（微信/支付宝小程序）埋点系统设计方案

## 1. 目标

构建一套统一的埋点系统，支持：

- 微信小程序
- 支付宝小程序
- H5
- 鸿蒙 App（未来扩展）

能力范围：

- 自动埋点
- 手动埋点
- 曝光埋点
- 页面停留统计
- 离线缓存
- 批量上传
- 数据治理
- 实时分析

---

## 2. 整体架构

```text
客户端(Taro)

    ↓

Tracker SDK

    ↓

事件队列 Queue

    ↓

批量上传 Uploader

    ↓

埋点网关 API

    ↓

Kafka

    ↓

Flink

    ↓

ClickHouse

    ↓

BI分析平台
```

---

## 3. 项目结构

```text
src
 ├─ tracker
 │   ├─ index.ts
 │   ├─ core.ts
 │   ├─ queue.ts
 │   ├─ storage.ts
 │   ├─ uploader.ts
 │   ├─ page.ts
 │   ├─ exposure.ts
 │   ├─ types.ts
 │   └─ plugins
 │        ├─ device.ts
 │        ├─ network.ts
 │        └─ user.ts
```

---

## 4. 统一事件模型

```ts
export interface TrackEvent {
  event: string
  userId?: string
  deviceId: string
  page?: string
  timestamp: number
  properties?: Record<string, any>
}
```

示例：

```json
{
  "event":"habit_checkin",
  "userId":"10001",
  "deviceId":"abc123",
  "page":"pages/checkin/index",
  "timestamp":1717000000,
  "properties":{
    "habitId":"123"
  }
}
```

---

## 5. SDK核心能力

### 初始化

```ts
tracker.init({
  appId: "goal_app"
})
```

### 登录

```ts
tracker.identify(userId)
```

### 事件上报

```ts
tracker.track("habit_checkin", {
  habitId: "123"
})
```

---

## 6. 自动页面埋点

进入页面：

```ts
tracker.track("page_view")
```

离开页面：

```ts
tracker.track("page_leave", {
  duration: 35000
})
```

统计指标：

- PV
- UV
- 页面停留时长
- 跳出率

---

## 7. 点击埋点

### 推荐方案：声明式埋点

```tsx
<Button
  data-track="goal_create_click"
>
  创建目标
</Button>
```

SDK统一监听并自动上报。

优点：

- 业务代码零侵入
- 易维护
- 易治理

---

## 8. 曝光埋点

场景：

- 推荐目标
- 推荐课程
- VIP弹窗
- Banner

实现：

```ts
observeExposure("#vip-card", () => {
  tracker.track("vip_card_show")
})
```

---

## 9. 用户体系

采用双ID设计：

```ts
{
  userId,
  deviceId
}
```

### userId

登录后获得

### deviceId

首次安装生成

```ts
nanoid()
```

缓存到本地。

---

## 10. 公共属性

每个事件自动携带：

```json
{
  "platform":"wechat",
  "appVersion":"1.0.0",
  "system":"iOS",
  "model":"iPhone 15",
  "networkType":"wifi"
}
```

---

## 11. 事件队列

不要实时发送。

正确流程：

```text
track
 ↓
queue
 ↓
batch upload
```

触发上传条件：

- 累计20条
- 或5秒一次

---

## 12. 离线缓存

缓存位置：

```ts
Taro.setStorageSync(
  "track_cache",
  events
)
```

网络恢复：

```ts
Taro.onNetworkStatusChange()
```

自动重试上传。

---

## 13. 上传接口

### API

```http
POST /api/track/batch
```

### Request

```json
{
  "events":[]
}
```

### Response

```json
{
  "success": true
}
```

---

## 14. Kafka设计

Topic：

```text
track-topic
```

分区策略：

```text
hash(userId)
```

保证用户事件顺序。

---

## 15. ClickHouse表设计

```sql
CREATE TABLE events
(
  event String,
  user_id String,
  device_id String,
  page String,
  timestamp DateTime,
  properties String
)
ENGINE = MergeTree()
ORDER BY (event, timestamp);
```

---

## 16. 打卡目标App埋点规划

### 用户生命周期

```text
app_launch
register
login
logout
```

### 目标

```text
goal_create
goal_edit
goal_delete
goal_complete
```

### 打卡

```text
habit_create
habit_checkin
habit_checkin_success
habit_checkin_fail
```

### AI功能

```text
ai_chat_start
ai_plan_generate
ai_summary_generate
```

### 会员

```text
vip_popup_show
vip_popup_click
vip_pay_start
vip_pay_success
```

---

## 17. 核心漏斗

```text
注册

 ↓

创建目标

 ↓

首次打卡

 ↓

连续3天打卡

 ↓

连续7天打卡

 ↓

会员购买
```

重点分析：

- 注册转化率
- 首次打卡转化率
- 3日留存
- 7日留存
- 30日留存
- 会员转化率

---

## 18. 数据质量监控

监控内容：

### 埋点缺失

例如：

```text
下单1000次
支付成功0次
```

自动告警。

### 数据突增

例如：

```text
DAU平时1万
突然10万
```

自动告警。

### 数据延迟

例如：

```text
Kafka消息积压
```

自动告警。

---

## 19. 推荐技术栈

前端：

- Taro
- TypeScript

网关：

- NestJS

消息队列：

- Kafka

实时计算：

- Flink

分析库：

- ClickHouse

可视化：

- Grafana
- Superset

---

## 20. 最佳实践

推荐组合：

```text
自动埋点
+
声明式点击埋点
+
关键业务手动埋点
+
曝光埋点
```

避免纯全埋点。

业务关键事件必须人工定义并治理。
