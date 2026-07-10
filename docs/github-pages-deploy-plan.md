# OpenScience → GitHub Pages 自动化部署方案

> 分析依据：`PROJECT_STATUS.md`（2026-07-09）、`requirements-and-acceptance.md`、`architecture-plan.md`、实际代码（`next.config.ts`、`site/package.json`、`scripts/merge-builds.js`、`.github/workflows/pages.yml`）
> 目标分支：`hybrid-refactor`
> 适用场景：纯静态托管（GitHub Pages，无 Node 服务器）

---

## 0. TL;DR（结论先行）

- 现有 `.github/workflows/pages.yml` 是 `myst init --gh-pages` 自动生成的**单 MyST** 流程，已经和当前「MyST + Next.js 双引擎」架构脱节，**必须重写**。
- 当前部署不可用的**根因**有两条：
  1. `site/package.json` 的 `build` 是原生 `next build`（SSR，需要 `next start` 起 Node 服务），GitHub Pages 跑不了 → 必须改静态导出。
  2. `next.config.ts` 的 `rewrites()` 与 `output: 'export'` **互斥**，`next build` 会直接报错 → 必须删除。
- ⚠️ **重要更正（22:24，开发反馈 + 实测验证）**：原以为「rewrites 在静态托管下全部 404、需把资产搬到 `public/` 根」。实测推翻——在 `BASE_URL=/guide/en` 下 MyST 生成的 HTML 引用的是**带前缀**路径（`/guide/en/build/_assets/...`、`/guide/en/myst-theme.css`、`/guide/en/favicon.ico`），与 `merge-builds.js` 已正确放置的 `public/guide/en/` 一一对应。**资产无需搬到根目录，rewrites 本就是死代码**。`merge-builds.js` 的**资产部分不要改**。
- 方案主线：**把站点改成静态导出（`output: 'export'`）→ 删除 rewrites → 在 merge 脚本里把 Guide 页面 clean URL 规范成带尾斜杠并生成 `slug/index.html` → 交给 GitHub Actions 自动构建部署**。

---

## 1. 架构分析

### 1.1 双引擎模型（来自 PROJECT_STATUS.md）

```
OpenScience/
├── guide/                ← MyST 内容源（两本独立书）
│   ├── en/  (myst.yml + 7 .md)   BASE_URL=/guide/en
│   └── zh/  (myst.yml + 7 .md)   BASE_URL=/guide/zh
├── site/                 ← Next.js 16 (App Router) 应用
│   └── src/app/          ← 首页 `/`、About `/about`、悬浮面板、AI Chat
├── scripts/merge-builds.js   ← 核心中间件：把两书构建产物 + 共享资产合并进 site/public/guide/
└── package.json (root)   ← dev / build / build:guide:* / merge 脚本
```

**构建链路（生产）：**
```
myst build --html (EN, BASE_URL=/guide/en)
   + myst build --html (ZH, BASE_URL=/guide/zh)
   → node scripts/merge-builds.js
   → next build  →  site/out/
```

### 1.2 核实到的「部署相关」事实

| 项 | 当前状态 | 对 GitHub Pages 的影响 |
|---|---|---|
| `next.config.ts` | `output:'export'` + `trailingSlash:true` + `images.unoptimized`；`rewrites()` 用 `NODE_ENV!=='production'` 守卫，**仅 dev 生效**，生产禁用 | ✅ **已实测**：生产构建不加 rewrites（避免与 `output:'export'` 互斥报错）；dev 模式保留 rewrites 便于本地预览 |
| `site/package.json` | `build: "next build"`（无 `output: 'export'`） | ❌ 产出的是 SSR 包，需 Node 服务；GH Pages 跑不了 |
| `scripts/merge-builds.js` | 递归把两书 `_build/html` 拷进 `public/guide/en/`、`/zh/`；共享 `/build` 与全局文件也落在 `public/guide/...` 下 | ✅ **资产放置已正确（开发反馈 + 实测）**：HTML 的 `/guide/en/...` 前缀路径与磁盘位置一一对应，不需要搬到 `public/` 根；**资产部分无需改动** |
| `.github/workflows/pages.yml` | 仅 `myst build --html --execute`（根目录）+ 部署 `_build/html`；Node 18；无 `.nojekyll`；触发 `main` | ❌ 旧单 MyST 流程：不构建 Next.js、书不在根目录、BASE_URL 错误、Node 版本过低 |
| `.gitignore` | 已排除 `site/public/guide/`、`guide/_build/`、`site/.next/`、`site/out/` | ✅ 构建产物不会误提交，CI 每次重新构建即可 |
| 本地环境 | Node v22.22.2；engines `>=20` | ✅ 用 Node 22 构建最稳 |

