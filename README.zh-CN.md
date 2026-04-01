# BizWise

[English](./README.md) | [简体中文](./README.zh-CN.md)

BizWise 是一个面向移动端的 AI 商务名片助手，用于采集联系人、结构化保存名片信息，并为后续商务沟通提供辅助内容。

这个仓库不是一个零配置 demo。要成功运行，你需要自行准备 MySQL 数据库、AI 模型凭证，以及 Azure Blob 容器级 SAS URL。

当前项目包含：

- 邮箱注册、登录、退出和账户设置
- 单张名片录入，支持拍照或从相册选择
- 批量名片录入与查重处理
- AI 提取姓名、公司、职位、电话、邮箱等字段
- 联系人列表、搜索、编辑、删除和详情页
- AI 生成公司摘要、公司动态、行业资讯和聊天破冰建议
- 使用 Azure Blob 存储名片图片
- 使用 MySQL 持久化用户、联系人和 AI 洞察数据

## 技术栈

- Next.js 15
- React 19
- TypeScript
- MySQL，通过 `mysql2`
- OpenAI 兼容 SDK，目前用于接入阿里百炼 / DashScope 兼容模型
- Azure Blob Storage，用于名片图片存储

## 产品范围

BizWise 适合这些场景：

- 展会、峰会、线下活动
- 交换名片后的销售跟进
- 活动现场的潜在客户采集
- 在手机上快速完成联系人归档，并补充 AI 辅助信息

当前有两种录入模式：

- 单张录入：识别一张名片，确认字段后保存
- 批量录入：一次上传或连续追加多张名片，先处理重复项，再统一保存；批量流程默认不生成 AI 洞察

## 功能说明

### 账户体系

- 邮箱密码注册与登录
- 基于签名 Cookie 的会话机制
- 个人资料更新和密码修改

### 名片录入

- 单张录入支持点击上传框后选择来源
- 批量录入支持：
  - 从相册一次选择多张图片
  - 连续拍摄并逐张追加
- 查重能力包括：
  - 当前扫描名片与现有联系人查重
  - 批量录入与现有联系人查重
  - 同一批次内部重复检查

### 联系人管理

- 联系人列表
- 按姓名或公司搜索
- 联系人详情页
- 编辑和删除
- 不同用户之间数据隔离

### AI 能力

- 从上传的名片图片中提取字段
- 在联系人详情页生成：
  - 公司摘要
  - 公司新闻 / 公开动态
  - 行业动态
  - 聊天破冰建议
  - 跟进建议

### 存储方案

- MySQL 存储用户、联系人和洞察等结构化数据
- Azure Blob 存储名片图片
- 数据库保存的是 Blob 图片 URL，而不是 base64 图片内容

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 创建环境变量文件

```bash
cp .env.example .env.local
```

### 3. 配置环境变量

BizWise 依赖外部服务。运行前请确保你已经准备好：

- 可访问的 MySQL 数据库
- AI 模型 API Key 和兼容的 Base URL
- 一个带有效容器级 SAS URL 的 Azure Blob 容器
- 一个足够强的 `AUTH_SECRET` 用于会话签名

#### AI

阿里百炼示例：

```bash
AI_API_KEY=your_bailian_key
AI_MODEL=qwen3.5-plus
AI_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
```

项目也兼容 OpenAI 风格的变量名：

```bash
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
```

#### 数据库

```bash
DB_HOST=your_mysql_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_SSL=true
```

#### 鉴权

```bash
AUTH_SECRET="generate_a_long_random_secret"
```

建议使用高强度随机字符串。生产环境下，`AUTH_SECRET` 是必填项。

你可以本地执行下面命令生成：

```bash
openssl rand -base64 48
```

#### Azure Blob Storage

```bash
AZURE_BLOB_SAS_URL="https://your-account.blob.core.windows.net/your-container?sp=...&sig=..."
```

说明：

- SAS URL 必须指向容器，而不是单个文件
- 上传由服务端完成
- 前端页面不会直接拿到带写权限的 SAS

### 4. 启动项目

开发模式：

```bash
npm run dev
```

生产预览：

```bash
npm run build
npm run start
```

默认本地地址：

- [http://localhost:3000](http://localhost:3000)

## 推荐部署方式

如果你想先本地模拟正式环境，推荐执行：

```bash
npm run build
npm run start
```

部署时请确保宿主环境里配置了这些变量：

- `AI_API_KEY`
- `AI_MODEL`
- `AI_BASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`
- `AUTH_SECRET`
- `AZURE_BLOB_SAS_URL`

部署前提：

- Node.js 20+ 运行环境
- 能访问 MySQL、AI 服务和 Azure Blob Storage 的外网连接
- 一个可读写的持久化 MySQL 数据库
- 一个具备服务端上传和删除权限的 Azure Blob 容器级 SAS URL

## 安全说明

发布或部署前，请注意：

- 不要提交 `.env` 或 `.env.local`
- 如果密钥、SAS 或密码曾在聊天、截图或测试日志中出现过，建议先轮换
- `AUTH_SECRET` 应该为每个部署环境单独配置
- Azure Blob 的 SAS 建议在调试完成后重新生成

## 项目结构

主要目录与模块：

- `app/`
  - 页面和 API 路由
- `components/`
  - 录入流程、联系人 UI、鉴权界面、查重弹窗等
- `lib/auth.ts`
  - Cookie 会话和用户鉴权逻辑
- `lib/contact-store.ts`
  - 联系人持久化和查重逻辑
- `lib/openai.ts`
  - AI 提取与 AI 洞察生成
- `lib/blob-storage.ts`
  - Azure Blob 上传、删除和读取相关逻辑
- `lib/database.ts`
  - MySQL 连接池和表结构初始化

## 当前限制

- 当前 AI 识别流程默认一张图片对应一张名片
- 批量模式保存时只写入基础联系人信息，不会同步生成 AI 洞察
- 名片图片目前通过 Azure Blob + 服务端代理读取；如果后续需要 CDN 优化，可以再增加独立分发层

## 常用脚本

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## License

本项目采用 MIT License，详见 [LICENSE](/Users/keyuliu/Desktop/Codex/vibe-web/LICENSE)。
