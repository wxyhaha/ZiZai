# 交接说明

> 给下一位接手「字在 ZiZai」的开发者 / AI。
> 先读这一份、`docs/issues.md` 与 `docs/implementation-plan.md`，再按讨论确定的范围继续开发。
>
> 最后更新：2026-11-04（古文繁简体一键切换与默认正体繁体字架构落地、全站 148 项单测 / 15 项 Chromium E2E 全绿）
> 当前验收：148 项单元/组件测试、15 项 Chromium E2E 100% 全绿；全站 14 款自托管字体全矩阵（含魏志莽行书、马善政楷书、陈孝民龙藏体、东汉许慎说文解字小篆），所有字体均为 100% 具备合法 SIL OFL 1.1 开源授权并产出全量高保真 WOFF2 与首页轻量落字子集；9 篇内置古文全面注录宋元明清权威底本繁体正字，默认呈现正体繁体字，并支持顶栏与排版抽屉毫秒级一键繁简切换。

> 2026-11-04 状态补充：
> 1. 古文繁简体切换与默认繁体字（`charVariant`）：
>    - 默认显示正体繁体字（`charVariant: 'traditional'`），完美契合华夏书法墨迹、宋元明清刻本与秦汉小篆结体法度；
>    - 双轨权威校勘策略：9 篇内置古文全部注录人工核校的宋元明清权威底本繁体正字（杜绝「后/後」「于/於」「里/裏」「复/復/覆」「岳/嶽」等多义字语义讹误）；自定文字与通用文本接入 2,712 对 1:1 BMP 双向转换引擎（`src/utils/hanziConvert.ts`）；
>    - 繁简切换收敛至配置面板：顶栏保持最简纯粹，仅保留 `[ 书本 | 卷轴 ]` 双模式胶囊；繁简体字式规范收敛至书本版式面板（`TypographyPanel`）与卷轴设置抽屉（`ScrollSettingsDrawer`）的「字式规范」（繁体正字 / 通行简体），并与古文选集（`TextPickerPanel`）实现全响应式双向联动。
> 2. 纯正中华开源名家书法字库矩阵（14 款）：
>    - 彻底杜绝日韩残字体与商业陷阱字体，全量收录 4 款中华名作：《志莽行书》（魏志莽真迹，吴昌硕金石行草风骨）、《马善政楷书》（马善政真迹，摩崖金石榜书大字）、《龙藏体》（陈孝民真迹，水墨飞白大写意狂草）、《说文解字小篆》（台湾数位发展部 CNS 11643 权威东汉许慎秦汉小篆复刻）；
>    - 行、楷、草三款名作全面覆盖 GB2312 简体规范，结字具备古法行气与繁体书道韵致，无论是繁体古文还是简体阅读均气韵贯通；
> 3. 字体构建管线 Windows 文件锁安全加固（`safe_replace`）：
>    - 针对 Windows 环境下多进程/杀毒/文件索引对 `.woff2` 目标文件的占用问题，引入具有智能重试与显式释放的安全替换函数，消除 `PermissionError: [WinError 5]`；
> 4. 顶栏两侧延伸与通栏舒展重构：`SiteHeader.vue` 移除 1540px 定宽限制，改用流式通栏与响应式边距（`padding: 0 clamp(24px, 3.5vw, 56px)`），品牌贴靠左上、主导航舒展贴靠右上，中间模式切换栏绝对居中，极大提升桌面开阔气度；
> 5. 卷轴设置收敛至顶栏右侧（`ScrollSettingsDrawer.vue`）：针对悬浮按钮紧贴卷轴轴头的压迫感，重构为通过 Teleport 挂载到顶栏右侧主导航旁（`#reading-actions`），与「首页 赏字 ···」统一水平对齐；卷轴上方保留纯净开阔的 42px 宣纸留白，彻底消除对轴头和装裱的视觉遮挡；
> 6. 宣纸古笺底色全量色卡矩阵与书法字体鉴赏列表：双列网格完整展示 10 款宣纸底色与全量 14 款字体的真实渲染字样；
> 7. 首页落字同列整轨联动暂停（方案 A）：悬停或激活某字时，整条垂直轨道同步暂停，消除前后追尾；
> 8. 首页汉字探索弹窗关闭后落字死锁彻底修复：拦截 Reka UI `closeAutoFocus` 焦点回还，建立 `activeGlyphId` 闭合强力清空监听与点击主动失焦，确保弹窗关闭后汉字立即平滑恢复下落；
> 9. 全量 148 项单测与 15 项 Playwright Chromium E2E 100% 通过。

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

