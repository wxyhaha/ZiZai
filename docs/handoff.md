# 交接说明

> 给下一位接手「字在 ZiZai」的开发者 / AI。
> 先读这一份、`docs/issues.md` 与 `docs/implementation-plan.md`，再按讨论确定的范围继续开发。
>
> 最后更新：2026-11-03（核心阅读正确性、古籍标点禁则与端到端自动化重构）

> 2026-11-03 状态补充：
> 1. 核心阅读重构完成：建立 `pageTurnPlan.ts` 纯函数领域模型，规范横排 LTR 与古籍竖排 RTL（线装书右开本）的双页物理槽位映射（横排左1右2向右翻掀右，竖排右1左2向右翻掀左）；
> 2. 中文避头尾禁则（Kinsoku Shori）完备实现，杜绝标点孤悬行首与列首；动态题头测量精确扣除空间，正文彻底免除截断风险；
> 3. 3D 卷纸动效精简切片并解耦叶子节点透明度，阻断样式重算级联，稳定 60fps；
> 4. 全站 14 份 WOFF2 字体资产完成合规性审计并建立自动化防护；六篇内置古文底本校勘详见 `docs/text-sources.md`；
> 5. 引入 Playwright Chromium 真实浏览器端到端测试（`npm run test:e2e`），覆盖槽位映射、动效生命周期、竖排禁则与键盘作用域。

> 赏字状态：短文显示单页，长文分页后以双页展开；字体、文稿、横竖排、字号、行高、字距、版心宽度和视口变化都会重新分页。六篇内置作品已登记权威底本校勘并标注全文状态；字体、选集、版式、题写与收藏入口保留，对照功能按规范删除。正文绝不使用滚动条。

---

## 一、三十秒了解这个项目

**字在（ZiZai）** —— 中文字体与纸上排版体验网站。
视觉是现代极简 + 传统中文书籍美学。

**只有两个一级页面**：
- `/` 首页：100dvh 单屏品牌入口（纸纹 + 四款真实字体的随机落字 +「字在」标题 +「入字间」CTA）
- `/studio` 赏字：一张可调字体 / 文稿 / 版式的阅读书页

字体图鉴、古文选集、版式、题写、收藏**全部**通过抽屉 / 浮层 / 局部模式承载。
**永远不要为它们新建一级路由。**

---

## 二、如何运行

```bash
cd zizai
npm install
npm run dev          # http://localhost:5173
```

验证五联（提交前必须全绿）：

```bash
npm run typecheck    # 0 error
npm run lint         # 0 error / 0 warning
npm run test         # 118 项单元/组件测试全绿 (以 docs/progress.md 为准)
npm run test:e2e     # 5 项 Playwright Chromium 端到端真实浏览器测试全绿
npm run build        # ✓ built (761ms 极速生产打包)
```

提交前执行完整五联；开发过程中按改动范围先跑定向检查。

> 只有重新生成字体资源时才需要 Python 3.10+ 与 `fonttools` / `brotli`；首页单独使用 `npm run fonts:home`。
> 日常开发、构建、测试都不依赖 Python。

---

## 三、代码地图（按你可能的任务顺序）

| 你想改… | 去这个文件 |
|---|---|
| 颜色 / 字号 / 间距 / 动效曲线 | `src/styles/tokens.scss`（**唯一真相来源**） |
| 首页布局与主视觉 | `src/views/HomeView.vue` |
| 落字动画与随机逻辑 | `src/composables/useFallingGlyphs.ts` + `src/components/home/FallingGlyphs.vue` |
| 首页真实 cmap 字池 | `src/data/home-glyph-pools.json`（生成文件） |
| 首页专用字体子集 | `src/assets/fonts/home/`（生成文件，每款 1,200 汉字） |
| 首页字体覆盖 CSS | `src/styles/fonts/home-glyphs.scss`（生成文件） |
| 页头与导航 | `src/components/SiteHeader.vue` |
| 「···」关于弹层 | `src/components/shell/MoreMenu.vue`（Reka UI Dialog） |
| 阅读页布局与书页 | `src/views/ReadingView.vue` |
| 书页展示、单页/双页与翻页 | `src/components/studio/BookViewer.vue` + `src/components/studio/ReadingSheet.vue` |
| 双页展开与翻页纯函数模型 | `src/composables/pageTurnPlan.ts`（确定性槽位映射与翻页生命周期） |
| 柔性 3D 卷纸与 GPU 渲染 | `src/components/studio/CurvedPageTurn.vue` + `src/composables/pageTurnGeometry.ts` |
| 横排/竖排分页与标点避头尾 | `src/composables/usePagination.ts`（Kinsoku Shori 算法与题头动态测量） |
| 收藏笺参数比对与格式校验 | `src/composables/useBookmarks.ts`（ZZ-003/004 8 项参数比对与安全校验） |
| 阅读状态（字体/文稿/版式/字号…） | `src/composables/useReadingState.ts` |
| 字体目录与授权元信息 | `src/data/fonts.ts` + `docs/font-licenses.md` |
| 古文内容与权威底本考据 | `src/data/texts.ts` + `docs/text-sources.md` |
| 端到端真实浏览器自动化测试 | `e2e/reader.spec.ts` + `playwright.config.ts` |
| 类型契约 | `src/types/{font,text,reading}.ts` |
| 路由 | `src/router/index.ts` |
| 字体 `@font-face` | `src/styles/fonts/*.scss`（**自动生成，勿手改**） |
| 赏字字体子集生成 | `scripts/build-font-subsets.py` |
| 首页落字字体生成 | `scripts/build-home-glyph-fonts.py`，运行 `npm run fonts:home` |