### 1.3 静态化必须解决的 4 个阻塞点

1. **rewrites 必须在生产环境禁用（但不是因为 404）** —— 实测 MyST 在 `BASE_URL=/guide/en` 下生成的 HTML 引用的是**带前缀**路径（`/guide/en/build/_assets/*.css`、`/guide/en/myst-theme.css`、`/guide/en/favicon.ico`），与 `merge-builds.js` 已正确放置的 `public/guide/en/` 一一对应，**资产本身不会 404，rewrites 是死代码**。真正的冲突点：`output: 'export'` 与 `rewrites()` **互斥**，`next build` 会直接报错。开发用 `NODE_ENV!=='production'` 守卫把 rewrites 限定在 dev，生产禁用 —— 既避开互斥报错，又保留本地预览能力。
2. **Next.js 是 SSR** —— `next build` 产出需 `next start`。
   → 加 `output: 'export'`，产出 `site/out/` 纯静态文件。**注意：`output: 'export'` 与 `rewrites()` 互斥**，所以生产构建必须禁用 rewrites（由 dev-only 守卫实现，而非完全删除）。
3. **clean URL / 目录索引** —— MyST 内部链接是 extensionless（如 `/guide/en/intro-en`），GitHub Pages（尤其加 `.nojekyll` 后）不会自动补 `/index.html`，会 404。
   → 用 `trailingSlash: true` + 在 merge 脚本里把 Guide 内部链接规范为带斜杠 `/guide/en/<slug>/`，让 GH Pages 用 `index.html` 提供。
4. **Jekyll 吞掉下划线目录** —— Next.js 输出 `_next/`、MyST 输出含 `_assets/`。GitHub Pages 默认跑 Jekyll，会忽略所有 `_` 前缀目录 → 全站 JS/CSS 丢失。
   → 仓库根放 **`.nojekyll`**。

> 附加：`next/image` 优化在导出模式不可用 → `images: { unoptimized: true }`（若页面用了 `next/image` 则需此项，设了无副作用）。

---

## 2. 需要做的本地代码改造（3 处，改一次即可）

### 2.1 `site/next.config.ts`

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',          // ← 静态导出到 site/out/
  trailingSlash: true,       // ← 配合 GH Pages 目录索引
  images: { unoptimized: true }, // ← 静态导出下图片不优化
};

// Guide 页 rewrites 仅用于 dev 模式。
// 生产构建（NODE_ENV==='production'）下 output:'export' 与 rewrites() 互斥会报错，
// 因此用 NODE_ENV 守卫把 rewrites 限定在 dev，生产走 trailingSlash + 目录式 index.html。
if (process.env.NODE_ENV !== 'production') {
  nextConfig.rewrites = async () => [
    { source: '/guide/en', destination: '/guide/en/index.html' },
    { source: '/guide/en/:slug', destination: '/guide/en/:slug/index.html' },
    { source: '/guide/zh', destination: '/guide/zh/index.html' },
    { source: '/guide/zh/:slug', destination: '/guide/zh/:slug/index.html' },
  ];
}

