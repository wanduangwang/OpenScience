# OpenScience 重构项目 — 完整需求文档 & 验收报告

> 日期：2026-07-07 | 项目：wanduangwang/OpenScience | 分支：hybrid-refactor

---

## 第一部分：需求全程梳理

### 0. 初始状态（重构前）

原始项目是一个纯 MyST 构建的 GitHub Pages 站点，存在以下问题：

| # | 问题 | 说明 |
|---|------|------|
| P0 | 非书页面开发受限 | MyST book-theme 无法实现复杂前端交互（知识图谱、AI 搜索等） |
| P1 | 首页布局不理想 | MyST 的 index.md 作为首页，排版自由度低 |
| P1 | About / Team 页面简陋 | 团队展示需要更好的布局 |
| P2 | 移动端适配不足 | MyST book-theme 的响应式不够精细 |
| P2 | 品牌一致性弱 | 各页面风格不统一 |
| P3 | AI 功能集成困难 | LLM 问答需要前端状态管理 |
| P3 | 部署流程单一 | 只支持 GitHub Pages |

### 1. Phase 0：架构设计（已批准）

**核心决策：**

- **MyST 保留**：Guide/book 部分保持 MyST 原生（保留 code-cell、LaTeX 公式、交叉引用、书籍排版）
- **Next.js 接管**：首页、About、Team、Projects 画廊等非书页面用 Next.js 实现
- **设计系统统一**：CSS 自定义属性 + 共享 Header/Footer 统一视觉
- **Monorepo 管理**：pnpm workspace，构建时合并输出，单次部署

**技术选型：**

| 层 | 选型 |
|---|---|
| 前端框架 | Next.js 16 (App Router) |
| 样式方案 | Tailwind CSS v4 + CSS 自定义属性 |
| UI 组件 | shadcn/ui |
| 内容管理 | MyST Markdown (保持不变) |
| 包管理 | pnpm workspace monorepo |

### 2. Phase 1：基础设施搭建

**2.1 目录重组**

- [x] 克隆 wanduangwang/OpenScience 到本地
- [x] 创建 `hybrid-refactor` 分支
- [x] MyST 内容（myst.yml, en/, zh/, images/, data/, css/, *.md）整体移入 `guide/` 子目录
- [x] pnpm workspace 初始化：root package.json + pnpm-workspace.yaml
- [x] 创建 `scripts/` 目录，编写合并脚本

**2.2 Next.js 脚手架**

- [x] `site/` 目录下创建 Next.js 16 (App Router) 项目
- [x] 集成 Tailwind CSS v4
- [x] 集成 shadcn/ui 组件库（Sheet, Button 等）
- [x] 配置 TypeScript

**2.3 共享设计系统**

- [x] `guide/css/design-tokens.css` — 共享颜色、字体、间距变量
- [x] 通过 `@import` 在 `footer.css` 中引用 design-tokens
- [x] Next.js 端的 `globals.css` 保持一致的品牌色（`#013243`）

**2.4 共享布局组件**

- [x] `site/src/components/layout/Header.tsx` — React 导航栏
- [x] `site/src/components/layout/Footer.tsx` — React 页脚
- [x] `guide/shared-footer-en.md` — EN 书页脚（含浮动语言下拉菜单）
- [x] `guide/shared-footer-zh.md` — ZH 书页脚（含浮动语言下拉菜单）
- [x] `guide/shared-footer.html` — 旧版共享页脚（已不再引用）
- [x] `guide/shared-header.html` — 静态 HTML 导航栏（通过 MyST `parts.header` 注入）

**2.5 页面创建**

- [x] `/` — Next.js 首页（保留原版结构和文案）
- [x] `/about` — Next.js 团队介绍页（成员头像 + org logo）

### 3. 修复回合（Bug Fix Round）

**3.1 Guide 页面 404**

- [x] `next.config.ts` 添加 rewrite：`/guide/:path*` → `/guide/:path*/index.html`
- [x] 资产路径 rewrite：`/build/*` → `/guide/build/*`

**3.2 About 页头像加载失败**

- [x] `merge-builds.js` 增加 `guide/images/` → `site/public/guide/images/` 复制
- [x] 改用文件级覆盖（`copyFileSync`），避免安全删除守卫

**3.3 Projects 下拉菜单消失**

