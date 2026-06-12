# 发布指南

本指南将帮助你将 tracker-sdk 发布到 npm。

## 前置准备

### 1. 注册 npm 账号

如果你还没有 npm 账号，请先访问 https://www.npmjs.com/signup 注册一个账号。

### 2. 登录 npm 官方源

**重要**：发布必须登录 npm 官方源！

如果你当前使用的是淘宝镜像源（或其他镜像），请使用以下命令登录官方源：

```bash
npm login --registry=https://registry.npmjs.org/
```

输入你的用户名、密码和邮箱完成登录。

### 3. 验证登录状态

登录成功后，验证一下：

```bash
npm whoami --registry=https://registry.npmjs.org/
```

如果显示你的用户名，说明登录成功！

### 3. 检查包名可用性

在发布前，先检查你想要的包名是否已被占用：

```bash
npm view tracker-sdk-h5
npm view tracker-sdk-taro-weapp
npm view tracker-sdk-taro-alipay
```

如果显示 `404 Not Found`，说明包名可用。

## 配置包信息

在发布前，你需要修改每个包的 package.json 文件，更新以下信息：

1. **修改仓库地址**（在 `scripts/generate-sdk.mjs` 中）
2. **修改作者信息**（在 `scripts/generate-sdk.mjs` 中）

或者，你也可以直接编辑 `release/` 目录下的包文件。

## 发布步骤

### 方法一：使用自动化脚本（推荐）

```bash
# 1. 登录 npm 官方源（如果还没登录）
npm login --registry=https://registry.npmjs.org/

# 2. 运行发布脚本
npm run publish:all
```

脚本会自动：
- 检查登录状态
- 显示当前源
- 逐个发布所有包到官方源

### 方法二：手动逐个发布

#### 1. 发布 tracker-sdk-h5

```bash
cd release/tracker-sdk-h5
npm publish --registry=https://registry.npmjs.org/
```

#### 2. 发布 tracker-sdk-taro-weapp

```bash
cd ../tracker-sdk-taro-weapp
npm publish --registry=https://registry.npmjs.org/
```

#### 3. 发布 tracker-sdk-taro-alipay

```bash
cd ../tracker-sdk-taro-alipay
npm publish --registry=https://registry.npmjs.org/
```

## 发布前检查清单

- [ ] 已在 npm 官网验证包名可用
- [ ] 已更新 package.json 中的仓库地址和作者信息
- [ ] 版本号已更新（遵循语义化版本规范）
- [ ] README.md 文档已完善
- [ ] 已运行 `npm run generate:all` 重新生成最新的包
- [ ] 已登录 npm 账号

## 版本管理

### 更新版本号

在重新发布前，记得更新版本号。可以使用以下命令：

```bash
# 更新补丁版本 (0.1.0 -> 0.1.1)
npm version patch

# 更新次要版本 (0.1.0 -> 0.2.0)
npm version minor

# 更新主版本 (0.1.0 -> 1.0.0)
npm version major
```

然后重新运行 `npm run generate:all`。

## 使用已发布的包

发布成功后，其他项目可以这样安装：

```bash
# H5 版本
npm install tracker-sdk-h5

# Taro 微信小程序版本
npm install tracker-sdk-taro-weapp

# Taro 支付宝小程序版本
npm install tracker-sdk-taro-alipay
```

## 标签发布（可选）

如果你想发布测试版本，可以使用标签：

```bash
# 发布为 beta 版本
npm publish --tag beta

# 安装 beta 版本
npm install tracker-sdk-h5@beta
```

## 取消发布

如果你需要撤回已发布的包：

```bash
npm unpublish tracker-sdk-h5@0.1.0
```

**注意**：根据 npm 政策，发布后 72 小时内可以撤回，之后就不允许了。

## npm 源常用命令

### 查看当前源

```bash
npm config get registry
```

### 切换到官方源

```bash
npm config set registry https://registry.npmjs.org/
```

### 切换到淘宝镜像源（国内下载更快）

```bash
npm config set registry https://registry.npmmirror.com/
```

### 临时使用官方源（不修改全局配置）

在命令后加 `--registry` 参数即可：

```bash
npm login --registry=https://registry.npmjs.org/
npm publish --registry=https://registry.npmjs.org/
```

## 常见问题

### Q: 发布时提示 403 Forbidden - Two-factor authentication required？

A: 你的 npm 账号开启了双重验证（2FA），这是正常的安全措施。有两种解决方法：

#### 方法一：使用一次性验证码（推荐）

在发布时，npm 会提示输入 6 位验证码。打开你的验证器 App（如 Google Authenticator、Authy），输入当前显示的数字即可。

或者直接在命令中指定：

```bash
npm publish --registry=https://registry.npmjs.org/ --otp=123456
```

（把 123456 换成你验证器里的 6 位数字）

#### 方法二：使用 Automation Token

1. 访问 https://www.npmjs.com/settings/tokens
2. 点击 "Generate New Token"
3. 选择 "Automation" 类型（可以跳过 2FA）
4. 复制生成的 token
5. 使用 token 发布

```bash
# 先配置 token
npm config set //registry.npmjs.org/:_authToken=你的token

# 然后发布
npm publish --registry=https://registry.npmjs.org/
```

### Q: 发布时提示 403 Forbidden（非 2FA 原因）？
A: 可能是包名已被占用，或者你没有登录官方源。先检查包名可用性，再运行 `npm login --registry=https://registry.npmjs.org/`。

### Q: 如何更新包？
A: 修改版本号后重新运行 `npm run publish:all` 即可。

### Q: 我想使用组织名发布（如 @myorg/tracker-sdk）？
A: 修改 `scripts/generate-sdk.mjs` 中的 `packageName` 配置，加上你的组织前缀即可。

### Q: 登录后发布还是提示未登录？
A: 确认你是登录到官方源，而不是镜像源。运行 `npm whoami --registry=https://registry.npmjs.org/` 检查。