export default nextConfig;
```

### 2.2 `scripts/merge-builds.js`（资产无需改动，只补「页面 clean URL」处理）

**资产放置已正确，不要动。** 开发反馈 + 实测（在 `BASE_URL=/guide/en` 下构建，HTML 引用 `/guide/en/build/_assets/...`、`/guide/en/myst-theme.css`、`/guide/en/favicon.ico`）证明：MyST 生成的路径都带 `/guide/en/` 前缀，而 `mergeBook()` 已把整本 `_build/html` 递归拷到 `public/guide/en/`，二者一一对应。原方案「把共享资产搬到 `public/` 根」是**错误的，请勿执行**。

**真正需要改的是页面链接 / 目录索引**（与资产无关）。实测 MyST 内部页面链接是 **无尾斜杠的 clean URL**（`/guide/en/intro-en`，无 `.html`）。好在 **MyST 在 `BASE_URL=/guide/en` 下已原生输出目录式 `intro-en/index.html`**（不是扁平 `intro-en.html`），所以磁盘上无需额外生成 `slug/` 目录；只需把链接规范成带尾斜杠，即可命中已存在的 `index.html`。需在 merge 脚本里做的事：

1. **（无需）生成 `slug/index.html`** —— 实测 `guide/en/_build/html/intro-en/index.html` 已存在，MyST 原生就是目录式输出，跳过此步。
2. **链接补尾斜杠**：`fixTrailingSlashes()` 把 `__remixContext` 里的页面 `url`（`/guide/en/intro-en`）补成 `/guide/en/intro-en/`，同时把渲染后的 `<a href="/guide/en/intro-en">` 也补成带斜杠，保证浏览器直接请求的是带斜杠路径、命中 `index.html`。

> 注：Next.js 自身路由（`/`、`/about`）由 `trailingSlash: true` 自动处理；但 MyST 的 HTML 是 `public/` 里的静态文件，`trailingSlash` 不会影响它们，所以必须靠 merge 脚本兜底。图片路径（merge 放在 `public/guide/images/`）是否带 `/guide/en/` 前缀，建议在 §6 验证清单里单独 `curl` 一次确认。

### 2.3 仓库根加 `.nojekyll`

空文件即可（或见 §3 在 workflow 里 `touch site/out/.nojekyll` 后再上传）。

---

## 3. CI/CD 方案（GitHub Actions）

用下面的 `deploy.yml` **覆盖** `.github/workflows/pages.yml`（旧的已失效）。

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

# ── 触发方式（核心需求）─────────────────────────────
#   1) 自动：推送（commit/push）到 hybrid-refactor 分支即自动部署
#   2) 手动：在 Actions 面板点 "Run workflow" 随时手动触发
on:
  push:
    branches: [hybrid-refactor]   # 你当前活跃的开发分支；若要改走 main，把这里换成 main
  workflow_dispatch:              # 手动触发开关

permissions:
  contents: read
  pages: write
  id-token: write

# 只允许一个并发部署；不取消进行中的部署（避免半成品上线）
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22          # 匹配本地；满足 engines >=20（旧流程的 18.x 会跑挂 Next 16）
          cache: npm                # 缓存 npm 依赖，加速构建

      - name: Install MyST
        run: npm install -g mystmd@<PINNED_VERSION>   # 建议锁版本，防 mystmd 升级漂移

      # Step 1+2: 构建两本 MyST 书（必须带 BASE_URL）
      - name: Build MyST EN
        working-directory: ./guide/en
        run: BASE_URL=/guide/en myst build --html
      - name: Build MyST ZH
        working-directory: ./guide/zh
        run: BASE_URL=/guide/zh myst build --html

      # Step 3: 合并到 site/public（含共享资产落地到 public 根 + Guide 链接尾斜杠）
      - name: Merge builds
        run: node scripts/merge-builds.js

      # Step 4: 静态导出 Next.js
      - name: Build Next.js (static export)
        working-directory: ./site
        run: |
          npm ci
          npm run build            # 产出 site/out/

      # Step 5: 关键——禁用 Jekyll，保住 _next/ 与 _assets/
      - name: Add .nojekyll
        run: touch site/out/.nojekyll

      # Step 6: 上传并部署
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './site/out'
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

> **说明（按你的要求，本 workflow 不含测试/冒烟步骤）**：构建即部署，不做部署前 curl 校验。若以后想加回「上线前 18 路由校验」可参考 §10.3 注释。失败即整条 job 标红、不发布，安全兜底靠 `concurrency` 与可回滚的部署历史。

**可选增强（进阶，非必需）：**
- 加速：两本 MyST 构建可用 matrix 并行（节省约一半时间，见 §10.3）。
- 失败通知：在 job 末尾加 Slack/邮件 step。
- 健康检查：独立的定时 workflow 每天 curl 线上（见 §10.8），与部署解耦，不影响自动部署。

> 包管理器说明：根 `package.json` 的脚本走 `npm`（`cd site && npm install/ci`），且 `pnpm-workspace.yaml` 仅含 `site`。CI 用 npm 最稳；若想用 pnpm，需在 setup-node 之后 `npm i -g pnpm` 并把 `npm ci` 换成 `pnpm install`。

---

## 4. 仓库一次性设置

1. **Settings → Pages → Build and deployment → Source：选 `GitHub Actions`**（不要选 "Deploy from a branch"）。
2. **分支对齐**：当前活跃分支是 `hybrid-refactor`。要么把内容合并/推到 `main`，要么把 workflow 触发分支改成 `hybrid-refactor`。推荐推到 `main` 并保护 `main`。
3. （建议）给 `main` 开分支保护，部署只跑 `main`，开发在 `hybrid-refactor` PR 合入。

---

## 5. 两种托管路径（重要：先定哪种）

| 维度 | A. 自定义域名（根路径）✅ 推荐 | B. 项目子路径（github.io/OpenScience） |
|---|---|---|
| 站点根 | `https://your.domain/` | `https://wanduangwang.github.io/OpenScience/` |
| Next.js 配置 | 无需 `basePath` | `basePath: '/OpenScience'` + `assetPrefix: '/OpenScience'` |
| MyST BASE_URL | `/guide/en`、`/guide/zh` | `/OpenScience/guide/en`、`/OpenScience/guide/zh` |
| merge 脚本资产 | 落在 `public/` 即可 | 资产与链接前缀都要加 `/OpenScience` |
| 复杂度 | 低，与当前本地 dev 行为一致 | 中，需同步改 basePath + BASE_URL + 链接前缀 |

