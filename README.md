# BizWise MVP

BizWise 是一个移动端优先的 AI 商务名片助手。当前仓库是 MVP 骨架，覆盖以下主流程：

- 落地页与产品介绍
- 注册/登录页面骨架
- 手机拍照或上传名片
- 邮箱注册登录与登录态
- 名片字段识别接口
- 联系人列表与详情页
- 个人中心、资料修改、密码修改
- 联系人搜索、编辑、删除
- AI 行业动态、公司摘要和聊天破冰建议展示

## 技术栈

- Next.js 15
- React 19
- TypeScript
- OpenAI Node SDK（兼容阿里百炼 OpenAI-compatible 接口）

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env.local
```

推荐直接使用阿里百炼配置：

```bash
AI_API_KEY=你的百炼 API Key
AI_MODEL=qwen3.5-plus
AI_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
```

项目也兼容原来的 OpenAI 风格变量名：

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=...
OPENAI_BASE_URL=...
```

不要把真实 key 提交到仓库。

数据库配置示例：

```bash
DB_HOST=kk-mysql-dify.mysql.database.azure.com
DB_PORT=3306
DB_NAME=bizwise
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_SSL=true
```

认证配置示例：

```bash
AUTH_SECRET=please_change_this_to_a_long_random_secret
```

Azure Blob 对象存储示例：

```bash
AZURE_BLOB_SAS_URL=https://your-account.blob.core.windows.net/your-container?sp=...&sig=...
```

名片图片上传说明：

- 服务端会使用 `AZURE_BLOB_SAS_URL` 把名片图片上传到 Azure Blob
- 数据库只保存 Blob URL，不再保存 base64 图片
- 旧的数据库 base64 图片仍然兼容显示
- 如果使用私有容器，页面展示图片时会由服务端自动拼接 SAS 查询参数

3. 启动开发环境

```bash
npm run dev
```

默认访问地址：

- [http://localhost:3000](http://localhost:3000)

## 当前实现说明

- `app/api/scan/route.ts`
  - 已封装名片识别接口
  - 无 AI key 或调用失败时回退到 mock 结果

- `app/api/contacts/[id]/insights/route.ts`
  - 已封装 AI 洞察接口
  - 无 AI key 或调用失败时回退到 mock 结果

- `app/api/contacts/route.ts`
  - 已切到数据库仓储；无数据库配置时回退到 mock

- `lib/database.ts`
  - 自动初始化 `contacts` 和 `contact_insights` 表

- `lib/blob-storage.ts`
  - 负责 Azure Blob 上传、删除和展示 URL 处理

- `app/api/auth/*`
  - 已接入邮箱注册、登录、退出
  - 登录态通过服务端签名 cookie 维护

## 下一步建议

- 接入真实鉴权系统
- 接入数据库和对象存储
- 将联系人列表/详情切到服务端数据
- 优化移动端拍照裁剪和识别准确率
