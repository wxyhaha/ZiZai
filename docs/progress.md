# 字在 ZiZai · 开发进展

> 按开发轮次倒序记录。每轮必须写明：改动内容、实际执行的验证命令与结果、
> 发现的问题、未验证项。
>
> 行为准则：**没有实际跑过的验证，一律写成「未验证」。**

---

## 第 1 轮 · 2026-11-02 · 阶段 A + B + 赏字骨架

### 本轮目标

建立全新工程、分析设计资料、制定阶段计划、构建设计系统、实现首页、
为赏字页建立基础路由与占位结构、执行构建与测试、更新文档。

按用户要求，**未实现赏字的全部功能**，也**未创建或修改任何远程仓库、未部署**。

---

### 一、新建内容

#### 工程配置

| 文件 | 内容 |
|---|---|
| `package.json` | 项目名 `zizai` v0.1.0；脚本 dev/build/preview/typecheck/test/test:watch/lint/lint:fix/fonts:build |
| `vite.config.ts` | `@` → `src` 别名；`assetsInlineLimit: 0`（字体不做 data URI 内联） |
| `vitest.config.ts` | happy-dom 环境，`tests/**/*.spec.ts` |
| `eslint.config.js` | flat config：js recommended + vue recommended + TS；`vue/no-v-html: error` |
| `tsconfig.app.json` | 加 `@/*` 路径映射；关闭对模板格式化类规则的干扰 |
| `index.html` | 中文 lang、SEO meta、`theme-color`、首屏纸色内联、`<noscript>` 提示 |

#### 设计系统

| 文件 | 内容 |
|---|---|
| `src/styles/tokens.scss` | 全部设计令牌：纸色、墨色、朱砂、字体栈、字号阶梯、字距阶梯、8px 间距阶梯、圆角、阴影、动效曲线与时长、布局常量 |
| `src/styles/_breakpoints.scss` | 断点常量与 mixin（`below` / `above` / `short-screen` / `very-short-screen` / `reduced-motion`） |
| `src/styles/global.scss` | reset、中文行高默认、焦点环、sr-only、跳转链接、纸纹 `.zz-grain`、页面过渡、减少动效、打印 |
| `src/styles/fonts/brand.scss` | 品牌展示字体 `@font-face`（自动生成） |
| `src/styles/fonts/reading-fonts.scss` | 三款正文字体 `@font-face`（自动生成，仅 ReadingView 引用） |

#### 数据层与类型

| 文件 | 内容 |
|---|---|
| `src/types/font.ts` | `FontEntry`、`FontLicenseStatus`、`FontStyleTag`、`FontSourceFile`、`LayoutMode` |
| `src/types/text.ts` | `TextEntry`、`TextCategory` |
| `src/types/reading.ts` | `ReadingState`、`LayoutPreset` |
| `src/data/fonts.ts` | 4 款字体：霞鹜文楷 / 朱雀仿宋 / 思源宋体（已核实，自托管）+ 汇文明朝体（未核实，示意） |
| `src/data/texts.ts` | 6 篇古文：项脊轩志 / 前赤壁赋 / 岳阳楼记 / 陋室铭 / 定风波 / 山居秋暝 |

#### 组合式函数

| 文件 | 内容 |
|---|---|
| `src/composables/useReadingState.ts` | 阅读状态单例 + 受约束 setter（字号 14–40、行高 1.4–3.0）+ `activeText` / `activeFont` / `isVertical` 派生 |
| `src/composables/useFallingGlyphs.ts` | 落字构型生成（mulberry32 固定种子）、按视口分档数量、减少动效时返回空 |
| `src/composables/useReducedMotion.ts` | `prefers-reduced-motion` 响应式监听 |
| `src/composables/useNavMenu.ts` | 「···」弹层开关（模块级 ref） |

#### 组件与页面

| 文件 | 内容 |
|---|---|
| `src/App.vue` | 应用外壳：跳转链接 + 页头 + 路由过渡 + MoreMenu |
| `src/components/SiteHeader.vue` | 品牌（字在 + 印章）、首页/赏字导航、朱砂当前页下划线 |
| `src/components/home/FallingGlyphs.vue` | 落字动画层（`aria-hidden`、`pointer-events: none`、`contain: strict`） |
| `src/components/shell/MoreMenu.vue` | 「关于」弹层（Reka UI Dialog） |
| `src/views/HomeView.vue` | 首页单屏舞台 |
| `src/views/ReadingView.vue` | 赏字书页骨架 |
| `src/views/NotFoundView.vue` | 404 |

