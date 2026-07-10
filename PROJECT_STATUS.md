# OpenScience 项目现状说明书

> 面向：项目管理工程师 / DevOps 工程师  
> 最后更新：2026-07-09  
> 分支：`hybrid-refactor`

---

## 一、项目概述

OpenScience 是一个混合架构的开源知识站点。  
**MyST Markdown** 负责书籍/指南内容创作，**Next.js** 负责非书页面（首页、About）和交互功能（AI Chat、语言切换、悬浮控制面板）。

| 维度 | 详情 |
|------|------|
| 仓库 | wanduangwang/OpenScience |
| 当前分支 | `hybrid-refactor` |
| 前端框架 | Next.js 16 (App Router) + React 19 |
| 样式方案 | Tailwind CSS v4 + CSS 自定义属性 |
| UI 组件 | shadcn/ui + 自研组件 |
| 内容管理 | MyST Markdown (mystmd) |
| 包管理 | pnpm (单项目，非严格 monorepo) |
| 运行时 | Node.js >= 20 |

---

## 二、目录结构（截至 2026-07-09）

```
OpenScience/
├── guide/                      ← MyST 内容源
│   ├── en/                     ← 英文独立书 (myst.yml + 7 .md)
│   │   ├── myst.yml
│   │   ├── index.md
│   │   ├── intro-en.md
│   │   ├── writing-guide-en.md
│   │   ├── ch1-mof-basics-en.md
│   │   ├── ch2-mof-advanced-en.md
│   │   ├── writing-template-basic-en.md
│   │   ├── writing-template-code-en.md
│   │   └── about-en.md         ← 存在但已从 TOC 移除
│   ├── zh/                     ← 中文独立书 (同样结构)
│   ├── images/                 ← 共享图片资源
│   ├── css/
│   │   ├── footer.css          ← 浮动面板 + 页脚样式
│   │   └── design-tokens.css   ← 品牌色、字体等设计 token
│   ├── shared-footer-en.md     ← EN 页脚（纯文字）
│   ├── shared-footer-zh.md     ← ZH 页脚（纯文字）
│   ├── primary-sidebar-footer.md
│   └── shared-header.html      ← 旧头部（已不再引用）
│
├── site/                       ← Next.js 应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      ← LocaleProvider 包裹
│   │   │   ├── page.tsx        ← 本地化首页
│   │   │   └── about/
│   │   │       └── page.tsx    ← 本地化 About
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── FloatingPanel.tsx  ← 右下角：语言切换 + AI Chat
│   │   │   │   └── Footer.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatPanel.tsx   ← 聊天覆盖面板
│   │   │   │   ├── ChatMessage.tsx ← 消息气泡
│   │   │   │   └── ChatInput.tsx   ← 消息输入框
│   │   │   └── ui/             ← shadcn/ui 组件
│   │   └── lib/
│   │       ├── i18n/
│   │       │   ├── dictionary.ts      ← EN/ZH 词典
│   │       │   └── locale-context.tsx  ← 语言上下文 + localStorage
│   │       └── chat/
│   │           ├── types.ts           ← Chat API 类型定义
│   │           └── api.ts             ← Chat API 客户端（mock + 真实接口预留）
│   ├── public/
│   │   └── guide/              ← MyST 构建输出（被 .gitignore 排除）
│   │       ├── en/             ← EN 书 HTML
│   │       ├── zh/             ← ZH 书 HTML
│   │       ├── build/          ← 共享构建资产（CSS/JS）
│   │       └── images/         ← 图片资源
│   ├── next.config.ts          ← rewrite 配置
│   └── package.json
│
├── scripts/
│   └── merge-builds.js         ← 核心合并脚本（构建后处理 + 注入）
├── docs/
│   └── chat-api-spec.md        ← AI Chat API 接口文档
├── requirements-and-acceptance.md  ← 需求文档 & 验收报告
├── architecture-plan.md         ← 架构方案文档
└── package.json                ← root（构建脚本）
```

---

## 三、构建管线

### 3.1 本地开发

```bash
npm run dev
```

等效于顺序执行：
1. `myst build --html`（guide/en + guide/zh）
2. `node scripts/merge-builds.js`（合并到 site/public/guide/）
3. `next dev`（启动开发服务器）

### 3.2 生产构建

```bash
npm run build
```

等效于：
1. `myst build --html`（用 BASE_URL=/guide/en 和 BASE_URL=/guide/zh）
2. `node scripts/merge-builds.js`
3. `next build`

### 3.3 merge-builds.js 做了什么

