# OpenScience 混合架构改造方案

> 方案日期：2026-07-07
> 目标：MyST 保留书的内容创作，Next.js 接管非书页面，设计系统统一两者

---

## 一、核心理念

```
┌─────────────────────────────────────┐
│     Next.js App Shell               │
│  /home, /about, /projects, /team    │  ← 自定义前端，灵活可控
├─────────────────────────────────────┤
│     MyST Book at /guide/*           │  ← 保持原生，内容创作者零学习成本
├─────────────────────────────────────┤
│     Shared Design System            │  ← CSS 自定义属性统一视觉
└─────────────────────────────────────┘
```

**为什么不是全量迁移到 Next.js？**

MyST 对"写书"场景有独特优势：
- Markdown 创作门槛极低
- 可执行 Python code-cell（Jupyter 生态）
- 成熟的 book-theme 排版引擎
- LaTeX 公式、交叉引用、目录自动生成

如果硬迁移到 MDX，会丢失 code-cell 执行能力，得不偿失。

**为什么不用纯 MyST？**

你的原话就是答案——"非 book 的部分有开发限制"。MyST 的 book-theme 是博客/文档风格，做不了：
- 动态交互页面（知识图谱、3D 分子查看器）
- AI 集成（LLM 问答、语义搜索）
- 复杂布局（dashboard、项目画廊）
- 前端状态管理 / 客户端交互

---

## 二、技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | **Next.js 15 (App Router)** | SSG/SSR 双模，静态导出兼容 GitHub Pages |
| 样式方案 | **Tailwind CSS v4 + CSS 自定义属性** | 原子化 CSS + 设计 token 统一 |
| UI 组件 | **shadcn/ui** | 无障碍、可定制、与 Tailwind 原生整合 |
| 内容管理 | **MyST Markdown** (保持) | 保留 code-cell，创作零迁移成本 |
| 部署 | **GitHub Actions → GitHub Pages** 或 **Vercel** | 零成本起步，Vercel 体验更优 |
| 包管理 | **pnpm** (workspace monorepo) | 管理多个子项目 |

---

## 三、目录结构设计

```
openscience/
├── .github/workflows/
│   └── deploy.yml              # 统一 CI/CD
├── site/                       # ← Next.js 应用
│   ├── app/
│   │   ├── page.tsx            # 首页（替换 index.md）
│   │   ├── about/
│   │   ├── projects/
│   │   ├── team/
│   │   └── guide/
│   │       └── [[...path]]/
│   │           └── page.tsx    # 代理到 MyST 静态输出
│   ├── components/
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   ├── ui/                 # shadcn/ui 组件
│   │   └── features/           # AI 搜索、知识图谱等
│   ├── lib/
│   │   └── design-tokens.ts    # 与 MyST 共享的设计 token
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
├── guide/                      # ← MyST 项目（完全保持原样）
│   ├── myst.yml                # 修改：baseUrl = /guide
│   ├── index.md
│   ├── intro.md
│   ├── en/
│   ├── zh/
│   ├── images/
│   ├── data/
│   └── css/
├── public/                     # 共享静态资源
│   ├── fonts/
│   └── images/
├── package.json                # monorepo root
├── pnpm-workspace.yaml
└── README.md
```

---

## 四、URL 路由设计

| URL | 托管方 | 内容来源 |
|-----|--------|---------|
| `/` | Next.js | 首页（重新设计） |
| `/about` | Next.js | 团队介绍（重新设计） |
| `/projects` | Next.js | 项目画廊（重新设计） |
| `/team` | Next.js | 团队成员（重新设计） |
| `/guide` | Next.js → 代理 | MyST 构建输出 |
| `/guide/en/*` | Next.js → 代理 | MyST 构建输出 |
| `/guide/zh/*` | Next.js → 代理 | MyST 构建输出 |
| `/blog` | Next.js | 未来可加 |
| `/search` | Next.js | 未来可加 |