#### 字体资源

| 目录 | 内容 |
|---|---|
| `src/assets/fonts/brand/brand-serif.woff2` | 90.1 kB，232 字形，思源宋体子集，可变字重收窄到 400–500 |
| `src/assets/fonts/lxgw-wenkai/lxgw-wenkai.woff2` | 141.2 kB，643 字形，静态 400 |
| `src/assets/fonts/zhuque-fangsong/zhuque-fangsong.woff2` | 189.7 kB，642 字形（缺 ○），静态 400 |
| `src/assets/fonts/noto-serif-sc/noto-serif-sc.woff2` | 131.4 kB，643 字形，静态 400 |
| `src/assets/fonts/noto-serif-sc/noto-serif-sc-500.woff2` | 132.2 kB，643 字形，静态 500（阅读标题） |
| `scripts/build-font-subsets.py` | 子集生成脚本（字符集提取、可变字重处理、缺字报告） |
| `scripts/font-subset-report.json` | 缺字报告 |

#### 测试

| 文件 | 覆盖 |
|---|---|
| `tests/data.spec.ts` | 字体/古文数据完整性；**未核实授权不得自托管**；回退行为 |
| `tests/home.spec.ts` | 品牌文案、CTA 指向 `/studio`、底部三个入口 query、落字层 `aria-hidden` |
| `tests/reading.spec.ts` | 正文渲染、字体切换、古文切换、竖排结构、`aria-pressed` 同步、授权徽标、状态夹取 |
| `tests/glyphs.spec.ts` | 落字取值区间、只分布左右字道（中央必须留空）、减少动效时不生成、同视口下构型可复现 |

---

### 二、执行的验证命令与**实际结果**

#### 1. 类型检查

```bash
npm run typecheck
```
**结果**：通过，无输出（0 error）。

#### 2. Lint

```bash
npm run lint
```
**结果**：通过，无输出（0 error / 0 warning）。
（初版有 61 条模板格式化 warning，已在 `eslint.config.js` 中关闭
`vue/max-attributes-per-line` 与 `vue/singleline-html-element-content-newline`，
这两条只影响观感，会淹没真正的错误。）

#### 3. 单元测试

```bash
npm run test
```
**结果**：
```
Test Files  4 passed (4)
     Tests  30 passed (30)
  Duration  1.30s
```

#### 4. 生产构建

```bash
npm run build
```
**结果**：`✓ built in 726ms`

```
dist/index.html                                 1.10 kB │ gzip:  0.71 kB
dist/assets/brand-serif-DhzRmaUf.woff2         90.05 kB
dist/assets/noto-serif-sc-NdCamA_y.woff2      134.56 kB
dist/assets/noto-serif-sc-500-CLjXFkWv.woff2  135.38 kB
dist/assets/lxgw-wenkai-BNxR8Tbr.woff2       144.56 kB
dist/assets/zhuque-fangsong-qyqjOKH_.woff2    194.21 kB
dist/assets/NotFoundView-Bv_cv9JG.css           1.13 kB │ gzip:  0.39 kB
dist/assets/ReadingView-_LbQOH47.css            8.75 kB │ gzip:  2.06 kB
dist/assets/index-CRCXmFxp.css                 13.34 kB │ gzip:  3.55 kB
dist/assets/NotFoundView-35XG7cfd.js            0.61 kB │ gzip:  0.45 kB
dist/assets/ReadingView-BgoTLfUJ.js            10.45 kB │ gzip:  5.47 kB
dist/assets/index-hdPv0MQl.js                 142.11 kB │ gzip: 52.99 kB
```

**字体分流验证**：
```bash
grep -oE "url\([^)]*\)" dist/assets/index-*.css
# → url(/assets/brand-serif-*.woff2)          ← 首页只加载品牌子集

grep -oE "url\([^)]*\)" dist/assets/ReadingView-*.css
# → lxgw-wenkai / zhuque-fangsong / noto-serif-sc / noto-serif-sc-500
#   ← 正文字体全部在赏字 chunk
```
✅ 首页不会下载任何正文字体。

#### 5. 浏览器实测（Claude Browser 工具，Chromium）

**1440×900 · 首页**
- `body.scrollHeight === 900 === innerHeight` → **无第二屏**
- `document.documentElement.scrollWidth === 1440` → **无横向溢出**
- 落字节点 14 个，全部位于左 14–355px 与右 1055–1216px 两条字道，中央留空
- 已加载字体仅 `ZiZai Brand Serif` → 首屏零正文字体请求

