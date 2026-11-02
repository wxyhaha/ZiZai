# 交接说明

> 给下一位接手「字在 ZiZai」的开发者 / AI。
> 先读这一份、`docs/issues.md` 与 `docs/implementation-plan.md`，再按讨论确定的范围继续开发。
>
> 最后更新：2026-11-02（首页极简化与随机落字系统升级）

> 2026-11-02 状态补充：问题清单见 [issues.md](issues.md)。首页已精简为品牌标题与 CTA，并新增四款字体的独立随机落字子集；当前桌面/平板/手机节点数为 24/12/8，同侧落字速度一致并分层错开以避免重叠。完整字体要求已确认但转换尚未调整。落字子集不是完整字体，也不覆盖全量字体的长期要求。

---

## 一、三十秒了解这个项目

**字在（ZiZai）** —— 中文字体与纸上排版体验网站。
视觉是现代极简 + 传统中文书籍美学。

**只有两个一级页面**：
- `/` 首页：100dvh 单屏品牌入口（纸纹 + 四款真实字体的随机落字 +「字在」标题 +「入字间」CTA）
- `/studio` 赏字：一张可调字体 / 文稿 / 版式的阅读书页

字体图鉴、古文选集、版式、题写、对照、收藏**全部**通过抽屉 / 浮层 / 局部模式承载。
**永远不要为它们新建一级路由。**

---

## 二、如何运行

```bash
cd zizai
npm install
npm run dev          # http://localhost:5173
```

验证四联（提交前必须全绿）：

```bash
npm run typecheck    # 0 error
npm run lint         # 0 error / 0 warning
npm run test         # 88 passed
npm run build        # ✓ built
```

当前四项**均已实测通过**。

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
| 阅读状态（字体/文稿/版式/字号…） | `src/composables/useReadingState.ts` |
| 字体目录与授权元信息 | `src/data/fonts.ts` + `docs/font-licenses.md` |
| 古文内容 | `src/data/texts.ts` |
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

`.home` 是 `height: calc(100dvh - var(--zz-header-h))` + `overflow: hidden`。
矮屏只压缩装饰，**绝不新增内容**。
已实测 320×568 下无任何滚动。

### 3. 赏字页高度必须锁死

`.studio` 用 `flex: 0 0 auto` + `overflow: hidden`，书页内部滚动。
**不要改成 `flex: 1`** —— 这会让内容把整机撑高、页面级滚动，书页内部滚动随之失效。
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
| C 赏字核心 | ✅ 全部完成（字体切换 / 古文切换 / 横竖排 / 排版调整 / 题写 / 工具轨） |
| D 辅助功能 | ✅ 主体完成（图鉴抽屉、选集抽屉、排版面板、题写面板、双字体对照、本地收藏） |
| E 测试与优化 | 🟡 本轮 88 个单元测试通过；E2E 与跨浏览器竖排待补 |

---

## 七、下一步建议（按优先级）

先讨论并确定 `docs/issues.md` 中已知缺陷与全量字体改造的执行顺序；以下扩展项保留为后续候选。

1. **更多特色排版模板**（P2）：册页、题签、对联等传统版式布局。
2. **Playwright E2E 测试**（P2）：覆盖选字体、换文章、切竖排、题写、缺字加载、收藏与恢复。
3. **跨浏览器竖排与标点核验**（Firefox / Safari）。
4. **屏幕阅读器无障碍试听**（NVDA / VoiceOver）。

---

## 八、之前已决策的事项

| # | 事项 | 决定与落地 |
|---|---|---|
| 1 | **汇文明朝体的授权** | 经核实（CC0 1.0 + Public Domain），已设为全站主字体；现有名为 `full` 的文件仍是 GB2312 范围版本。 |
| 2 | **自定义文字的缺字策略** | 采用「下载完整字体」策略，结合覆盖表在题写面板提供实时检测与一键按需加载。 |
| 3 | **完整保留原字体** | 新要求已确认：全量 WOFF2 保留原字体全部字符、字形与原有排版/可变轴能力。现有 GB2312 版本尚未替换；首页展示子集与全量转换分离。 |

| # | 尚待讨论的事项 | 影响 |
|---|---|---|
| 1 | 全量字体转换实现及完整性核验 | 保留字符、字形、排版表与可变轴 |
| 2 | 问题修复顺序及关键行为测试 | 优先修实际用户操作结果，避免重复全套验收 |
| 3 | 是否引入小规模 Playwright 检查 | 用关键路径自动验证替代对应手工回归 |

---

## 九、文件清单（第 1 轮产出）

```
zizai/
├── README.md                       ← 项目说明与命令
├── docs/
│   ├── implementation-plan.md      ← 阶段计划与任务状态
│   ├── decisions.md                ← 架构决策记录（ADR）
│   ├── progress.md                 ← 分轮记录与验证结果
│   ├── design-system.md            ← 落地版设计规范
│   ├── font-licenses.md            ← 字体授权（含未核实项的处理方式）
│   ├── handoff.md                  ← 本文件
│   └── design-reference/           ← 用户原始设计资料（只读，勿改）
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