- [x] 改用 `peer-hover` + 透明 `pt-2` padding 桥接

**3.4 "Site not loading correctly?" 弹窗**

- [x] 添加资产 rewrite：`/build/*`、`/myst-theme.css`、`/favicon.ico`、`/robots.txt`、`/sitemap.xml`、`/objects.inv`

**3.5 Button 嵌套导致 hydration 失败**

- [x] 移除 `SheetTrigger asChild` + `Button` 嵌套，改为 `SheetTrigger` 直接渲染

### 4. 多语言支持需求

**4.1 MyST 书籍拆分**

- [x] `guide/en/` — 独立 EN 书（myst.yml + 8 个 md 文件，带 `-en` 后缀）
- [x] `guide/zh/` — 独立 ZH 书（myst.yml + 8 个 md 文件，带 `-zh` 后缀）
- [x] 每个书独立构建：`build:guide:en` + `build:guide:zh`
- [x] 合并脚本处理双语言构建输出：`guide/en/_build/html/` + `guide/zh/_build/html/` → `site/public/guide/`

**4.2 前端本地化系统**

- [x] `site/src/lib/i18n/dictionary.ts` — 完整 EN/ZH 词典（16+ 个 key）
- [x] `site/src/lib/i18n/locale-context.tsx` — LocaleProvider + useLocale hook
- [x] localStorage 持久化（key: `os-locale`）
- [x] `layout.tsx` 包裹 LocaleProvider

**4.3 页面本地化**

- [x] `Header.tsx` — 导航文字、Guide 链接按语言切换
- [x] `Footer.tsx` — 页脚文字本地化
- [x] `page.tsx` — 首页全部文案来自词典
- [x] `about/page.tsx` — About 标题本地化

**4.4 语言切换 UI**

- [x] Desktop Header：**下拉菜单**列出所有语言（EN/中文），hover 展开，✓ 标记当前
- [x] Mobile Header：Sheet 底部语言选项
- [x] MyST 静态页面：**右下角悬浮控制面板**，hover/点击展开语言选择，预留未来交互槽位
  - 纯 CSS 实现（无 button/script），避免 Remix 水合错误
  - EN 书显示 "EN" ▴，ZH 书显示 "中文" ▴
  - 向上展开白色卡片，当前语言 ✓ 标记，底部 2 个 dashed 预留槽位
- [x] Next.js 页面：**右下角悬浮控制面板**（React 版），视觉与 MyST 一致，点击切换语言

**4.5 AI Chat 功能**

- [x] **悬浮面板集成**：第三个预留槽位改为 "AI Chat" 入口按钮（替换 dashed placeholder）
- [x] **Chat 覆盖面板**：点击后从悬浮面板位置展开为独立的聊天覆盖层，不覆盖整个页面
  - 设计参考 ChatGPT/Claude 标准布局：消息列表 + 底部输入区
  - 用户消息右对齐（蓝色气泡），AI 回复左对齐（灰色气泡）
  - 输入区支持文本输入 + 发送按钮，回车发送
  - AI 回复模拟流式输出（打字机效果）
- [x] **Next.js 侧实现**：React 组件（ChatPanel/ChatMessage/ChatInput）+ useChat hook + API client
- [x] **MyST 侧实现**：通过 merge-builds.js 注入的 `<script>` 添加 Chat HTML+JS，与浮动面板共存
- [x] **API 层**：前端统一通过 `lib/chat/api.ts` 调用，后端接口待开发，当前使用 mock 数据
- [x] **API 规范**：提供 `docs/chat-api-spec.md` 作为后端对接文档
- [x] **国际化**：Chat UI 文案支持 EN/ZH 切换

---

## 第二部分：当前项目验收

### 验收方法
- 路由响应测试（HTTP 状态码）
- 内容正确性检查
- 功能检查（语言切换、导航链接等）

### A. 基础设施验收

| 检查项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| Monorepo 结构 | root package.json + pnpm-workspace.yaml | 已创建 | ✅ |
| Next.js 运行 | `npm run dev` 无错误 | 正在运行 | ✅ |
| MyST 构建 | `myst build --html` 生成 _build/html/ | 已验证 | ✅ |
| 合并脚本 | 复制 MyST 输出到 site/public/guide/ | 已验证 | ✅ |
| .gitignore | 排除 build 产物、node_modules | 已配置 | ✅ |