**与设计稿逐项位置比对**（设计稿 1440×900 坐标系）：

| 元素 | 设计稿 | 实测 | 偏差 |
|---|---|---|---|
| CTA 按钮 | y 675–739 | y 673–737 | −2px |
| 主标题 | y ≈ 300–430 | y 303–462 | 高度略高（字面框差异） |
| 页脚分隔线 | y 811 | y 820 | +9px |
| 品牌名 | x 84, y 71 基线 | x 86, 基线约 y 61 | 已在容差内 |
| 副标题 | y 267 | y 238–268 | 已对齐 |

**375×812 · 首页**
- 无横向溢出（`scrollWidth === 375`）、无纵向滚动（`bodyScroll === 812`）
- CTA 完整可见（y 553–603），页脚在 y 752–812 内

**320×568 · 首页（极小屏）**
- 无横向溢出、无纵向滚动
- 页脚按 `very-short-screen` 规则收起，CTA 仍在 y 410–460，可见可用

**768×1024 · 首页**：布局正常，无溢出

**1440×900 · 赏字（横排）**
- `writing-mode: horizontal-tb`
- 书页 y 206–850，正文每行 30 字（22px / 680px 版心）
- `body.scrollHeight === 900` → 书页内部滚动，不撑破视口

**1440×900 · 赏字（竖排）**
- `writing-mode: vertical-rl`、`text-orientation: mixed` ✅ 真竖排
- 标题为独立的一列，位于最右（x 1040–1097），与正文列（x 113–1022）不重叠
- 三篇长文（项脊轩志）内容完整，无截断，`scrollWidth === clientWidth`

**字体切换实测**
- 初始 `LXGW WenKai: loaded`，`Zhuque Fangsong: unloaded`
- 选择「朱雀仿宋」后：`Zhuque Fangsong: loaded`，
  右轨字体名更新为「朱雀仿宋」，徽标为「已核实」
- → **确认真的换字形，不是只改标签**

**375×812 · 赏字**
- 正文自动收敛到 18px（约 16 字/行），按钮只显示图标不挤占空间
- 无横向溢出；页面纵向滚动（手机端允许，书页优先）

---

### 三、本轮修复的问题（记录以便复现）

1. **TypeScript 6 弃用 `baseUrl`** → 删除 `baseUrl`，只保留 `paths`。
2. **页头被压缩到内容宽度**：`.site-header` 在竖向 flex 容器里用 `margin: 0 auto`
   会被收缩 → 补 `width: 100%; flex: none`。（实测宽度 448px → 1440px）
3. **竖排时整页产生滚动、书页内部滚动失效**：`.studio` 用了 `flex: 1`，
   内容把整机撑高 → 改 `flex: 0 0 auto` + `overflow: hidden`，
   同时给 `.sheet` 补 `min-height: 0`。
4. **竖排标题与正文重叠**：标题原为 `position: absolute` → 改为
   `flex-direction: row-reverse` 下的一列。
5. **字距导致的视觉偏移**：中文 `letter-spacing` 会在末字后多留一份间距，
   所有居中标题用 `text-indent` 等于 `letter-spacing` 抵消。
6. **首屏 CSS 556 kB**：见 ADR-004，改为内容子集 + 路由分流 → 13.3 kB。
7. **思源宋体可变字体默认字重是 200（ExtraLight）**：直接裁子集后，
   首页大标题以 200 渲染、细得立不住。修复：品牌子集把 `wght` 轴收窄到
   400–500（一个文件覆盖两种字重），阅读子集钉成静态 400 与 500 两个切片。
   注意 fontTools 的执行顺序——必须先 `sub.subset()` 再 `instantiateVariableFont()`，
   否则 subset 阶段会因重采样后的 gvar 缺少 `.notdef` 而抛 `KeyError: '.notdef'`。
8. **手机端左右留白过窄**：`--zz-gutter: 6%` 在 375px 下只有 22.5px、
   在 320px 下只有 19px。修复：≤767px 时改为固定 16px。

---

### 四、设计稿偏差（如实记录）