---

## 四、必须知道的五条硬约束

### 1. 设计令牌是唯一的视觉真相

组件 SCSS 里只允许写 `var(--zz-*)`。**不要写裸色值**。
唯一例外是书页内部点阵纹理的精确 RGB（已加注释说明）。

### 2. 首页永远不能滚动

`.home` 是 `height: 100dvh` + `overflow: hidden`，首页不渲染全局标题栏与导航。
中央品牌标题和 CTA 以完整视口居中；PC 页面保持单屏，**绝不新增内容**。

### 3. 赏字页高度锁定，正文使用分页

`.studio` 用 `flex: 0 0 auto` + `overflow: hidden`，文章由 `usePagination` 拆成书页。
每次显示单页或双页，并从页码导航翻阅；不要将正文恢复为书页内部滚动。
（第 1 轮踩过这个坑，见 progress.md 修复记录 #3。）

### 4. 字体只有 `verified` 才能打包

见 `src/data/fonts.ts` 的 `licenseStatus` 三态 + `docs/font-licenses.md`。
`tests/data.spec.ts` 会强制校验：
- 未核实授权的字体不得 `selfHosted: true`、不得有 `files`、必须有 `caveats`
- 自托管字体必须有 `licenseName` / `licenseUrl` / `sourceUrl` / `licenseCheckedAt`

**改文案后若涉及自托管字体渲染，必须重跑 `npm run fonts:build`。**

### 5. 用户输入永远以文本节点渲染

全项目 ESLint 开启 `vue/no-v-html: error`。
题写面板上线时，段落用 `{{ paragraph }}`，**绝不** `v-html`。

---

## 五、几个容易踩的坑

### 中文字距导致居中偏移

`letter-spacing` 会在**最后一个字之后**也加一份间距，导致视觉偏左。
所有居中标题必须同时设置 `text-indent` 等于 `letter-spacing` 的值。

```scss
&__eyebrow {
  letter-spacing: 0.41em;
  text-indent: 0.41em;   // 抵消末字后的多余间距
}
```

### 竖向 flex 容器里的 `margin: 0 auto` 会收缩元素

`.site-header` 曾因此被压到内容宽度（448px）。
必须显式 `width: 100%; flex: none`。

### 竖排要用 flex 分列，不要绝对定位标题

正文 `writing-mode: vertical-rl` 时，标题若用 `position: absolute` 会和正文列重叠。
正确做法：`.sheet__inner` 用 `flex-direction: row-reverse`，标题作为第一列。

### 可变字体默认字重可能很细

思源宋体可变字体默认轴值是 **200（ExtraLight）**。阅读子集的字重处理仍由
`scripts/build-font-subsets.py` 负责；首页品牌字体是单字重汇文明朝体（400），
首页 Noto 落字子集保留 `wght` 轴。**如果你换字体源，务必检查这一点。**

### 测试间的状态污染

`useReadingState` 是**模块级单例**（离开赏字再回来要保留设置）。
测试文件必须 `beforeEach(() => useReadingState().reset())`。

---

## 六、当前进度快照

| 阶段 | 状态 |
|---|---|
| A 项目初始化 | ✅ 完成 |
| B 设计系统 + 首页 | ✅ 首页已精简；随机落字使用四款真实字体专用子集 |
| C 赏字核心 | ✅ 书页分页、字体切换 / 古文切换 / 横竖排 / 排版调整 / 题写 / 收藏 |
| D 辅助功能 | ✅ 字体图鉴、选集、版式、题写与收藏；对照模式已按本轮范围删除 |
| E 测试与优化 | ✅ 8 套件 118 项单元与组件测试全绿；Playwright 真实 Chromium E2E 全绿；全站 14 份 WOFF2 资产合规性自动化保障；样式重算与 Resize 节流完成 |