**主推 A（自定义域名）**：改动最小、与现有代码假设（首页在 `/`、Guide 在 `/guide/en`）完全一致。若暂时没有自定义域名，先用项目子路径 B 也能跑，只是要多改几处前缀。

---

## 6. 上线验证清单（18 路由 + 资源）

| 类型 | 检查项 | 预期 |
|---|---|---|
| 路由 | `/`、`/about`、`/guide/en`、`/guide/zh` 及各 7 个子页 | HTTP 200 |
| 资源 | `/guide/en/build/_assets/*.css`、`/guide/en/myst-theme.css`、`/guide/en/favicon.ico`（均带 `/guide/en/` 前缀，实测可命中） | 200 |
| 资源 | `/guide/images/team/*.png`、`/guide/images/org/*.png` | 200 |
| 功能 | Header 导航、语言下拉、右下角悬浮面板、AI Chat mock | 正常 |
| 体验 | 切换语言 / 点 Guide 子页 | 无 "Site not loading" 弹窗、无 404 |

本地冒烟可用：`npm run build && npx serve site/out`，逐个 `curl -I` 校验。

---

## 7. 风险 & 回滚

| 风险 | 缓解 |
|---|---|
| `mystmd` 版本漂移导致构建 break | 锁定 `mystmd` 版本（写入 CI 或根 package.json） |
| 构建时间偏长（双书 + Next） | 双 MyST 构建并行（matrix）；npm 缓存 |
| 静态导出不支持 ISR/SSR/API 路由 | AI Chat 真实后端必须走**外部 API**（`NEXT_PUBLIC_CHAT_API_URL`，已是预留，非 GH Pages 内部） |
| 资产 404 | 实测不会发生：MyST 前缀路径与 `merge-builds.js` 放置位置一致；若个别资源 404，先查是否漏了 `.nojekyll`（见下）或图片前缀问题 |
| 部署失败 | Actions 标红即知；**回滚 = 重新部署上一 commit 的 artifact**（GH Pages 保留部署历史，可 Re-run 旧成功部署） |

---

## 8. 备选：Vercel

若不想改 rewrites/做静态化，可直接上 **Vercel**——它原生支持 `rewrites()` 与 SSR，几乎零改造（`PROJECT_STATUS.md` 也已列为选项）。但既然明确要 GitHub Pages，本方案以 GH Pages 为主线。

---

## 9. 建议实施顺序

1. 改 `site/next.config.ts`（加 `output:'export'`/`trailingSlash`/`images.unoptimized`，删 `rewrites`）
2. 改 `scripts/merge-builds.js`：**不要搬资产**（已正确）；只补「页面 clean URL」处理——生成 `slug/index.html` + 链接补尾斜杠（详见 §2.2）
3. 加 `.nojekyll`
4. 本地 `npm run build` → `npx serve site/out` 验证 18 路由
5. 写 `deploy.yml`（覆盖旧 `pages.yml`）
6. 仓库开 Pages（GitHub Actions），推 `main`
7. 看 Actions 跑通，按 §6 验证线上