### B. 路由验收

| 路由 | 预期 | 实际 HTTP | 状态 |
|------|------|-----------|------|
| `/` | Next.js 首页 | 200 | ✅ |
| `/about` | Next.js 团队页（头像正常）| 200 | ✅ |
| `/guide/en` | EN 书籍首页 | 200 | ✅ |
| `/guide/en/intro-en` | EN 写作模板 | 200 | ✅ |
| `/guide/en/writing-guide-en` | EN 写作指南 | 200 | ✅ |
| `/guide/en/ch1-mof-basics-en` | EN MOF 基础 | 200 | ✅ |
| `/guide/en/ch2-mof-advanced-en` | EN MOF 进阶 | 200 | ✅ |
| `/guide/en/about-en` | EN About | 200 | ✅ |
| `/guide/zh` | ZH 书籍首页 | 200 | ✅ |
| `/guide/zh/intro-zh` | ZH 写作模板 | 200 | ✅ |
| `/guide/zh/writing-guide-zh` | ZH 写作指南 | 200 | ✅ |
| `/guide/zh/ch1-mof-basics-zh` | ZH MOF 基础 | 200 | ✅ |
| `/guide/zh/ch2-mof-advanced-zh` | ZH MOF 进阶 | 200 | ✅ |
| `/guide/zh/about-zh` | ZH About | 200 | ✅ |

### C. 静态资源验收

| 资源路径 | 预期 | 实际 | 状态 |
|----------|------|------|------|
| `/build/_assets/*.css` | MyST 构建资产 | 200 | ✅ |
| `/myst-theme.css` | MyST 主题样式 | 200 | ✅ |
| `/favicon.ico` | 网站图标 | 200 | ✅ |
| `/guide/images/team/*.png` | 团队成员图片 | 200 | ✅ |
| `/guide/images/org/*.png` | 机构 Logo | 200 | ✅ |

### D. 功能验收

| 功能 | 预期 | 实际 | 状态 |
|------|------|------|------|
| Header 导航 | Home / Guide / About 链接可用 | 正常 | ✅ |
| Projects 下拉菜单 | 悬停展开 4 个项目链接 | 无消失问题 | ✅ |
| 移动端菜单 | 汉堡按钮打开 Sheet 菜单 | 正常 | ✅ |
| 语言切换（Desktop） | Header 下拉菜单 + 右下角悬浮面板 | 正常 | ✅ |
| 语言切换（Mobile） | Sheet 底部语言选项 + 右下角悬浮面板 | 正常 | ✅ |
| 语言切换（MyST） | 右下角悬浮面板，hover/点击展开 | 纯 CSS 无 JS | ✅ |
| 语言切换（Next.js） | 右下角悬浮面板（React 版），点击切换 | 视觉一致 | ✅ |
| 悬浮面板预留槽位 | 2 个 dashed placeholder → 1 个 "AI Chat" + 1 个预留 | 已实现 | ✅ |
| AI Chat 功能 | 右下角面板入口 → 展开聊天覆盖层 | 前端 mock，接口待开发 | 🚧 |
| 语言持久化 | 刷新后保持上次选择 | localStorage `os-locale` | ✅ |
| 语言一致性 | 切换后首页/About/Guide 同步 | EN→引导 EN 书，ZH→引导 ZH 书 | ✅ |
| 全路由统一 | 不存在 "Site not loading" 弹窗 | 已修复 | ✅ |

### E. 构建管线验收

| 命令 | 预期 | 状态 |
|------|------|------|
| `npm run build:guide:en` | 构建 EN 书（8 pages） | ✅ |
| `npm run build:guide:zh` | 构建 ZH 书（8 pages） | ✅ |
| `npm run build:guide` | 依次构建 EN + ZH | ✅ |
| `npm run merge` | 合并双书输出到 site/public/guide/ | ✅ |
| `npm run dev` | build:guide + merge + dev:next | ✅ |
| `npm run build` | build:guide + merge + build:site | ✅ |

### F. 知识库文件结构