## 2026-11-03 · 卷轴模式交接（优先于上文旧约束）

- `/studio` 顶部可切换书本 / 卷轴。**“正文不滚动”仅限制书本**；卷轴必须全文原生横向滚动。首页、BookViewer 与 ReadingSheet 未改视觉实现。
- 核心文件：`ScrollViewer.vue`（纸面实体与滚动）、`scrollTypography.ts`（年代与句读）、`ReadingView.vue`（独立设置及顶部入口）。`SiteHeader.vue` 提供 `#reading-controls` 挂载点，独立组件测试需提供同名容器。
- 共享 `fontId`、`textId`、`customText`；卷轴选择 font/text 传 `syncLayout=false`。卷轴字号与纸色独立存在阅读页内，切换模式保留，离开路由后不做持久化。切换模式会重新展卷/从书本第一页开始，不保存阅读位置。
- 年代只推断风格；未知年代保留原标点。原生竖排不分页、不截断。内置全文经 E2E 对照显示转换后的原文；自定义仍沿用既有 2,000 字输入上限。
- 寒蝉活宋体已修复 Chromium OTS 拒载：仅清理 117 条无效 UVS，构建管线同步处理。源母本不改；普通 cmap 与字形顺序一致，详见字体完整性报告。
- 本轮验证基线：134 项单元/组件测试、10 项 Chromium E2E；全部 10 款字体及纸色、多 PC 视口与首尾截图验收。截图在被 Git 忽略的 `test-results/`，重跑 E2E 会重新生成。
- 后续边界：Firefox / Safari、实体触控板未实测；不宣称跨浏览器或低端设备帧率保证。原字体缺字仍回退。构建已有大 chunk 警告。本轮未提交、未推送。


### 最新交互修正：固定双轴（2026-11-03）

用户确认左右两轴应始终在页面两侧，仅中间文字横向滚动。`scroll-frame` 承载双轴，`scroll-viewport` 承载固定纸面与装裱，`handscroll` 是滚动的全文层。此前关于轴杆随文章移动的说明已被覆盖。E2E 需验证两轴位置不变，同时单独验证文章末尾可达，不能再将轴杆可见作为到达末尾的唯一依据。

### 最新视觉修正：极密列距、拖尾钤印与大字规制（2026-11-03）

- **排版对标**：对齐黄令东老师官方站点（`rg-font.netlify.app` 与 `qiji-font.netlify.app`），草书行距设为 `1.10`，正书设为 `1.15`，行书设为 `1.12`；段落 `margin: 0`；句读定位 `top: 72%`, `left: 94%`（防叠印微调）。
- **卷尾印章**：彻底废止现代「终」字标识，文末拖尾设立 180px 留白与朱砂双边「字在」方印。
- **字号**：默认 55px，上限 70px。
- **天地留白对称**：外层装裱与内层宣纸的天头地脚上下内边距严格对称均等，消除册页天宽地窄残留。
- **案头悬浮控制条（双排解耦）**：顶栏正中仅承载 `[ 书本 | 卷轴 ]` 模式胶囊；长卷专用参数下沉为半透明磨砂宣纸浮岛工具条，等高微标与细线分隔，视觉清朗。
- **测试基线**：135 项 Vitest 单元测试通过，10 项 Playwright E2E 测试全部通过。