---

## 10. GitHub Actions 深入分析与最佳实践（CI/CD 专题）

> 本章在 §3 基础 workflow 之上，针对「用 GitHub Actions 自动化部署」做专项补充：现有 `pages.yml` 为何失效、生产级增强 workflow、分支/密钥策略、CI 专属排错、回滚、可观测性。

### 10.1 现有 `.github/workflows/pages.yml` 逐条失效分析

| 行 | 现有写法 | 对照当前架构的问题 |
|---|---|---|
| `myst build --html --execute`（根目录） | 仓库根**没有 `myst.yml`**（书在 `guide/en`、`guide/zh`） | 构建失败或构建出空站；且用了 `--execute`（需 Python+Jupyter），当前书无代码单元，纯属拖慢+引入失败点 |
| `path: './_build/html'` | 旧单书输出；现结构是 `guide/en/_build/html` + `guide/zh/_build/html`，**且完全没构建 `site/`** | 即使跑通，上线后 `/`、`/about`、`/guide/*` 全 404（没有 Next.js 站壳，也没有 merge） |
| `node-version: 18.x` | Next 16 + `engines: ">=20"` | `site` 里 `npm ci` / `next build` 直接失败 |
| 无 `.nojekyll` | GitHub Pages 默认跑 Jekyll | 会吞掉 `_next/` 与 `_assets/`，全站 JS/CSS 丢失 |
| `BASE_URL=/OpenScience` | 书实际在 `/guide/en`、`/guide/zh` | 所有 Guide 链接 404 |
| `branches: [main]` | 当前活跃分支是 `hybrid-refactor` | 推到 `hybrid-refactor` 时**根本不触发** |

**结论：这个文件是重构前的遗留物，必须删除/覆盖，不能修修补补复用。**

### 10.2 推荐 workflow 的逐步骤解读（为什么这样写）

- `permissions: contents:read / pages:write / id-token:write`：GitHub Pages 部署用 **OIDC**（`id-token:write`）做无密钥身份验证；`pages:write` 是 `deploy-pages` 写部署的必要权限。`contents:read` 仅够 checkout。
- `concurrency.group: pages / cancel-in-progress:false`：**不取消进行中的部署**，避免「旧的还没传完新的又覆盖」导致半成品上线。多提交排队串行，最安全。
- `environment: github-pages` + `url: ${{ steps.deployment.outputs.page_url }}`：在 Actions 面板直接给出线上地址，也方便后续做环境门禁。
- `mystmd` 全局安装建议**锁版本**：未锁版本时某次 `mystmd` 升级可能静默改变输出结构 → merge 脚本或链接 404。推荐显式 `mystmd@<version>`，或更好：把 `mystmd` 写进根 `package.json` 的 `devDependencies` 并用 `npx mystmd`（可被 Dependabot 管）。
- 两个 `BASE_URL` 构建 + `merge` + `next build`（静态导出） + `touch .nojekyll` + 上传部署：**顺序不可乱**（先有 MyST 产物，merge 才有东西合并，Next 才能把 `public/guide/` 拷进 `out/`）。

### 10.3 生产级增强版 workflow（覆盖 §3 基础版）

