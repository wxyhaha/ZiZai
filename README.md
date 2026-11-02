# 字在 ZiZai

> 中文字体与纸上排版体验。

一个专注于中文字形欣赏、古典文学阅读与排版体验的网站。全站只有两个一级页面：
**首页**（单屏品牌入口与动态落字）与 **赏字**（可调字体、文稿、版式的阅读书页）。
字体图鉴、古文选集、版式、题写、收藏等能力一律通过抽屉、浮层与局部模式承载，
不新增页面。

## 技术栈

| 项 | 选择 | 说明 |
|---|---|---|
| 框架 | Vue 3.5 + `<script setup>` | 组合式 API |
| 构建 | Vite 8 | |
| 语言 | TypeScript（`strict`） | |
| 路由 | Vue Router 4 | 两条一级路由 + 404 |
| 无障碍组件 | Reka UI 2 | 无样式 Dialog / Popover 等，视觉完全自绘 |
| 样式 | CSS 变量 + SCSS | 令牌集中在 `src/styles/tokens.scss` |
| 图标 | lucide-vue-next | 轻量线性图标 |
| 测试 | Vitest + @vue/test-utils + happy-dom | |

未引入 Pinia：导航弹层、阅读参数、字体加载与收藏使用 composable 管理共享状态。
当前规模暂不需要额外状态库，最初取舍见 `docs/decisions.md` ADR-003。

## 环境要求

- Node.js ≥ 20（开发时使用 v24）
- npm ≥ 10
- Python 3.10+（仅在**重新生成字体子集**时需要，依赖 `fonttools` 与 `brotli`）

## 快速开始

```bash
npm install
npm run dev        # 开发服务器，默认 http://localhost:5173
```

## 常用命令

```bash
npm run dev         # 开发服务器
npm run build       # 类型检查 + 生产构建 → dist/
npm run preview     # 预览构建产物
npm run typecheck   # 仅类型检查
npm run test        # 单元测试（一次性）
npm run test:watch  # 单元测试（监听）
npm run lint        # ESLint
npm run lint:fix    # ESLint 自动修复
npm run fonts:build # 重新生成字体子集（需要先准备字体源文件）
npm run fonts:home  # 从实际 cmap 生成首页落字子集与覆盖清单
```

## 目录结构

```text
zizai/
├── docs/                       # 全部交接文档（见下表）
│   └── design-reference/       # 用户提供的原始设计资料，只读
├── public/                     # favicon 等静态资源
├── scripts/
│   ├── build-font-subsets.py   # 生成赏字字体子集 + @font-face 样式
│   ├── build-home-glyph-fonts.py # 生成首页专用落字子集
│   └── font-subset-report.json # 上次生成的缺字报告
├── src/
│   ├── assets/fonts/           # 自托管字体（均为开源/公有领域，见 font-licenses.md）
│   │   ├── brand/              # 首屏展示子集（汇文明朝体）
│   │   ├── home/               # 首页四款随机落字子集（每款 1,200 汉字）
│   │   ├── huawen-mingchao/    # 默认正文（子集 + 现有 GB2312 范围字体）
│   │   ├── lxgw-wenkai/        # 楷体正文（子集 + 现有 GB2312 范围字体）
│   │   ├── zhuque-fangsong/    # 仿宋正文（子集 + 现有 GB2312 范围字体）
│   │   └── noto-serif-sc/      # 宋体兜底（子集 + 现有 GB2312 范围字体）
│   ├── components/
│   │   ├── SiteHeader.vue      # 品牌 + 主导航
│   │   ├── home/               # FallingGlyphs 落字动画
│   │   ├── shell/MoreMenu.vue  # 「···」关于弹层
│   │   └── studio/             # 赏字面板、分页书页与工具轨
│   ├── composables/            # 阅读状态、字体按需加载、收藏持久化、动效偏好
│   ├── data/                   # 字体目录、古文目录、字体覆盖表与首页字池
│   ├── router/
│   ├── styles/                 # tokens / global / 字体 @font-face
│   ├── types/                  # FontEntry / TextEntry / ReadingState
│   ├── views/                  # HomeView / ReadingView / NotFoundView
│   ├── App.vue
│   └── main.ts
└── tests/                      # Vitest 单元测试
```

## 文档索引

| 文件 | 内容 |
|---|---|
| `docs/implementation-plan.md` | 阶段划分、任务状态、验收标准 |
| `docs/decisions.md` | 架构 / 依赖 / 设计的取舍与理由（16 条 ADR） |
| `docs/progress.md` | 按次记录的修改、验证命令与结果、遗留问题 |
| `docs/design-system.md` | 落地后的设计规范：色值、字体、间距、组件、响应式 |
| `docs/font-licenses.md` | 每款字体的作者、来源、授权、分发权限、核对日期 |
| `docs/handoff.md` | 下一位开发者 / AI 的交接说明 |
| `docs/issues.md` | 2026-11-02 审查发现的问题、验证程度与开发耗时分析要点（待修复） |

## 当前进度

**赏字页已完成书页化与分页改版；后续开发与验收以 PC Web 为目标**：

- ✅ 独立工程、类型检查、ESLint、单元测试（本轮 7 文件 / 95 项）、生产构建全部通过
- ✅ 设计系统（纸纹、色值、极简边框、响应式断点）
- ✅ 首页：隐藏标题栏与导航，单屏保留宣纸纹理、中央标题与入口、减少动效降级
- ✅ 首页落字：四款真实字体，每款 1,000 个 GB2312 一级字加 200 个长尾字，运行时按 90% / 10% 概率取字；字池共有 3,479 个不同汉字，标准宽屏 PC 下渲染 70 个节点并分配至 6–8 条不同速度的防重叠字道，字号限制在 42–64px
- ✅ 赏字页：短文单页、长文双页展开，横排 / 竖排均按字体与排版参数重新分页；提供简洁页码与翻页控制
- ✅ 辅助面板：字体图鉴、古文选集、统一版式面板、自定文字题写、本地收藏笺（localStorage）；对照功能已移除
- ✅ 六篇内置作品均记录公开来源并标注全文状态；《项脊轩志》《前赤壁赋》《岳阳楼记》按全文补齐，《定风波》收录序文
- ✅ 缺字按需加载机制：输入生僻字实时检测，一键拉取 GB2312 完整字体
- ⏳ 阶段 D 余项（更多古籍版式模板，如对联、册页、题签）
- ⏳ 真实浏览器视觉验收与 Playwright 核心路径覆盖

详细状态与下一步见 `docs/handoff.md`。

**已确认、待实现的字体要求**：全量 WOFF2 应保留原字体全部字符、字形及原有排版与可变轴能力。目前 `*-full.woff2` 仍为 GB2312 范围版本，尚未按新要求转换。首页随机落字使用独立的性能子集，不代表完整字体，也不改变全量转换要求；见 `docs/issues.md`。

## 字体授权

站内四款自托管字体均已核实授权，允许随站分发：

- **汇文明朝体 Huiwen Mincho** — CC0 1.0 Universal / Public Domain（默认主字体）
- **霞鹜文楷 LXGW WenKai** — SIL Open Font License 1.1 — © LXGW
- **朱雀仿宋 Zhuque Fangsong** — SIL Open Font License 1.1 — © 浙江稷米科技
- **思源宋体 Noto Serif SC** — SIL Open Font License 1.1 — © Google / Adobe

完整授权核查依据见 `docs/font-licenses.md`。

## 许可

本站代码与内容为项目内部开发版本，尚未声明开源许可。
字体文件遵循各自的授权条款，不随代码许可一并授权。