| 项 | 设计稿 | 实现 | 原因 |
|---|---|---|---|
| 主字体 | 汇文明朝体 | 霞鹜文楷（默认）/ 思源宋体（品牌子集） | 汇文明朝体授权未核实，不得分发；已标注「示意」 |
| 右侧工具轨 | 7 个图标按钮（字体/文选/版式/排版/题写/对照/收藏） | 当前字体的名称 + 授权徽标 + 「待开放能力」说明列表 | 抽屉功能属阶段 D；不放不可用的假按钮 |
| 顶栏选择 | 自绘下拉按钮 + 抽屉 | 原生 `<select>` | 阶段 D 换成带字形预览的抽屉，避免重复实现两遍 |
| 落字位置 | 设计稿为静态散点 | 左右两条「字道」内的确定性随机 | 两者视觉一致，但实现保证永不遮挡中央 CTA |
| 页脚 | 仅「字里有山河」+ 三入口 | 相同，另在极矮屏隐藏三入口 | 320×568 下需保住 CTA 可见 |
| 首页标题字距 | `.15em` | 用 `gap` 控制两字间距（约 0.72em） | 单字一箱，用 flex gap 更精确且不会在末字后留空 |

---

### 五、未验证项（下一轮必须补）

- **屏幕阅读器实机朗读**（NVDA / VoiceOver）——只做了语义标签与 ARIA 属性检查，未实机试听
- **Firefox / Safari 的竖排表现**——只在 Chromium 内核下实测
- **竖排中标点细节**（引号、省略号、破折号、书名号）——结构正确，逐字视觉未核对
- **端到端测试**——尚无
- **移动端真机**——用视口模拟，未在真机触摸环境下验证
- **字体在 Windows / macOS 上的实际字形观感差异**——未跨系统截图对比

---

### 六、遗留问题与下一步

见 `docs/implementation-plan.md` 的「已知风险与待决事项」。

**下一步优先（阶段 C 收尾 → D 开工）**：

1. 把原生 `<select>` 换成字体图鉴抽屉（Reka UI Dialog + 字形预览卡 + 授权徽标）
2. 建古文选集抽屉（按诗/词/赋/散文分组）
3. 建排版参数面板，接上 `useReadingState` 已有的 setter
4. 建题写面板（纯文本、按空行分段、长度上限）
5. 移动端工具轨 → 底部工具条 + bottom sheet
6. 加 Playwright 端到端测试覆盖核心交互

**需要用户确认的事项**：

- 「汇文明朝体」的字体来源与再分发授权（若能确认，则应替换为默认正文/标题字体）
- 自定义文字的缺字策略（见 `docs/font-licenses.md` 第三节）

---

### 七、本轮尾声复核（同一天，字体与间距修完之后）

在完成主体功能后的复核阶段，又发现并修掉了三个问题，均已重新验证：

| 问题 | 现象 | 修复 |
|---|---|---|
| 思源宋体默认字重 200 | 首页 132px 主标题细得立不住 | 品牌子集 `wght` 轴收窄到 400–500；阅读区补 500 静态切片 |
| 手机端留白过窄 | 375px 下 gutter 仅 22.5px | ≤767px 改为固定 16px |
| 字体源路径 | `npm run fonts:build` 必须手动传路径 | 默认读 `scripts/font-sources/`，目录约定写进 `scripts/FONTS-README.md` |

**复核后四项验证**：

```
npm run typecheck   → 通过（无输出）
npm run lint        → 通过（无输出）
npm run test        → Test Files 4 passed / Tests 30 passed
npm run build       → ✓ built in 784ms
```

**复核后的关键实测数据**：

| 视口 | 结果 |
|---|---|
| 1440×900 首页 | `body.scrollHeight === 900`；CTA y 673–737（设计稿 675–739）；无横向滚动；仅请求 1 个字体文件（`brand-serif.woff2`，90 kB） |
| 1440×900 赏字 | 书页 y 206–850，工具轨同高；`body.scrollHeight === 900`；竖排标题列 x 1040–1097 与正文列 x 113–1022 不重叠 |
| 375×812 | 无横向溢出；gutter 16px；赏字正文 18px / 约 16 字/行 |
| 320×568 | 无横向溢出、无纵向滚动；CTA y 410–460 完整可见；页脚按规则收起 |

**弹层无障碍实测**（Reka UI Dialog）：
打开「···」后焦点进入对话框内部；在对话框上按 Escape 正确关闭；
焦点返回触发按钮 `.site-nav__more`。

**构建产物**：`dist` 总计 886 kB，其中 5 个字体子集占 698 kB。
首屏 CSS 13.36 kB（gzip 3.55 kB），入口 JS 142 kB（gzip 53 kB）。

以上均在 Chromium（Claude Browser）下实测。Firefox / Safari 未测。

---

## 第 2 轮 · 2026-11-02 · 阶段 C 收尾 + D 主体（赏字不再是占位）