合并脚本是多书架构的核心，按顺序执行：

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 复制 EN 书 | `guide/en/_build/html/` → `site/public/guide/en/` |
| 2 | 复制 ZH 书 | `guide/zh/_build/html/` → `site/public/guide/zh/` |
| 3 | 合并构建资产 | 两本书的 `/build/*` 合并到 `site/public/guide/build/` |
| 4 | 复制全局文件 | `myst-theme.css`、`favicon.ico`、`robots.txt` 等 |
| 5 | 复制图片 | `guide/images/` → `site/public/guide/images/` |
| 6 | 复制 design-tokens.css | 到 en/、zh/ 和 guide 根目录 |
| 7 | 复制 thebe-core.min.js | 修复 Thebe 加载路径 |
| 8 | **抑制 hydration 错误** | 注入 script 过滤 React #418/#423 错误 |
| 9 | **移除侧栏项目标题** | 从 `__remixContext` JSON 删除 index.md 条目 |
| 10 | **修复 Remix URLs** | 将所有 `/intro-en` 纠正为 `/guide/en/intro-en` |
| 11 | **第二次 TOC 清理** | 确保标题完全清除 |
| 12 | **注入浮动面板 + AI Chat** | 为 MyST 页面注入纯 HTML/CSS/JS 的右下角面板 |

### 3.4 关键构建参数

- **MyST 构建必须设置 `BASE_URL`**：`BASE_URL=/guide/en` 和 `BASE_URL=/guide/zh`
- **不设置 BASE_URL 会导致**：侧栏 TOC 链接指向 `/intro-en`（404）
- Next.js 通过 `next.config.ts` 的 `rewrites` 将 `/guide/en/*` 映射到 `site/public/guide/en/*`

---

## 四、URL 路由表

| 路由 | 类型 | 内容来源 |
|------|------|---------|
| `/` | Next.js | `site/src/app/page.tsx` |
| `/about` | Next.js | `site/src/app/about/page.tsx` |
| `/guide/en` | MyST (rewrite) | `guide/en/index.md` |
| `/guide/en/intro-en` | MyST (rewrite) | `guide/en/intro-en.md` |
| `/guide/en/writing-guide-en` | MyST (rewrite) | `guide/en/writing-guide-en.md` |
| `/guide/en/ch1-mof-basics-en` | MyST (rewrite) | `guide/en/ch1-mof-basics-en.md` |
| `/guide/en/ch2-mof-advanced-en` | MyST (rewrite) | `guide/en/ch2-mof-advanced-en.md` |
| `/guide/en/writing-template-basic-en` | MyST (rewrite) | `guide/en/writing-template-basic-en.md` |
| `/guide/en/writing-template-code-en` | MyST (rewrite) | `guide/en/writing-template-code-en.md` |
| `/guide/zh/...` | MyST (rewrite) | 中文版对应文件 |
| `/myst-theme.css` | Rewrite | `site/public/guide/myst-theme.css` |
| `/build/*` | Rewrite | `site/public/guide/build/*` |
| `/favicon.ico` | Rewrite | `site/public/guide/favicon.ico` |

---

## 五、核心功能状态

### 5.1 ✅ 已完成

- **混合架构**：Next.js + MyST 双引擎，构建时合并
- **设计系统**：设计 token CSS 变量共享
- **多语言**：EN/ZH 双书 + 前端 i18n（字典 + 上下文 + localStorage 持久化）
- **语言切换 UI**：Header 下拉菜单 + 右下角悬浮面板（Next.js React 版 + MyST 纯 HTML 版）
- **AI Chat 前端**：React 组件（ChatPanel/ChatMessage/ChatInput）+ MyST 纯 JS 版本
- **Mock API 层**：流式 SSE 模拟 + 真实后端接口预留
- **API 规范**：`docs/chat-api-spec.md`
- **路由修复**：BASE_URL + merge 脚本保证 18 路由全 200
- **侧栏清理**：移除 about 链接、项目标题链接
- **悬浮面板 retry 机制**：200ms 心跳重试 3 秒，防止 React 重渲染移除

### 5.2 🚧 进行中

- **AI Chat 前端**：已完成前端 UI + Mock API，等待后端接口对接

### 5.3 📋 待办

| 优先级 | 事项 | 备注 |
|--------|------|------|
| 高 | CI/CD 部署配置 | GitHub Actions + GitHub Pages 或 Vercel |
| 中 | 首页完整内容迁移 | 当前为精简版 |
| 中 | AI Chat 后端接口对接 | 对接后端 LLM 服务 |
| 低 | 图片优化 (next/image) | WebP 迁移 |
| 低 | 暗色模式 | CSS 变量已预留 |
| 低 | 废弃文件清理 | 旧 header/footer 等 |