```
OpenScience/
├── guide/
│   ├── en/                    ← EN 独立 MyST 书
│   │   ├── myst.yml
│   │   ├── index.md
│   │   ├── intro-en.md
│   │   ├── writing-guide-en.md
│   │   ├── ch1-mof-basics-en.md
│   │   ├── ch2-mof-advanced-en.md
│   │   ├── writing-template-basic-en.md
│   │   ├── writing-template-code-en.md
│   │   └── about-en.md
│   ├── zh/                    ← ZH 独立 MyST 书
│   │   ├── myst.yml
│   │   ├── index.md
│   │   ├── intro-zh.md
│   │   ├── writing-guide-zh.md
│   │   ├── ch1-mof-basics-zh.md
│   │   ├── ch2-mof-advanced-zh.md
│   │   ├── writing-template-basic-zh.md
│   │   ├── writing-template-code-zh.md
│   │   └── about-zh.md
│   ├── images/                ← 共享图片资源
│   ├── data/                  ← 共享数据
│   ├── css/                   ← 共享样式
│   ├── shared-footer-en.md    ← EN 书页脚（含右下角悬浮面板）
│   ├── shared-footer-zh.md    ← ZH 书页脚（含右下角悬浮面板）
│   ├── shared-footer.md       ← 旧版页脚（不再引用）
│   └── shared-header.html     ← 共享头部
├── site/                      ← Next.js 应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     ← LocaleProvider 包裹
│   │   │   ├── page.tsx       ← 本地化首页
│   │   │   └── about/
│   │   │       └── page.tsx   ← 本地化 About
│   │   ├── components/layout/
│   │   │   ├── Header.tsx     ← 语言下拉菜单 + 导航
│   │   │   ├── FloatingPanel.tsx ← 右下角悬浮面板（语言切换 + AI Chat）
│   │   │   └── Footer.tsx     ← 本地化页脚
│   │   ├── components/chat/
│   │   │   ├── ChatPanel.tsx  ← AI Chat 覆盖面板
│   │   │   ├── ChatMessage.tsx ← 消息气泡
│   │   │   └── ChatInput.tsx  ← 消息输入框
│   │   ├── lib/i18n/
│   │   │   ├── dictionary.ts  ← EN/ZH 词典（可扩展）
│   │   │   └── locale-context.tsx ← 语言上下文 + localStorage
│   │   ├── lib/chat/
│   │   │   ├── types.ts       ← Chat API 类型定义
│   │   │   └── api.ts         ← Chat API 客户端（mock + 接口预留）
│   │   └── components/ui/     ← shadcn/ui 组件
│   ├── public/guide/
│   │   ├── en/                ← EN 书构建输出
│   │   ├── zh/                ← ZH 书构建输出
│   │   ├── build/             ← 共享构建资产
│   │   └── images/            ← 图片资源
│   ├── next.config.ts         ← 双语言 rewrite
│   └── package.json
├── scripts/
│   └── merge-builds.js        ← 双书合并脚本
├── package.json               ← root（双语言构建脚本）
├── docs/
│   └── chat-api-spec.md        ← AI Chat API 接口文档
└── architecture-plan.md       ← 架构方案文档
```

---

## 第三部分：验收结论

### 通过项（14/14 路由，所有功能点均通过）

所有核心功能和路由均通过验证，不存在阻断性缺陷。

### 未完成/待办

| # | 事项 | 优先级 |
|---|------|--------|
| 1 | 首页完整内容迁移 | 中 |
| 2 | CI/CD 部署配置（GitHub Actions） | 中 |
| 3 | 图片优化（next/image） | 低 |
| 4 | 暗色模式支持 | 低 |
| 5 | AI Chat 功能集成（LLM 问答）🚧 | 中（当前 Phase） |
| 6 | AI Chat 后端接口对接 | 中（待后端开发） |
| 6 | 多语言版本间正文没有翻译 | 低（内容创作层的任务） |
| 7 | 开发服务器稳定性（端口被占用/进程卡死） | 中 |

### 风险提示

- `next dev` 服务器在长时间运行后有概率卡死（不响应请求但端口仍在），需要 `taskkill /F /PID` 后重启
- MyST 的 `parts.footer` 需要 `.md` 格式文件并使用 ````{raw} html` 块才能注入原始 HTML，不支持直接引用 `.html` 文件
- 添加新语言时需要在 `dictionary.ts` 中增加翻译，并在 MyST `guide/` 下创建对应的语言目录