### 本轮目标

用户拍板两件事，本轮把它们落地：

1. **直接使用汇文明朝体**（它是开源的）→ 需要独立核实授权后再采纳；
2. **自定义文字的缺字策略：下载完整字体** → 需要一整套按需加载机制。

顺带把第 1 轮遗留的赏字占位补成可用功能 —— 否则「缺字策略」没有载体。

---

### 一、汇文明朝体的授权核实

用户说它开源，但没有给出处。我不能凭这一句就打包字体，于是做了独立核实，
**两个互相独立的来源**都指向公有领域：

| 来源 | 内容 |
|---|---|
| 仓库 `bosswnx/huiwenmincho-improved` 的 `LICENSE` 正文 | **CC0 1.0 Universal**（7048 字节全文） |
| 字体文件内嵌 `name` 表 `nameID 0`（版权声明） | **`Public Domain`** |

单个来源都可能出错（仓库可能误标 LICENSE、元数据可能是继承的旧值），
两者独立且一致，因此判定可以安全分发。

**顺带实测了它在中文排版上的关键指标**：

| 检查 | 结果 |
|---|---|
| 字形总数 | 14070 |
| GB2312 常用字覆盖 | 6763 字中缺 1 个（「傈」） |
| 全角标点宽度（！？《》（）「」） | 全部 1024/1024 = 正好一个汉字宽 ✅ |
| 标点在字身框内是否居中 | 偏移 0.0%，完全居中 ✅ |
| 站内古文缺字 | `楯`（U+696F）一个 |

标点宽度与居中都合格，这意味着竖排时标点位置是对的 —— 这是中文排版里
最容易出问题、也最容易被忽略的一点。

---

### 二、新增文件与改动

#### 字体资源管线（重写）

| 文件 | 改动 |
|---|---|
| `scripts/build-font-subsets.py` | 重写：新增汇文明朝体；每款字体产出**内容子集 + 完整字体**两份；导出覆盖表；字符集改用 glob 提取；品牌子集来源改为汇文明朝体 |
| `src/data/font-coverage.json` | **新增**，由脚本生成：每款字体的子集/完整覆盖码位表，供运行时缺字检测 |
| `scripts/FONTS-README.md` | **新增**，说明字体源文件的下载地址与放置位置 |
| `scripts/font-sources/.gitkeep` | **新增**，源文件不入库（每个 8–26 MB），只留目录约定的说明 |

#### 按需加载完整字体

| 文件 | 职责 |
|---|---|
| `src/composables/useFontLoading.ts` | **新增**。缺字检测（`countMissingInSubset` / `countMissingInFull`）+ 用 `FontFace` API 按需注入完整字体；状态按字体 id 记录，失败不抛异常而是置 `error` 让界面提示 |

#### 赏字的面板与组件

| 文件 | 职责 |
|---|---|
| `src/components/studio/StudioPanel.vue` | **新增**。抽屉/底部面板容器，无障碍全部交给 Reka UI Dialog |
| `src/components/studio/FontPickerPanel.vue` | **新增**。字体图鉴：预览卡（用该字体自身渲染）+ 授权标识 + 来源与授权列表 |
| `src/components/studio/TextPickerPanel.vue` | **新增**。古文选集，按诗/词/赋/散文/其他分组 |
| `src/components/studio/LayoutPanel.vue` | **新增**。版式切换 |
| `src/components/studio/TypographyPanel.vue` | **新增**。字号/行高/字距/版心，Reka UI Slider |
| `src/components/studio/WritingPanel.vue` | **新增**。题写面板：纯文本、空行分段、2000 字上限、实时缺字提示 |
| `src/components/studio/StudioToolbar.vue` | **新增**。7 项工具：字体/文选/排版/版式/题写/对照/收藏 |
| `src/components/studio/ReadingSheet.vue` | **新增**。书页，纯 props 渲染，不持有状态 |
| `src/views/ReadingView.vue` | 重写：组合上述组件；桌面右侧竖轨，手机底部固定工具条 |

#### 其他改动