在基础版上做了两件事（**不含测试/冒烟**，按你的要求）：**双 MyST 书矩阵并行**（省约一半 CI 时间）、**npm 缓存**。矩阵把两本 MyST 的构建拆成并行 job，产物用 artifact 传递，最后统一 merge + 静态导出 + 部署。两种方式触发一致：`push` 自动 + `workflow_dispatch` 手动。

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [hybrid-refactor]   # 自动：推送到该分支即部署
  workflow_dispatch:              # 手动：Actions 面板 Run workflow

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  # --- 并行构建两本 MyST 书 ---
  myst:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        book: [en, zh]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install MyST (pinned)
        run: npm install -g mystmd@<PINNED_VERSION>   # 锁版本，防漂移
      - name: Build MyST ${{ matrix.book }}
        working-directory: ./guide/${{ matrix.book }}
        run: BASE_URL=/guide/${{ matrix.book }} myst build --html
      - name: Upload book artifact
        uses: actions/upload-artifact@v4
        with:
          name: myst-${{ matrix.book }}
          path: ./guide/${{ matrix.book }}/_build/html
          if-no-files-found: error

  # --- 合并 + Next.js 静态导出 + 部署 ---
  build-and-deploy:
    needs: myst
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Download MyST builds
        uses: actions/download-artifact@v4
        with:
          path: ./_myst_artifacts

      - name: Stage MyST output
        run: |
          mkdir -p guide/en/_build/html guide/zh/_build/html
          cp -r _myst_artifacts/myst-en/. guide/en/_build/html/
          cp -r _myst_artifacts/myst-zh/. guide/zh/_build/html/

      - name: Merge builds
        run: node scripts/merge-builds.js

      - name: Build Next.js (static export)
        working-directory: ./site
        run: |
          npm ci
          npm run build

      - name: Disable Jekyll
        run: touch site/out/.nojekyll

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './site/out'
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

> 矩阵版只在「两本 MyST 并行」上有收益；逻辑与 §3 单 job 版完全一致。**两个版本都不含测试步骤**——构建失败则整条 job 标红、不发布，靠 `concurrency` 与可回滚的部署历史兜底。

### 10.4 触发与分支策略（你的核心需求）

- **自动触发（提交即部署）**：`on.push.branches: [hybrid-refactor]` —— 你向该分支 `git push` 后，GitHub 自动跑 workflow 并发布。无需任何手动操作。
- **手动触发（Actions 面板）**：`on.workflow_dispatch:` —— 在仓库 **Actions → Deploy to GitHub Pages → Run workflow** 里可随时手动点一次部署（可选分支/填参数，本 workflow 无输入参数，直接 Run 即可）。
- **分支选择**：当前活跃分支就是 `hybrid-refactor`，所以触发分支直接写成它，做到「我提交就部署」。如果以后你合并到 `main` 并想只在 `main` 部署，把 `branches:` 改成 `[main]` 即可（一行改动）。
- **不要**让部署同时监听 `main` 与 `hybrid-refactor` 两个开发分支的推送——否则半成品会直接上线。保持「单一部署分支」最稳。
- **PR 预览（进阶）**：GitHub Pages 只有一个环境，原生不支持 PR 预览。如需预览，可选 Netlify 预览或第二个 Pages 环境（较繁琐），本期不建议。

### 10.5 Secrets 与后端对接

- **现状（mock）**：AI Chat 是前端 mock，**不需要任何密钥**，仓库保持 `public` 即可。
- **将来接真实后端**：把 `NEXT_PUBLIC_CHAT_API_URL` 设为 **仓库 / 环境 Secrets**。注意它是 `NEXT_PUBLIC_` 前缀 = **构建期注入**，必须出现在 `next build` 那一步（在 `site` 目录下 `npm run build` 前 export）。改这个值需要重新构建（静态站点无运行时配置）。
- **切勿**把密钥写进 rewrite 或 commit 进 `guide/`、`site/`。

### 10.6 CI 专属故障排查清单

| 现象 | 根因 | 修复 |
|---|---|---|
| `next build` 报 `Rewrites are not supported with output: 'export'` | `next.config.ts` 还有 `rewrites()` | 按 §2.1 删除 rewrites（与 export 互斥）；**不要**改成资产落地，资产本就正确 |
| 部署后 `/guide/en/build/*`、`/guide/en/myst-theme.css` 404 | 极少见：漏了 `.nojekyll` 或 MyST 未带 `BASE_URL` 构建 | 确认 `BASE_URL=/guide/en` 构建 + `touch site/out/.nojekyll` |
| Guide 子页 `/guide/en/intro-en` 404（无尾斜杠） | merge 脚本未生成 `slug/index.html` 或链接未补斜杠 | 按 §2.2 在 merge 里生成 `index.html` 并把链接补成 `/guide/en/intro-en/` |
| 全站 JS/CSS 失效、页面无样式 | **缺 `.nojekyll`**，Jekyll 吞掉 `_next/`、`_assets/` | 加 `.nojekyll` |
| Guide 子页 404 | 链接无尾斜杠 / `BASE_URL` 错 | `trailingSlash:true` + merge 改写链接 + 正确 `BASE_URL` |
| MyST 构建莫名失败 / 产物结构变化 | `mystmd` 版本漂移 | 锁版本（CI 显式 `@<ver>` 或根 devDeps） |
| `site` 构建报 engine 错 | Node 版本太低 | CI 用 `node-version: 22`（与本地一致） |
| 矩阵 job 找不到 artifact | artifact 名/路径不匹配 | 检查 `upload-artifact` 与 `download-artifact` 的 `name` 一致 |