---

## 六、已知问题 & 注意事项

### 6.1 开发环境

1. **next dev 不稳定**：长时间运行后可能卡死（端口占但不响应），需要 `taskkill /F /PID` 后重启
2. **MyST build 端口占用**：myst build 可能启动临时 dev server 占用 3000 端口，需杀掉再重启
3. **缓存问题**：修改 `footer.css` 后需清除 `site/.next` 并重启（`rm -rf site/.next`）
4. **首次启动慢**：需先 `cd site && npm install`，之后用 `npm run dev`

### 6.2 MyST 侧限制

1. **Remix hydration 错误**：MyST 内部组件（theme toggle）触发 React #418/#423，已通过 script 抑制
2. **浮动面板在 MyST 侧**：用 `<script>` 注入 + 200ms 重试保证不被 React 重渲染移除
3. **parts.footer**：只接受 `.md` 格式文件，不接受 `.html`

### 6.3 构建注意事项

1. **必须设置 BASE_URL**：构建 MyST 时必须设置 `BASE_URL=/guide/en` 和 `BASE_URL=/guide/zh`
2. **merge-builds.js 的 copyIfMissing 已废弃**：全局文件现在始终覆盖
3. **两本书有独立 index.html**：都通过 merge 脚本注入浮动面板

---

## 七、CI/CD 需求

### 7.1 推荐部署流程

```yaml
# .github/workflows/deploy.yml
jobs:
  build-and-deploy:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }

      # Install MyST
      - run: npm install -g mystmd

      # Build MyST books with BASE_URL
      - run: cd guide/en && BASE_URL=/guide/en myst build --html
      - run: cd guide/zh && BASE_URL=/guide/zh myst build --html

      # Merge
      - run: node scripts/merge-builds.js

      # Build Next.js
      - working-directory: ./site
        run: |
          npm ci
          npm run build
          # output: site/out/

      # Deploy to GitHub Pages / Vercel
      - uses: actions/upload-pages-artifact@v3
        with: { path: './site/out' }
      - uses: actions/deploy-pages@v4
```

### 7.2 环境变量

| 变量 | 用途 | 当前值 |
|------|------|--------|
| `NEXT_PUBLIC_CHAT_API_URL` | AI Chat 后端地址 | 未设置（使用 mock） |
| `BASE_URL`（构建时） | MyST 生成正确 URL 前缀 | `/guide/en` / `/guide/zh` |

### 7.3 .gitignore 关键配置

```
# 必须排除构建输出
site/public/guide/en/
site/public/guide/zh/
site/public/guide/build/
site/.next/
guide/*/_build/
```

---

## 八、团队协作指引

### 8.1 内容创作者（写 Guide 内容）

- 只操作 `guide/en/` 和 `guide/zh/` 目录下的 `.md` 文件
- 文件名必须带 `-en` 或 `-zh` 后缀（如 `intro-en.md`）
- 修改后执行 `npm run dev` 即可预览
- **不需要理解 Next.js、构建管线或脚本**

### 8.2 前端开发者

- Next.js 页面在 `site/src/app/` 下
- 共享组件在 `site/src/components/` 下
- 修改 MyST 共享样式在 `guide/css/` 下
- 修改构建逻辑在 `scripts/merge-builds.js` 中

### 8.3 DevOps 工程师

- 构建命令定义在 root `package.json` 中
- 合并脚本是核心中间件，见上表
- 部署需要确保 BASE_URL 环境变量正确传递
- 首次部署后验证 18 路由全部 200

---

## 九、文件变更记录

| 日期 | 变更 | 涉及文件 |
|------|------|---------|
| 07-07 | 初始架构搭建 | 目录重组、Next.js 脚手架、merge-builds.js |
| 07-07 | 多语言支持 | 双书拆分、dictionary.ts、locale-context |
| 07-07 | 语言切换 UI | FloatingPanel.tsx、shared-footer-*.md |
| 07-09 | 多项 Bug 修复 | myst-theme.css 缓存、TOC 404、hydration 错误 |
| 07-09 | 侧栏清理 | 移除 about、项目标题链接 |
| 07-09 | AI Chat 功能 | ChatPanel/ChatMessage/ChatInput + MyST 纯 JS 版 |
| 07-09 | 注入稳定性 | 200ms 心跳重试机制 |