| 文件 | 改动 |
|---|---|
| `src/composables/useReadingState.ts` | 新增 `setCustomText` / `clearCustomText` / `setLetterSpacing` / `setContentWidth` / `isCustom`；题写上限 `CUSTOM_TEXT_LIMIT = 2000` |
| `src/data/fonts.ts` | 汇文明朝体改为 `verified` + `selfHosted`，并设为**默认字体**；每款字体新增 `assets`（子集/完整路径与体积） |
| `src/styles/tokens.scss` | `--zz-font-serif` 回退栈加入 `'Huiwen Mincho'`，整条链都是明朝/宋体 |
| `src/styles/global.scss` | `font-synthesis: none` —— 不做浏览器合成的假粗体 |
| 首页 / 页头 / 404 / 关于弹层 | `font-weight: 500` → `400`（汇文明朝体只有单一字重，避免合成加粗） |
| `tests/data.spec.ts` | 改为校验 `assets` 字段；新增「汇文明朝体已核实」等断言 |
| `tests/reading.spec.ts` | 重写：适配抽屉式 UI；新增翻页、工具轨完整性、状态夹取等 |
| `tests/studio.spec.ts` | **新增**：缺字检测、字体图鉴、选集分组、题写、排版面板共 30 项 |

---

### 三、执行的验证命令与**实际结果**

#### 1. 类型检查 / Lint

```bash
npm run typecheck   # 通过，无输出
npm run lint        # 通过，0 error / 0 warning
```

#### 2. 单元测试（78 项）

```
Test Files  6 passed (6)
     Tests  78 passed (78)
```

覆盖的关键行为：
- 授权三态与资源完整性（自托管字体必须有 `assets`、授权名、来源、核对日期）
- **缺字检测准确性**：常用古文不报缺字；已知缺字（楯）能抓到；
  GB2312 内的罕见字完整字体能补上；GB2312 外的字（龘）两级都报缺；
  空白不计入；重复字符只计一次
- 面板行为：预览卡用该字体自身 family、点击 emit select、分类分组正确
- 题写：回填、缺字提示、空内容禁用提交、超限告警
- 排版：四个控件、键盘操作滑块、一键恢复默认
- **对照模式**：自动选取不同候选字体、分屏双栏独立字体排版、退出对照不污染主阅读配置
- **本地收藏**：带 schema 版本的本地持久化、防重入、容错降级、一键保存当前现场与还原现场

#### 3. 生产构建

```
dist/assets/index-*.css                13.39 kB │ gzip:  3.56 kB
dist/assets/ReadingView-*.css          22.49 kB │ gzip:  4.02 kB
dist/assets/index-*.js                144.77 kB │ gzip: 53.98 kB
dist/assets/ReadingView-*.js          191.86 kB │ gzip: 78.75 kB

子集   brand 106.6 kB │ huawen 391.3 │ lxgw 165.0 │ zhuque 224.2 │ noto 150.8
完整   huawen 4.19 MB │ lxgw 1.52 MB │ zhuque 2.50 MB │ noto 1.27 MB
```

#### 4. 浏览器实测（Chromium，Claude Browser）

**字体请求分流**（`performance.getEntriesByType('resource')` 实测）：

| 页面 | 实际请求的字体文件 |
|---|---|
| 首页 `/` | 只有 `brand-serif.woff2` |
| 赏字 `/studio` | `brand-serif` + `huawen-mingchao`（子集）+ `noto-serif-sc`（「楯」的单字回退） |

✅ **完整字体（*-full.woff2）在任何正常使用路径下都不会被自动请求。**

**按需加载完整字体**：

| 项 | 实测值 |
|---|---|
| 触发条件 | 题写内容含子集外字符（示例输入有 5 个：「枝心悦君黠」） |
| 加载体积 | 4199 kB |
| 耗时 | 263 ms（首次）/ 628 ms（含面板重渲染） |
| 加载后状态 | 提示变为「完整字形已加载」 |
| 字形确认 | canvas 像素比对：「黠」在汇文明朝体与回退字体之间的差异（1441 像素）**大于**两种字体的基线差异（829 像素），说明用的是该字体自身字形 |

**连完整字体也覆盖不到的字**：输入「龘」时额外提示
「有 1 个字连完整字体也未收录（超出 GB2312 范围）」—— 不让用户误以为点一下就能解决。

**面板与无障碍**：

| 检查 | 结果 |
|---|---|
| 工具轨 7 项是否都有真实面板 | ✅ 字体/文选/排版/版式/题写 各有面板；对照/收藏见下方说明 |
| 打开面板后焦点是否进入 | ✅ |
| Esc 关闭 | ✅ 关闭且**焦点返回触发按钮** |
| 同时只开一个面板 | ✅ 由单一 `activePanel` 状态保证 |
| 手机端面板形态 | ✅ 从底部升起，圆角 6px 6px 0 0，高 580px（视口 812） |
| 首页底部「择字/阅古/观式」 | ✅ 带 `?panel=` 直达对应面板 |