### 10.7 回滚操作

- GitHub Pages 在 Actions 里保留**部署历史**：进某次成功的 `Deploy` job → `Re-run` 即可把旧版重新上线（artifact 是完整静态包，回滚 = 重新部署旧 commit）。
- 或推送一个 revert commit 触发新部署。
- 因为每次都是全量 artifact，不存在「部分回滚」，最稳妥。

### 10.8 可观测性（轻量，符合「部署即带监控」原则）

GitHub Pages 本身无 uptime 监控。可加一个 **定时健康检查 workflow**，每天 curl 18 路由，失败自动开 Issue 告警（自愈闭环的第一步）：

```yaml
# .github/workflows/health-check.yml
name: Site Health Check
on:
  schedule:
    - cron: '17 2 * * *'     # 每天 UTC 02:17
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check routes
        run: |
          BASE=https://wanduangwang.github.io/OpenScience   # 改成你的地址/自定义域名
          for p in / /about /guide/en /guide/zh /guide/en/intro-en /guide/zh/intro-zh; do
            code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$p")
            echo "$p -> $code"
            [ "$code" = "200" ] || exit 1
          done
      - name: Open issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner, repo: context.repo.repo,
              title: '🚨 站点健康检查失败',
              body: 'GitHub Pages 健康检查未通过，请查看运行日志。'
            })
```

---

---

## 11. 本次更新说明（2026-07-09 22:17）

按你的要求，GitHub Actions 部分已聚焦为「**只写 workflow、不含测试**」：

- **自动触发**：`on.push.branches: [hybrid-refactor]` —— 提交即部署。
- **手动触发**：`on.workflow_dispatch:` —— Actions 面板可随时 Run workflow。
- **移除了冒烟测试（serve + curl 校验）**：不在 CI 里做测试步骤；构建失败则整条 job 标红、不发布，回滚靠部署历史。
- **已实际生成** `.github/workflows/deploy.yml`（见仓库），并**删除**了失效的旧 `.github/workflows/pages.yml`，避免两个 workflow 同时触发冲突。

> **现在就能用吗？** 还不能——`deploy.yml` 已写好（§3 / §10.3），但它依赖两处本地代码改造才能真正跑通：
> 1. `next.config.ts` 改 `output:'export'` + `trailingSlash` + `images.unoptimized`，**删掉 rewrites**（互斥）；
> 2. `merge-builds.js` **只补页面 clean URL 处理（生成 `slug/index.html` + 链接补尾斜杠）**——**资产部分不要动**（开发已确认 + 实测验证，搬资产是错误方向）；
> 3. `.nojekyll`（workflow 里已 `touch site/out/.nojekyll`，可保留）。
> 改完推上去，或 Actions 面板手动 Run，即自动部署。

### 待你确认/执行的前置改造（已按开发反馈更正）
1. 改 `site/next.config.ts`（加 `output:'export'`/`trailingSlash`/`images.unoptimized`，**删 rewrites**）
2. 改 `scripts/merge-builds.js`：**仅补页面 clean URL**（生成 `slug/index.html` + 链接尾斜杠）；**资产部分保持不动**
3. `.nojekyll`（已在 workflow 内处理，无需额外文件）
4. 仓库 Settings → Pages → Source 选 `GitHub Actions`

改完任意一次 push 到 `hybrid-refactor`，或 Actions 面板手动 Run，即可上线。

---

## 12. 开发反馈更正记录（2026-07-09 22:24）

开发 AI 反馈（已实测验证，结论成立）：