**路由代理机制：**
Next.js 的 `next.config.ts` 中配置 rewrite，或者在构建时直接将 MyST 的 `_build/html` 复制到 `site/public/guide/`，由 Next.js 作为静态文件 serve。

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',  // 静态导出
  // 可选方案 A：用 rewrites 代理（需要 server）
  // async rewrites() {
  //   return [{ source: '/guide/:path*', destination: '/guide-static/:path*' }]
  // },
}
```

更简单的做法：构建时把 MyST 输出直接拷贝到 Next.js 的 `public/guide/` 目录，Next.js 的 `output: 'export'` 会自动包含这些静态文件。

---

## 五、视觉一致性方案（关键难点）

### 5.1 提取设计 token

从 MyST book-theme 和现有 `footer.css` 中提取：

```css
/* design-tokens.css — 被 Next.js 和 MyST 共同引用 */
:root {
  /* Brand */
  --color-brand: #013243;
  --color-brand-light: #1a5063;
  --color-brand-dark: #002030;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Source Serif 4', Georgia, serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* MyST book-theme mirrors */
  --color-link: #1a73e8;
  --color-link-hover: #1557b0;
  --color-bg: #ffffff;
  --color-text: #1a1a1a;

  /* Spacing */
  --space-unit: 4px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### 5.2 共享 Header 和 Footer

在 MyST 端，通过 `myst.yml` 的 `site.parts` 注入自定义的 header/footer HTML：

```yaml
# myst.yml（修改后）
site:
  template: book-theme
  parts:
    header: shared-header.html    # ← 注入与 Next.js 相同的导航栏
    footer: shared-footer.html    # ← 注入与 Next.js 相同的页脚
```

`shared-header.html` 和 Next.js 的 Header 组件使用同一套 CSS token，保证用户切换页面时视觉无缝衔接。

### 5.3 字体同步

Next.js 使用 `next/font` 加载 Inter（标题/导航）和 Source Serif 4（正文），MyST 端通过 `@import` 或 CSS 引用同一字体 CDN：

```css
/* 在 MyST 的自定义 CSS 中 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Source+Serif+4:wght@400;600&display=swap');
```

---

## 六、CI/CD 构建流程

```yaml
# .github/workflows/deploy.yml
name: Hybrid Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Step 1: Build MyST book
      - name: Build MyST
        working-directory: ./guide
        run: |
          npm install -g mystmd
          myst build --html --execute
          # 输出到 guide/_build/html/

      # Step 2: Build Next.js site
      - name: Build Next.js
        working-directory: ./site
        run: |
          npm ci
          npm run build
          # 输出到 site/out/

      # Step 3: Merge — 将 MyST 输出合并到 Next.js 输出
      - name: Merge MyST into Next.js output
        run: |
          mkdir -p site/out/guide
          cp -r guide/_build/html/* site/out/guide/
          # 确保根目录也需要 MyST 的输出

      # Step 4: Deploy
      - name: Deploy to GitHub Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: './site/out'
      - uses: actions/deploy-pages@v4
```

关键点：
- 构建顺序：先 MyST，后 Next.js
- 合并策略：MyST 输出整体复制到 `site/out/guide/`
- 单次部署，单域名，零跨域问题

---

## 七、改造后解锁的自定义功能

### 7.1 AI 语义搜索（高优先级）
- 跨所有子项目（General Chemistry、Quantum Mechanics 等）的全文搜索
- 向量 Embedding + 关键词混合检索
- 结果按学科分类、高亮匹配片段

### 7.2 LLM 问答助手
- 悬浮在每页右下角的聊天 widget
- 用户提问，LLM 基于当前页面内容 + 相关知识库回答
- 引用来源链接，支持追问

### 7.3 知识图谱可视化
- 以 MOF 为中心，展示关联概念网络（有机化学、表征方法、机器学习）
- 交互式力导向图，点击节点跳转到对应页面
- 用 D3.js / Cytoscape.js 实现

### 7.4 项目画廊优化
- 现有项目卡片（General Chemistry、AI for Science 等）升级为动态画廊
- 每个项目展示：封面、简介、贡献者、最后更新
- 可筛选、可排序、支持按学科浏览

### 7.5 交互式 3D 分子查看器
- 现有 `data/MOF-5.pdb` 和 `data/NHC-2D.cif` 可用 3D 渲染
- 用 Mol* 或 NGL Viewer 在页面内嵌查看器
- 用户可旋转、缩放、切换渲染模式

### 7.6 暗色模式
- CSS 变量驱动，一键切换
- 与 MyST book-theme 的暗色模式同步

### 7.7 分析面板
- 接入 Plausible / Umami（隐私友好型分析）
- 追踪最受欢迎的内容、用户来源、搜索热词

---

## 八、分阶段实施路线

### Phase 1：基础设施搭建（1-2 天）
- [ ] 初始化 pnpm monorepo
- [ ] 搭建 Next.js 项目 (App Router + Tailwind + shadcn/ui)
- [ ] 提取设计 token，建立共享 CSS
- [ ] 配置 CI/CD 合并构建流程
- [ ] 验证本地 `myst build` + `next build` 可以正常合并

### Phase 2：核心页面替换（2-3 天）
- [ ] **首页**：在 Next.js 中重建，保留原版视觉风格但使用 React 组件
- [ ] **About 页**：团队介绍页面，支持动态成员编辑
- [ ] **项目画廊**：动态卡片网格，从数据配置文件读取
- [ ] **Footer + Header**：共享组件，同时注入到 MyST

### Phase 3：MyST 集成（1 天）
- [ ] 修改 `myst.yml`（baseUrl → `/guide`，注入共享 Header/Footer）
- [ ] 验证 `/guide/*` 路由在 Next.js 中正确代理
- [ ] 统一导航栏高亮状态（在 Guide 页面时自动高亮）

### Phase 4：自定义功能（按优先级选择）
- [ ] AI 语义搜索 + LLM 问答助手
- [ ] 知识图谱可视化
- [ ] 3D 分子查看器
- [ ] 暗色模式

### Phase 5：优化与上线（持续）
- [ ] 性能优化（Lighthouse ≥ 90）
- [ ] 可访问性审计（WCAG 2.1 AA）
- [ ] SEO 配置（sitemap、meta、OG）
- [ ] 图片 WebP 迁移
- [ ] 废弃文件清理

---

## 九、风险与权衡

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| MyST 版本更新可能 break 构建 | 中 | 锁定 `mystmd` 版本到 `package.json` |
| 共享 Header/Footer 在 MyST 端渲染差异 | 低 | 用纯 HTML + CSS 注入，不使用 React |
| 构建时间变长（两个构建串联） | 低 | CI 并行化两个构建步骤 |
| content creator 需要理解构建流程 | 低 | Guide 内容依然只写 Markdown，不影响 |
| 两个代码库的心智负担 | 中 | Monorepo 统一管理，清晰的目录约定 |

---

## 十、总结

这条路径的核心哲学是 **"让对的工具做对的事"**：

- **MyST 管"书"**：内容创作者写 Markdown + code-cell，零学习成本
- **Next.js 管"站"**：首页、About、项目画廊、自定义交互功能
- **设计系统做"胶水"**：CSS 自定义属性 + 共享组件，确保视觉一致

改造后你获得的自由：
1. 任意自定义非书页面的布局和交互
2. 集成 AI、搜索、可视化等现代 web 功能
3. 标准 React 组件生态（shadcn/ui 等 200+ 组件随意用）
4. 暗色模式、响应式、可访问性等开箱即用
5. 与 MyST 书内容在同一域名下无缝衔接