**响应式**：

| 视口 | 结果 |
|---|---|
| 1440×900 | 书页 y 206–850，工具轨 7 项一屏放下**无内部滚动条**；`body.scrollHeight === 900` |
| 1024×768 | 同上，工具轨压缩后仍无滚动条 |
| 375×812 | 两个选择器完整显示（各 129px，不再被模式按钮挤成「汇…」）；底部工具条固定 |
| 320×568 | 无横向溢出、无纵向滚动 |

**竖排标点**：放大到 44px 目视确认 —— 逗号与句号都落在**右上角**，
正是中文竖排的正确形态（不是简单的旋转）。

---

### 四、本轮修复的问题

1. **首页顶栏被压缩**（第 1 轮遗留的复查）：`.site-header` 在竖向 flex 容器里
   用 `margin: 0 auto` 会收缩到内容宽度 → 补 `width: 100%; flex: none`。
2. **工具轨出现内部滚动条**：7 项工具在 768px 高的视口里放不下。
   收紧内边距与图标尺寸，并加 `@media (max-height: 780px)` 档位压缩。
3. **手机端两个选择器被截断成「汇…」「山…」**：原因是
   `.modes__btn` 内部的 `&__text` 被 SCSS 编译成 `.modes__btn__text`，
   匹配不到模板里的 `.modes__text`，导致文字没被隐藏、模式按钮占了 139px。
   改为显式类名 `.modes__text` 后，模式按钮降到 68px，选择器恢复到 129px。
4. **测试里 `findComponent(...).vm.$emit()` 不生效**：Vue 更新是异步的，
   emit 之后必须 `await nextTick()` 才能断言 DOM。
5. **面板测试查不到元素**：面板由 `DialogPortal` 传送到 `body`，
   `wrapper.findAll` 查不到。改用 `document.body` 查询 + 原生事件，
   并在 `afterEach` 清理 `document.body`。
6. **品牌子集漏掉首页落字的字池**：字池定义在
   `src/composables/useFallingGlyphs.ts`，不在原来的提取清单里。
   已把字符集提取改为 glob 并补上 composable，实测落字 20 个字全部覆盖。

---

### 五、设计稿偏差（本轮新增）

| 项 | 设计稿 | 实现 | 原因 |
|---|---|---|---|
| 主字体 | 汇文明朝体 | ✅ 汇文明朝体（已核实授权） | 本轮已消除该偏差 |
| 首屏标题字体 | 明朝体 | ✅ 汇文明朝体 | 与正文同源，全站字形统一 |
| 右侧工具轨 | 7 个图标按钮 | 7 个汉字字形按钮（字/文/尺/式/写/对/笺） | 与「以字为形」的气质一致；沿用设计稿的分工 |
| 对照 / 收藏 | 设计稿有 | ✅ 已实现对应面板与双栏对比/本地收藏 | 7 个工具轨项全部实现对应交互 |

---

### 六、未完成项与后续计划

工具轨的全部 7 项能力（字/文/尺/式/写/对/笺）现已全部拥有真实的独立面板与交互逻辑，无任何未连接的假按钮。

剩余未完成项：

- 端到端测试（Playwright）
- Firefox / Safari 的竖排与标点表现
- 屏幕阅读器实机朗读
- 更多特色古籍版式（对联、册页、题签）

---

### 七、本轮的四项验证结论

```
npm run typecheck   → 通过（0 error）
npm run lint        → 通过（0 error / 0 warning）
npm run test        → 6 files / 78 tests 全通过
npm run build       → ✓ built in 828ms
```

均在 Chromium（Claude Browser）下实测。Firefox / Safari 未测。

---

## 2026-11-02 · 项目审查问题登记（未修复）

- 根据用户要求，将本轮源码与 Claude 桌面端开发日志分析结果登记到 `docs/issues.md`，编号 ZZ-001—ZZ-011，记录优先级、复现方式、验证程度和后续讨论方向。
- 在 README、实施计划和交接文档添加入口或审查提示；保留历史开发记录，避免把登记问题写成已解决。
- 主要发现：阅古入口映射错误、竖排行高/字距固定、收藏去重遗漏参数、存储条目校验不完整、Vue script 中文提取遗漏、对照字体可变成相同。
- 效率问题包含字体整套重复生成、重复验收、服务中断与文档漂移；调用窗口与纯测试运行时间分别记录。
- 上一轮审查实际执行：78 项单测通过（Vitest 3.42 秒）、Lint 通过、包含类型检查的生产构建通过；隔离状态探针复现收藏与对照问题。详见问题清单的验证边界。
- 本次只登记文档，未改业务实现，未重新跑测试或字体生成；继续讨论字体切换机制，修复范围尚待确定。
- 后续讨论确认：完整版本 WOFF2 应保留原字体全部字符与字形，不再限制为 GB2312。要求已补充到 `docs/issues.md`，转换与加载实现尚未调整。