> 「MyST 页面使用 `/build/_assets/*.css`、`/myst-theme.css` 等裸路径，提议把共享资产复制到 public/ 根目录。但实际上，在 `BASE_URL=/guide/en` 构建下，所有路径都是 `/guide/en/build/_assets/*.css`、`/guide/en/myst-theme.css`——都带 `/guide/en/` 前缀。当前 `merge-builds.js` 已经正确地把文件放在 `public/guide/en/` 下，静态导出后自然可访问，不需要搬资产。」

**验证方式**：本地 `myst build --html`（BASE_URL=/guide/en），检查 `guide/en/_build/html/index.html` 的 `<link>/<script>`：
- `href="/guide/en/build/_assets/app-*.css"`、`href="/guide/en/myst-theme.css"`、`href="/guide/en/favicon.ico"` ✅ 全部带前缀
- 内部页面链接 `href="/guide/en/intro-en"`（无尾斜杠、无 `.html`）⚠️ 这是静态化真正要处理的点

**对方案的影响**：
- ❌ 删除原 §2.2「把共享资产复制到 public/ 根」的要求（错误方向）。
- ✅ `merge-builds.js` 的资产复制逻辑保持不变。
- ✅ 唯一需要的脚本改动：`fixRemixContextUrls()` 补页面链接尾斜杠 + 生成 `slug/index.html`（§2.2）。
- ✅ rewrites 仍要删，但原因是「与 `output:'export'` 互斥」而非「404」。
- ✅ `.nojekyll` 依旧必需——MyST 资产目录是 `_assets/`、`_shared/`（下划线前缀），Jekyll 会吞掉它们。

---

## 13. basePath 修复记录（2026-07-10 部署后 console 404）

部署后控制台大量 404，全部是向 **根路径** `wanduangwang.github.io/_next/...`、`/favicon.ico` 请求（实际站点在 `/OpenScience/` 子路径下）。根因：GitHub Pages 项目页必须用 `basePath: '/OpenScience'`，而当时 `next.config.ts` 缺此配置，MyST 静态 HTML 与 Next 资源也未按子路径前缀化。

### 根因分层
1. **Next.js 自身资源**（`/_next/...`、`/favicon.ico`）：缺 `basePath` → 加 `basePath: '/OpenScience'`（仅 `NODE_ENV==='production'` 生效，dev 留根路径）。
2. **MyST 静态 HTML**（在 `public/`，basePath 不改写其内链接）：`addBasePath()` 给 `/guide/` 引用补 `/OpenScience` 前缀。
   - 实测发现存在**第三本 MyST 书** `guide/myst.yml`（BASE_URL 为空），生成无语言前缀页面 `about/`、`intro/`、`ch1-mof-basics/` 等，其引用是**裸根路径** `/build/...`、`/myst-theme.css`、`/favicon.ico`。`addBasePath()` 已扩展为遍历整棵 `public/guide/` 树，并对 root 书页面先把裸根路径补 `/guide/`、再统一补 `/OpenScience`。
   - 注：CI 的 `deploy.yml` 当前只构建 en/zh 两本（root 书未构建、merge 也未拷贝），故部署产物不含 root 页面。root 书内部路由（`/about` vs `/guide/about`）仍有错配，属另一问题，未纳入本次修复。
3. **Next 应用 `about` 页**：硬编码 `<img src="/guide/images/...">`（plain `<img>`，basePath 不改写）→ 改为 `${process.env.NEXT_PUBLIC_BASE_PATH}/guide/images/...`，并在 `deploy.yml` 的 build 步骤注入 `NEXT_PUBLIC_BASE_PATH: /OpenScience`。
4. **首页 CTA 的 `<Link>`**：client component 内 `<Link>` 静态导出时渲染出**未前缀化**的 `href="/guide/en/intro-en"`（Header 的 `<Link>` 因布局预渲染正常）。改为 plain `<a>` + 显式 `basePath + href`，彻底规避 `<Link>` 双前缀/漏前缀歧义。

### 验证
本地 `ADD_BASE_PATH=1 NODE_ENV=production NEXT_PUBLIC_BASE_PATH=/OpenScience` 全链构建后，`out/` 全站扫描**无任何未前缀化的** `/_next/`、`/guide/`、`/build/`、`/myst-theme`、`/favicon` 引用；`/` `/about/` `/guide/en/` `/guide/zh/` `/guide/en/intro-en/` 及关键资源本地 serve 均 200。