---

## 七、下一步建议（按优先级）

1. **更多特色古籍装帧模板**（P2）：册页、经折装、题签、对联等传统版式布局。
2. **跨浏览器竖排与标点核验**（P2）：在 macOS Safari / WebKit 与 Linux/Windows Firefox 环境验证。
3. **屏幕阅读器无障碍实机试听**（P2）：连接实机 NVDA / VoiceOver 听取 `aria-live` 页码播报。

---

## 八、之前已决策的事项

| # | 事项 | 决定与落地 |
|---|---|---|
| 1 | **汇文明朝体的授权** | 经核实（CC0 1.0 + Public Domain），已设为全站主字体；现有名为 `full` 的文件仍是 GB2312 范围版本。 |
| 2 | **自定义文字的缺字策略** | 采用「下载完整字体」策略，结合覆盖表在题写面板提供实时检测与一键按需加载。 |
| 3 | **完整保留原字体** | 新要求已确认：全量 WOFF2 保留原字体全部字符、字形与原有排版/可变轴能力。现有 GB2312 版本尚未替换；首页展示子集与全量转换分离。 |
| 4 | **纯函数 `PageTurnPlan` 模型** | 槽位与翻页逻辑解耦（ADR-017），左右物理槽位与横竖排流向确定性绑定。 |
| 5 | **中文避头尾（Kinsoku Shori）** | 回溯分行算法杜绝标点孤悬（ADR-018），动态题头高度防截断。 |
| 6 | **3D 卷纸 GPU 合成与样式解耦** | 精简至 20 切片条带，叶子节点管理透明度并关闭背光面渲染（ADR-019）。 |

---

## 九、文件清单（当前版本产出）

```
zizai/
├── README.md                       ← 项目说明与命令
├── playwright.config.ts            ← Playwright E2E 测试配置
├── e2e/
│   └── reader.spec.ts              ← 核心端到端流程与真实排版测试
├── docs/
│   ├── implementation-plan.md      ← 阶段计划与任务状态
│   ├── decisions.md                ← 架构决策记录（ADR-001 ~ ADR-019）
│   ├── progress.md                 ← 分轮记录与验证结果
│   ├── design-system.md            ← 落地版设计规范
│   ├── font-licenses.md            ← 字体授权（含未核实项的处理方式）
│   ├── issues.md                   ← 问题清单与修复状态
│   ├── text-sources.md             ← 六篇古文权威底本考据与校勘记录
│   ├── handoff.md                  ← 本交接说明
│   └── design-reference/           ← 用户原始设计资料（只读，勿改）
├── scripts/
│   ├── build-font-subsets.py       ← 正文与品牌子集生成（修复 ZZ-005）
│   ├── build-home-glyph-fonts.py   ← 首页真实 cmap 随机落字子集生成
│   └── font-subset-report.json     ← 字体字符覆盖与缺字报告
├── src/
│   ├── composables/
│   │   ├── pageTurnPlan.ts         ← 双页展开与翻页纯函数领域模型
│   │   ├── pageTurnGeometry.ts     ← 卷纸 3D 几何投影矩阵计算
│   │   ├── usePagination.ts        ← 中文标点避头尾与分页分列算法
│   │   ├── useBookmarks.ts         ← 收藏笺 8 项参数对比与安全校验
│   │   └── ...
│   └── components/studio/
│       ├── BookViewer.vue          ← 书本展示容器、Resize 节流与槽位绑定
│       ├── CurvedPageTurn.vue      ← 柔性 3D 卷纸翻页叶子节点优化
│       └── ...
```
├── scripts/
│   ├── build-font-subsets.py
│   ├── build-home-glyph-fonts.py
│   └── font-subset-report.json
├── src/
│   ├── assets/fonts/{brand,home,lxgw-wenkai,zhuque-fangsong,noto-serif-sc}/
│   ├── components/{SiteHeader.vue,home/,shell/}
│   ├── composables/{useReadingState,useFallingGlyphs,useReducedMotion,useNavMenu}.ts
│   ├── data/{fonts,texts}.ts + home-glyph-pools.json
│   ├── router/index.ts
│   ├── styles/{tokens,global,_breakpoints}.scss + fonts/{brand,reading-fonts,home-glyphs}.scss
│   ├── types/{font,text,reading,index}.ts
│   ├── views/{HomeView,ReadingView,NotFoundView}.vue
│   ├── App.vue
│   └── main.ts
└── tests/{data,home,reading}.spec.ts
```

当前 `main` 已跟踪 `origin/main`；本地预览 `http://127.0.0.1:5173/` 不是远程部署。