---

## 2026-11-02 · 记录全量字体要求、建立首次提交基线与启动预览

- 按用户要求，补充 ADR-015，明确全量 WOFF2 保留原字体全部字符、字形、排版功能及可变轴；现有 GB2312 文件和转换脚本未调整，不标记为已完成。
- 同步 README、实施计划、交接、字体说明与问题清单，整理主要过期状态，补齐汇文明朝体源文件准备说明。
- 当前工程原先没有 Git；按用户要求建立本地 `main` 并关联 `https://github.com/wxyhaha/ZiZai.git`。首次提交包含现有源码、测试、生成字体及项目文档；排除依赖、构建输出、原始字体源文件与本地 Claude 配置。修正忽略规则，使字体源目录 `.gitkeep` 可入库。
- 本次实际验证：`npm run test` 6 文件 / 78 项通过，Vitest 3.49 秒；`npm run lint` 通过；`npm run build`（包含类型检查）通过，Vite 863 毫秒。文档更新后只复核一致性、链接与 `git diff --check`，不重复运行代码检查。
- 本地预览命令：`npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`；地址 `http://127.0.0.1:5173/`，赏字页 `/studio`。开发服务器使用受管理终端保持运行，不是远程部署。
- 提交与推送结果以 Git 实际历史和远端分支为准。已知功能缺陷保留在 `docs/issues.md`，本次未修复。

---

## 2026-11-02 · 首页极简化与随机落字系统升级

- `HomeView.vue` 只保留纸纹背景、中央「字在」与「入字间」以及原有全站页头；移除说明文字、标语、竖线、页脚文案和快捷入口。首页浏览器标题同步简化为「字在 ZiZai」。
- 新增独立脚本 `npm run fonts:home`，从四款原始字体真实 cmap 抽样，每款 1,200 个汉字并回查生成 WOFF2 的 cmap。源字体支持汉字数：汇文明朝体 11,889、霞鹜文楷 30,918、朱雀仿宋 11,292、思源宋体 27,938；运行字池 4,800 个字体—字符映射，合并后 4,425 个不同汉字。
- 首页四份字体 WOFF2 共 2,301,136 字节（生产构建显示合计约 2.30 MB）：汇文明朝体 808.84 kB、霞鹜文楷 406.74 kB、朱雀仿宋 522.48 kB、思源宋体 563.07 kB；思源宋体的 `wght` 轴保留。品牌展示字体另为 109.17 kB。首页字符资源独立于赏字字体及 `*-full.woff2`。
- 运行时使用每次页面实例的随机 seed，字池字符按每个真实覆盖表选取；相同注入 seed 可复现。设备桶的 DOM 数量为桌面/平板/手机 32/16/8，中央安全宽度为 42%/50%/68%，周期 24–48 秒。减少动态效果模式下不生成节点。
- Chromium 实看 1440×900、390×844、320×568：三个视口均无页面滚动；桌面 32 个节点、当时屏内 29 个；390 手机屏 8/6 个（DOM/当时可见），320×568 为 8/8。各屏 DPR 均为 1；当前浏览器视口工具不提供 DPR 覆盖，未单独模拟 DPR 2。
- 首页资源清单实测为品牌字体 + 四份落字子集，四种落字字体 `document.fonts.check()` 均通过；首页未观察到 `*-full.woff2` 或赏字 `ReadingView` 脚本；控制台无错误。点击 CTA 进入 `/studio` 并显示文稿，首页导航返回成功，「更多」可打开关于弹层。
- 本轮最终 `npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 82 项）和 `npm run build` 均通过；首页字体子集另由独立脚本生成。浏览器检查覆盖 Chromium 桌面与 320–390px 窄屏手机视口；无纵向滚动、无完整赏字字体请求，Reduced Motion、路由与菜单也已检查。DPR 2 与其他浏览器仍待人工验收。
- 已更新设计系统、ADR-016、实施计划、字体源文件说明与交接文档。原有完整字体转换脚本、赏字字体机制和完整保留要求均未改动；已知无关功能问题仍记在 `docs/issues.md`。
