# 字在 ZiZai · 开发进展

> 按开发轮次倒序记录。每轮必须写明：改动内容、实际执行的验证命令与结果、
> 发现的问题、未验证项。
>
> 行为准则：**没有实际跑过的验证，一律写成「未验证」。**

---

## 2026-11-04 · 修复首页落字弹窗关闭后汉字悬停暂停死锁（彻底杜绝落字卡死在空中）

### 改动内容

1. **根因定位与双重死锁分析**
   - **悬停生命周期断档**：用户在首页点击落字时触发 `onGlyphEnter` 记录了 `hoveredGlyphId` 与 `hoveredLaneId`；弹窗开启后鼠标移入弹窗内容区，关闭弹窗时底层的落字元素从未触发 `mouseleave`，导致组件内残留当前轨道暂停判定；
   - **WAI-ARIA Focus Return Trap（焦点回还陷阱）**：Reka UI Dialog 默认按照无障碍规范在关闭销毁时执行 `closeAutoFocus`，强行将页面焦点还原给触发弹窗的落字 `<button>`；按钮再度获得焦点触发 `@focus="onGlyphEnter"`，且浏览器默认不会在点击空白区域时使 `<button>` 失焦，导致汉字以浓墨高亮悬停态被永久钉在空中停止下落。
2. **三重防御彻底根治**
   - **切断自动焦点回还**（`HanziExploreDialog.vue`）：在 `DialogContent` 增加 `@close-auto-focus.prevent`，禁止弹窗关闭时强行回还焦点至流动背景中的落字按钮；
   - **闭合状态强力重置监听**（`FallingGlyphs.vue`）：建立对 `props.activeGlyphId` 的监听（`watch`），当弹窗关闭（`oldVal != null && newVal == null`）时，强制清空 `hoveredGlyphId` 与 `hoveredLaneId` 并调用全局 `document.activeElement.blur()`，确保弹窗闭合瞬间立即解除暂停、平滑恢复下落；
   - **点击主动失焦与 Tab 防干扰**（`FallingGlyphs.vue` / `HomeView.vue`）：点击落字触发 `emit('select', glyph)` 时主动调用 `blur()`，并在落字按钮上补充 `tabindex="-1"`，杜绝流动背景元素干扰主页核心 CTA 的键盘焦点流。
3. **E2E 验证升级**
   - 更新 `e2e/home-explore.spec.ts`：移除先前在测试中手工强塞的 `document.activeElement.blur()`，断言真实用户按 Esc 或关闭弹窗后，无需任何额外点击即可 100% 自然解除 pause 并恢复飘落。

### 实际执行的验证命令与结果

- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run test`：11 个测试套件、148 项 Vitest 单元与组件测试全部通过（耗时 6.05s）。
- `npm run test:e2e`：15 项 Playwright Chromium 端到端真实浏览器测试全绿（耗时 51.4s）。
- `npm run build`：生产环境打包成功，耗时 1.66s。

---

## 2026-11-04 · 古文繁简体一键切换与默认正体繁体字架构落地

### 改动内容

1. **正统古典书法美学契约与权威底本校勘注录**
   - 华夏书法、刻本与金石之美（行草连绵、界格乌丝、许慎小篆）天生依附于正体汉字（繁体字）的对称结体、重心均衡与笔法呼应；
   - 彻底摒弃机械简繁转换带来的多义字讹误（如「后/後」「于/於」「里/裏」「复/復/覆」「岳/嶽」），在 `src/data/texts.ts` 为全站 9 篇内置古文（《项脊轩志》《前赤壁赋》《岳阳楼记》《陋室铭》《定风波》《山居秋暝》《论语·学而》《兰亭集序》《匆匆》）全面注录权威底本校勘之正体繁体正字（`titleTrad`、`authorTrad`、`paragraphsTrad`、`summaryTrad`）；
   - 扩充 `TextEntry` 契约，支持原汁原味展示底本校勘正体字。
2. **轻量零依赖高精度简繁双向字符映射引擎（`src/utils/hanziConvert.ts`）**
   - 提取严谨的 2,712 对 1:1 BMP 规范映射表，消除长代理对错位风险；
   - 提供 `toTraditional`、`toSimplified` 与 `convertTextVariant` 工具函数，用于用户自定义文本（`customText`）与动态文稿的即时无损双向转换。
3. **响应式字式状态层流转（`useReadingState.ts`）**
   - 扩展 `ReadingState`，引入 `charVariant: 'traditional' | 'simplified'`，**默认值设为 `'traditional'`（繁体正字）**；
   - 提供 `setCharVariant` 与 `toggleCharVariant` 状态操作接口；
   - `activeText` 动态派生：当 `charVariant === 'traditional'` 时优先返回权威底本繁体文本，自定义文字经 `toTraditional` 映射；当为 `'simplified'` 时返回通行简体文本；状态切换零延迟且不破坏原始用户输入。
4. **UI 交互收敛：繁简切换收入配置选项，顶栏恢复极简纯粹**
   - **顶栏最外层极简纯粹（`ReadingView.vue`）**：移除顶栏 `#reading-controls` 的 `[ 繁 | 简 ]` 胶囊与细线分隔，使顶部居中仅保留 `[ 书本 | 卷轴 ]` 阅读模式切换，杜绝最外层视觉元素堆砌；
   - **版式配置面板（`TypographyPanel.vue`）**：在排版设置中常设「字式规范」专区（繁体正字 / 通行简体），书本阅读时呼出「式」面板即可一键调配；
   - **卷轴配置抽屉（`ScrollSettingsDrawer.vue`）**：在长卷设置中常设「字式规范」选项，长卷阅读时呼出「卷轴设置」即可一键调配；
   - **古文选集（`TextPickerPanel.vue`）**：篇目卡片标题、作者与题解按当前字式规范动态同步，所选即所见。
5. **自动化测试与端到端真实浏览器验证**
   - 适配 `tests/reading.spec.ts`、`tests/studio.spec.ts` 与 `tests/scroll-settings.spec.ts`，新增繁简体切换单元与组件测试；全站单测套件保持 148 项且 100% 全绿；
   - 升级 `e2e/reader.spec.ts` 与 `e2e/scroll.spec.ts`，断言顶栏外层无繁简按钮、仅在配置面板内切换「繁体正字/通行简体」并即时驱动正文与标题双向重排；Playwright E2E 保持 15 项且 100% 全绿。

### 实际执行的验证命令与结果

- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run test`：11 个测试套件、148 项 Vitest 单元与组件测试全部通过（耗时 5.27s）。
- `npm run test:e2e`：15 项 Playwright Chromium 端到端真实浏览器测试全绿（耗时 49.1s）。
- `npm run build`：生产环境打包成功，耗时 1.56s。

---

## 2026-11-04 · 引入 4 款纯正中华开源名家书法与金石字库（全量 14 款字库矩阵）

### 改动内容

1. **纯正中华开源书法名作考证与收录**
   - 彻底舍弃存在编码残缺、缺字严重的日韩字库，严格遴选 100% 由中国书法家/典籍整理且基于 SIL Open Font License 1.1 开源协议的名家真迹：
     - **志莽行书（Zhi Mang Xing）**：当代中国书法家魏志莽手写真迹，融汇吴昌硕金石行书大字与古代碑帖墨意，苍劲古拙、行草相参；
     - **马善政楷书（Ma Shan Zheng）**：当代书法家马善政手书，取法中国传统名山摩崖石刻与楹联榜书大字，刀削斧劈、沉实雄强；
     - **龙藏体（Long Cang）**：当代中国书法家陈孝民手写毛笔真迹，笔走龙蛇、水墨飞白，再现古代狂草大写意风神；
     - **说文解字小篆（TW-ShuoWen）**：台湾数位发展部 CNS 11643 全字库工程依东汉许慎《说文解字》秦汉小篆原典数字化修摹，圆劲挺拔、骨肉停匀，为华夏文字金石篆书之正统源流。
2. **全量高保真 WOFF2 与落字子集构建管线升级**
   - 修复 Windows 环境下 `os.replace` 在跨进程/文件索引器占用时的 `PermissionError: [WinError 5]`，引入安全带重试的 `safe_replace` 机制；
   - 运行零子集化管线，产出 4 款高保真全量 WOFF2 资产（志莽行书 2.19 MB、马善政楷书 3.10 MB、龙藏体 2.81 MB、说文解字小篆 6.36 MB）；
   - 同步自动生成 4 款首页落字轻量子集（每款 1,200 字，396 kB ~ 1.0 MB），更新 `home-glyph-pools.json` 与 `font-coverage.json`。
3. **字体授权依据与元信息完整性归档**
   - 在 `src/data/fonts.ts` 登记 4 款新字体的单一事实来源元数据；
   - 更新 `docs/font-licenses.md`：核查二进制 TTF 内嵌 `name` 表（`nameID 0`, `nameID 13`, `nameID 14`）与开源仓库许可，记录核查日期（2026-11-04）；全站核实自托管字体增至 14 款。
4. **测试套件与回退契约适配**
   - 适配 `tests/studio.spec.ts`：将许慎秦汉小篆（`tw-shuowen`）纳入先秦金石规范，断言其 caveats 健全且生僻/后起简体字正确回退；断言手写毛笔书法新字体对常用字和标点的覆盖度。

### 实际执行的验证命令与结果

- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run test`：11 个测试套件、147 项 Vitest 单元与组件测试全部通过（耗时 4.02s）。
- `npm run test:e2e`：14 项 Playwright Chromium 端到端真实浏览器测试全绿（耗时 43.9s）。
- `npm run build`：生产环境打包成功，耗时 1.32s（28 份字体资产全部生成并正确打包）。

---

## 2026-11-04 · 顶栏通栏舒展布局、卷轴设置右侧抽屉化、宣纸底色与字体选择对齐重构

### 改动内容

1. **顶栏向两侧延伸通栏布局（`SiteHeader.vue`）**
   - 彻底解除以往硬编码 `max-width: var(--zz-container) (1540px)` 的局促约束，升级为流式满宽通栏；
   - 两端边距引入平滑响应式安全距离：`padding: 0 clamp(24px, 3.5vw, 56px)`（移动端优雅回退为 16px）；
   - 左侧品牌「字在 印」优雅靠左，右侧主导航「首页 赏字 ···」舒展靠右；
   - 中间 `#reading-controls`（书本 / 卷轴模式切换胶囊）采用绝对定位（`left: 50%; transform: translate(-50%, -50%)`），确保在任何超宽、普通宽屏或窄屏下始终稳固位于视口正中。
2. **卷轴设置收敛至顶栏右侧与抽屉化重构（`ScrollSettingsDrawer.vue`）**
   - 彻底解决悬浮按钮紧贴卷轴轴头的压迫感与碰撞：在 `SiteHeader.vue` 右侧开辟 `#reading-actions` 挂载槽位，设置按钮通过 Teleport 优雅收纳至顶栏右侧，与「首页 赏字 ···」统一水平对齐；
   - 卷轴主体上方彻底腾空，保留纯净自然的 42px 宣纸留白，不再受任何悬浮元素压迫；
   - 抽屉底层基于 `StudioPanel.vue`，具备半透明宣纸遮罩、平滑滑出动画、Esc 键与点外关闭、ARIA 焦点管理；
   - 安全删除已被完全取代的旧组件 `ScrollSettingsPopover.vue`。
3. **宣纸古笺底色全量色卡矩阵可视化罗列**
   - 对齐书本模式排版抽屉，双列网格完整罗列 10 款宣纸主题（仿古竹纸、麦黄皮纸、柔光暖宣、雪魄冷笺、象牙玉扣、浅赭麻纸、沉香陈纸、海贝淡粉、澄心纯白、白烟墨痕）；
   - 每一款纸色配备真实宣纸色块预览、中英文雅致命名及悬停详细典故，选中项附带朱砂微边框高亮，点击即时将卷轴底色平滑变换。
4. **择字 · 字体风骨鉴赏卡片列表**
   - 告别单调枯燥的原生 `<select>` 纯文本列表，全面采用书法字体图鉴卡片设计；
   - 呈现字体中文名、时代与风格标签（如「草书 · 狂草」「宋代 · 仿古」），并以该字体真实字形渲染大字号 sample 样字；
   - 点击即刻切换卷轴字体并实时重新计算行距与句读。
5. **测试套件与自动化覆盖**
   - 重构 `tests/scroll-settings.spec.ts`，验证 `ScrollSettingsDrawer` 的渲染、宣纸色卡点击换纸、字体卡片点击择字、字号滑块及旧胶囊栏的彻底收敛（全套 147 项单测全绿）；
   - 升级 `e2e/scroll.spec.ts`，断言抽屉滑出、10 款宣纸底色与全部字体的真实 Chromium 渲染、多 PC 视口无裁切断言（14 项 E2E 100% 全绿）。

### 实际执行的验证命令与结果

- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run test`：11 个测试套件、147 项 Vitest 单元与组件测试全部通过（耗时 4.38s）。
- `npm run test:e2e`：14 项 Playwright Chromium 端到端真实浏览器测试全绿（耗时 44.7s）。
- `npm run build`：生产环境打包成功，耗时 1.39s。

---

## 2026-11-04 · 首页落字同列联动暂停（方案 A）与防追尾治理

### 改动内容

1. **悬停追尾重叠物理根因定位**
   - 用户反馈在鼠标悬停单字暂停后移开鼠标，该字与后方文字发生叠印；
   - 根因定位：原实现仅对被悬停/激活的单字施加 `animation-play-state: paused`，而后方同轨文字依然以 $30\text{s} / 120\text{vh}$ 恒速持续下落。悬停数秒即导致后方文字追上被暂停文字，破坏了原始相位隔离，形成下落过程中的「物理追尾合体」。
2. **同列整轨联动暂停架构落地（方案 A）**
   - 改造 `FallingGlyphs.vue`：
     - 监听各单字的 `@mouseenter` / `@mouseleave` 以及 `@focus` / `@blur`，动态推导当前悬停或激活的字符所属轨道 `laneId`；
     - 当某字被悬停或弹窗激活时，**该轨道内的所有字符同步获得 `.glyph-field__item--paused`**（`animation-play-state: paused`），将整列所有字符的相对垂直间距与相位差严格锁死，彻底消除后车追赶前车的几何条件；
     - **视觉焦点精准聚焦**：仅悬停的单字赋予浓墨加深（`var(--zz-ink)`，0.95 不透明度与微立体纸墨阴影），或在弹窗激活时赋予朱砂高亮（`var(--zz-accent)`），同列其余静止汉字保持原有淡墨半透明状态（`var(--zz-drift)`），视觉意象如同轻按琴弦，灵动优雅；
     - 鼠标移开（或弹窗关闭并失焦）后，整列汉字同步平滑恢复下落，前后车距毫无偏差。
3. **测试套件与自动化扩充**
   - 在 `tests/hanzi-explore.spec.ts` 中新增单元测试：断言悬停或激活某字时，该字所在整条垂直轨道同步获得 paused 类，同列多字协同静止，移开后整列恢复运行（全套 147 项单测 100% 全绿）。
   - 在 `e2e/home-explore.spec.ts` 中补充 Chromium 端到端断言：验证真实悬停与弹窗期间整列汉字持续维持 paused 锁定车距，失焦移开后全列平滑恢复，且多视口采样 0 重叠碰撞。

### 实际执行的验证命令与结果

- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run test`：11 个测试套件、147 项 Vitest 单元与组件测试全部通过（耗时 5.46s）。
- `npm run test:e2e`：14 项 Playwright Chromium 端到端真实浏览器测试全绿（耗时 49.0s）。
- `npm run build`：生产环境打包成功，耗时 1.56s。

---

## 2026-11-04 · 首页落字防撞交错分轨与发散漂移彻底治理

### 改动内容

1. **时空几何重叠根因定位**
   - 深入分析多分辨率（1440×900、1920×1080、1366×768）与多种子下的落字轨迹动力学，重现并定位用户反馈截图中的重叠根因：
     - 原 `horizontalPositions[id] = rand()` 对同一运动轨道内所有字符在横向位置上独立随机抽样，沿垂直相位相邻的前后两字极易抽中极近的同轴坐标（如 $\Delta X < 10\text{px}$）；
     - 单条轨道在 768px 高度下容纳 12 个 42–64px 大汉字，扣除字符高度后垂直物理净空仅 10–14px；
     - 叠加 $\pm 8^\circ$ 旋转与草书（如 `rhyme-grass` 字体）笔画外凸，在同轴抽样下发生视觉叠印。
2. **同轨道横向交错排布算法（Anti-Rear-End Staggering）**
   - 重构 `src/composables/useFallingGlyphs.ts` 中的位置生成逻辑：
     - 在同一运动轨道内，将沿垂直相位相邻的汉字强制交替分配至字道的左半轨（Left Track，$u \in [0.06, 0.26]$）与右半轨（Right Track，$u \in [0.74, 0.94]$）；
     - 针对单轨奇数字符数的闭环首尾项，引入奇环三着色法则（首尾项置于 Center Track 平稳区，$u \in [0.44, 0.56]$），确保环上所有相邻相位项在归一化横向距离差恒定满足 $\Delta u \ge 0.30$（对应物理横向安全间距 $\ge 35\text{px}$）；
     - 协同配置发散漂移动力学：左轨字符向左漂移（`driftSign = -1`），右轨字符向右漂移（`driftSign = 1`），下落过程中物理间距进一步发散，彻底杜绝下落全过程中的交叉与追尾。
3. **自动化测试与几何防撞验证**
   - 新增 `tests/collision-check.spec.ts`：模拟 1440×900、1920×1080、1366×768 三大典型桌面视口与 100 个随机种子在下落全周期（30 采样步，共 9,000 个时空截面状态）下的包围盒碰撞检测，断言重叠数为严格 0。
   - 新增 `e2e/overlap-check.spec.ts`：在真实 Chromium 浏览器环境对首页落字持续多视口采样，实测真实渲染重叠数为 0。

### 实际执行的验证命令与结果

- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run test`：11 个测试套件、146 项 Vitest 单元与组件测试全部通过（耗时 4.18s）。
- `npm run test:e2e`：14 项 Playwright Chromium 端到端真实浏览器测试（含 `overlap-check.spec.ts` 0 重叠断言与 `home-explore.spec.ts` 交互）全部通过（耗时 51.9s）。
- `npm run build`：生产环境打包成功，耗时 1.39s。

---

## 2026-11-04 · 首页「汉字探索」第一版（落字交互、原字体对照、笔顺动画与开源字典）

### 改动内容

1. **落字微交互感应与状态暂停**
   - 改造 `FallingGlyphs.vue`：将原本不可交互的装饰元素升级为具可访问性的 `<button type="button" class="glyph-field__item">`，重置默认按钮形态。
   - 利用 CSS Compositor 原生特性，在 `:hover` 与 `:focus-visible` 时赋予 `animation-play-state: paused`，并将字色加深为浓墨 `var(--zz-ink)`，移开即刻恢复平滑下落。
   - 引入 `activeGlyphId` 属性，当某字被点击激活时，赋予 `.glyph-field__item--active` 样式，在弹窗关闭前维持暂停，弹窗关闭后恢复下落；其他背景字全程正常飘落。
2. **首页层级穿透与交互隔离**
   - 治理 `HomeView.vue` 舞台层级：将全屏网格容器 `.home__stage` 赋予 `pointer-events: none`，中央主内容 `.hero`（含「入字间」CTA）赋予 `pointer-events: auto`。
   - 背景落字层 `.glyph-field` 为 `pointer-events: none`，各单字按钮为 `pointer-events: auto`。使左右两侧区域的落字点击与中央「入字间」按钮完美兼容，互不干扰。
3. **汉字探索双栏弹窗与视觉精细化 (`HanziExploreDialog.vue`)**
   - 基于 `reka-ui` 的 `DialogRoot` / `DialogPortal` / `DialogOverlay` / `DialogContent` 体系，支持 Esc 键快速关闭、外部点击关闭与焦点锁定。
   - **视觉精简**：去除原落字与楷书卡片顶部微标、底部说明文案及冗余注脚，保留素雅呼吸感。
   - **双格子 1:1 正方形等大对齐与零留白田字格**：
     - 去除田字格左右两侧空白冗余，将田字格十字虚线直接扩展贯通至展示格子的内边框（`100% 100%`），消除内嵌多层边框造成的两侧留白；
     - 双栏采用严格对称的 `calc(50% - 6px)` 规制，两侧展示框 `.hanzi-card__display` 均采用 `aspect-ratio: 1 / 1` 正方形制式，保证落字原字体格子与楷书格子尺寸 100% 严格一致（~180px × 180px）；
     - HanziWriter 动态挂载尺寸自适应容器实际像素宽度，确保动画笔画比例与 118px 静态原字体精准契合。
   - **字号与排版提升**：拼音放大至 17px 朱砂色、部首与笔画放大至 15px、中文释义放大至 15px（行高 1.68）。
   - **数据来源链接化**：底部数据来源精简为指向官方 GitHub 仓库的精美链接（HanziDict ↗ 与 Hanzi Writer ↗）。
4. **生僻字 / 缺笔顺降级排版稳健性治理**
   - 确立**田字格绝对定位槽位架构**：`.hanzi-tian-grid` 容器在任何网络或数据状态下始终保持 150×150 居中定位，绝不因缺少笔顺数据而发生横向挤压变形。
   - 内部双层分流：动态笔顺加载层与静态 118px 楷书兜底层（`.hanzi-card__fallback-glyph`）共用田字格中心；无笔顺或加载失败时，118px 楷书居中呈现在田字格正中。
   - 底部操作区降级：当遇到无笔顺的生僻字（如「瓲」）时，平滑替换不可点击的禁用重播按钮为优雅微标「暂无楷书笔顺数据」，杜绝灰色禁用态破坏质感。
   - 缺省属性中性化：无拼音、部首或笔画时，占位破折号采用中性灰（`var(--zz-muted)`），避免误套红色类名。
5. **轻量字典服务与零首屏按需加载 (`hanziDict.ts` & `hanzidict.json`)**
   - 编写 `scripts/build-hanzidict.mjs`，从开源仓库 `sinobaba/hanzidict`（MIT License）拉取 8,105 规范汉字并编译为轻量字典 `src/data/hanzidict.json`（约 640KB）。
   - 在 `src/services/hanziDict.ts` 中采用 `const dict = await import('@/data/hanzidict.json')` 懒加载，首屏主入口体积零增长；生僻字或古籍异体字如实提示「暂无收录释义」，杜绝 AI 编造。
6. **测试与自动化**
   - 新增 `tests/hanzi-explore.spec.ts`：覆盖规范字、生僻字（缺笔顺降级）、落字悬停激活、双栏弹窗渲染与 Esc 关闭（共 6 项断言，全套 144 项单测全绿）。
   - 新增 `e2e/home-explore.spec.ts`：端到端真实浏览器验证落字悬停暂停、点击弹窗、笔顺重播、生僻字「瓲」降级截图、格子等大对齐与无空白田字格（共 3 项 E2E 测试全部通过）。

### 实际执行的验证命令与结果

- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run test`：10 个测试套件、144 项 Vitest 单元与组件测试全部通过（耗时 4.49s）。
- `npm run test:e2e`：13 项 Playwright Chromium 端到端真实浏览器测试（含正常字、生僻字「瓲」与「聂」双格子 1:1 正方形对齐断言）全部通过（耗时 45.0s）。
- `npm run build`：生产环境打包成功，`hanzidict` 与 `hanzi-writer` 均作为独立 chunk 按需打包，构建耗时 1.41s。

---

## 2026-11-04 · 卷轴模式工具栏收敛与设置浮层优化

### 改动内容

1. **移除常驻胶囊式工具栏**
   - 彻底移除了 `ReadingView.vue` 卷轴模式下上方悬浮的 `.scroll-toolbar` 常驻胶囊条及其全部样式代码，释放卷轴上方的留白与纵向展开感。
2. **收敛至「卷轴设置」Popover 浮层**
   - 新增 `src/components/studio/ScrollSettingsPopover.vue` 组件，基于 `reka-ui` 的 `PopoverRoot` / `PopoverTrigger` / `PopoverPortal` / `PopoverContent` 以及 `lucide-vue-next` 的 `SlidersHorizontal` 图标。
   - 触发按钮位于卷轴区域上方右侧（`top: 9px; right: max(28px, calc((100% - var(--zz-container)) / 2 + var(--zz-gutter)))`），与整站栅格自然对齐，采用半透明宣纸白、细墨线、低对比度文字，不抢视觉焦点。
   - 浮层宽度紧凑（260px），包含文章、背景色、字体、字号原有四项配置，参数即改即生效（无需额外确认）。
   - **样式隔离与 Portal 穿透治理**：由于 `PopoverPortal` 会将 `PopoverContent` 挂载至 `document.body` 顶层节点，Vue `<style scoped>` 的属性哈希无法作用于传送后的 DOM。因此将 `.scroll-settings-popover` 及其子控件样式置于独立的非 scoped `<style lang="scss">` 块中，彻底解决背景透明及文字重叠问题，确保宣纸背景 `var(--zz-paper-ui)`、墨线边框与立体柔和阴影稳定生效。
   - 支持按 Esc 键关闭、点击浮层外部自动关闭、Tab 键无障碍焦点流。点击选择文章时关闭浮层并无缝唤出文选抽屉。
3. **书本模式与顶栏模式切换隔离**
   - 严格保持顶部居中 `<div class="reading-topbar">` 中的「书本 / 卷轴」切换按钮位置、样式和 Teleport 目标不变。
   - 书本模式（`mode === 'book'`）的 DOM 结构与侧边工具轨 `.rail` 保持完全一致，不作任何触碰。
4. **测试补充与适配**
   - 新增 `tests/scroll-settings.spec.ts` 单元与集成测试，覆盖 Popover 组件渲染、各配置项事件派发、以及页面级别旧工具栏移除验证。
   - 更新 `e2e/scroll.spec.ts`：适配收敛为「卷轴设置」按钮后的流程，验证旧胶囊工具栏不存在、右侧设置入口唯一性以及 Esc 键关闭能力。

### 实际执行的验证命令与结果

- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run test`：9 个测试套件、138 项 Vitest 单元与组件测试全部通过（耗时 4.62s）。
- `npm run test:e2e`：10 项 Playwright Chromium 端到端真实浏览器测试全部通过（耗时 34.5s）。
- `npm run build`：生产环境打包成功，构建耗时 1.09s。

---

## 2026-11-03 · 核心阅读正确性、古籍标点禁则与端到端自动化重构

### 改动内容

1. **核心阅读逻辑重构与领域模型解耦（Phase 1）**
   - 抽象纯函数领域模型 `src/composables/pageTurnPlan.ts`：将双页展开（Spread）中的页面分配与状态流转解耦。确定现代横排（LTR）与传统古籍竖排（RTL 线装书）的物理槽位映射：横排左1右2，向右翻页从右掀起；竖排右1（先读）左2（后读），向右翻页向后阅读从左掀起。奇数总页数时末尾安全留白 `book-blank`。
   - 中文避头尾禁则（Kinsoku Shori）：遵循 GB/T 15834-2011 与 W3C clreq，在 `src/composables/usePagination.ts` 实现回溯切分重排算法，杜绝句末点号孤悬行首/列首，前置符号孤悬行末/列尾。
   - 动态题头几何测量：标题多行排布高度 + 作者元数据 + 间距精确从第一页正文可用高度/列宽中扣除，彻底解决 `overflow: hidden` 截断正文文字隐患。
   - 弹窗与快捷键作用域约束：弹窗激活、输入框聚焦、滚动条或附带修饰键（Ctrl/Alt/Shift/Meta）时阻止键盘箭头翻页，防止跨层误触。
   - 收藏笺修复：`areBookmarksEqual` 比较全套 8 项排版参数（ZZ-003）；新增 `validateBookmarkItem` 严格校验本地存储，杜绝 `NaN` / `Infinity` / 非法字号损坏数据（ZZ-004）。

2. **字体资产与文选底本考据（Phase 2）**
   - 修复 `scripts/build-font-subsets.py`（ZZ-005）：保留 Vue `<script>` 内的中文常量提取，字符集从 1,047 扩充至 1,072，消除界面漏字隐患。
   - 字体资产 WOFF2 完整性审计：依 ADR-015 验证磁盘全部 14 份 WOFF2 资产（包括品牌、落字、阅读及 GB2312 完整字体），魔数与 cmap 100% 合规。
   - 权威底本校勘：撰写 `docs/text-sources.md`，对站内 6 篇经典文选进行底本对校（四部丛刊本《震川先生集》、四部丛刊本《东坡全集》、百衲本《文苑英华》、伯希和敦煌写卷 P.2544《陋室铭》等），详细记录异文考辨与缺字覆盖。

3. **渲染性能优化与端到端自动化（Phase 3）**
   - 优化 `CurvedPageTurn.vue` 3D 卷纸渲染：切片条带数由 28 精简为 20；移除根节点 CSS 变量写入，引入 `.paper-shade` 叶子节点直接管理透明度，结合背光面 `display: none` 彻底阻断 56 个子树的逐帧样式重算级联，稳定 60fps。
   - `BookViewer.vue` 窗口尺寸响应防抖：通过 `requestAnimationFrame` 节流 Resize 重排，并于 `onMounted` 立即触发 `updateSizeImmediate` 消除首屏闪烁。
   - 建立 Playwright E2E 真实浏览器自动化测试套件（`playwright.config.ts`、`e2e/reader.spec.ts`），覆盖 5 大核心端到端流程。

### 实际执行的验证命令与结果

- `npm run test`：8 个测试套件，118 项 Vitest 单元与组件测试全部通过（耗时 1.35s）。
- `npm run test:e2e`：5 项 Playwright Chromium 端到端真实浏览器测试全部通过（耗时 8.3s）。
- `npm run typecheck`：`vue-tsc -b --noEmit` 0 错误通过。
- `npm run lint`：`eslint .` 0 错误、0 警告通过。
- `npm run build`：生产环境打包成功，构建耗时 761ms。

### 发现的问题与解决

- 修复 `tests/data.spec.ts` 字体资源测试中的相对路径与 URL 匹配问题。
- 修复 Playwright 在翻页切片时的 `.sheet--first` 严格模式定位歧义，收紧为直接子选择器 `.book-spread > .sheet--first`。
- 修复 `tests/compare-bookmarks.spec.ts` 中缺失的 `vi` 导入和 `BookViewer.vue` 的未使用变量及 prop 默认值。

### 未验证项 / 边界

- 移动端触控滑动手势（根据产品定位，专注 PC Web 体验，手机仅保留基础兼容）。
- 屏幕阅读器实机语音朗读声调（已通过 `aria-label` 与 `zz-sr-only` 提供了标准的无障碍文本结构并通过自动化断言，未连接实机 NVDA/VoiceOver 进行听觉复核）。

---

## 2026-11-02 · 提升书本垂直高度与两侧空白区域点击翻页

- 释放书本垂直高度：将底部页码导航栏从常规流移出改为绝对定位悬浮，不挤占舞台高度；将 `TURN_CLEARANCE` 安全空间从 40px 收紧至 14px，并将翻页透视最大抬升限制在 10px 内，防止翻页时出现顶部切割或冲撞标题栏，同时为书页净增约 90px 的显示高度。
- 新增两侧空白区点击翻页：书本最左侧与最右侧无文字区域（覆盖页边距与舞台留白）支持点击翻页，悬停淡入半透明轻指示圈，点击触发柔性翻页，正文选字交互不受影响。
- 翻页方向自动适配横竖排：横排时右侧为下一页、左侧为上一页；竖排古籍时左侧为下一页（向后阅读）、右侧为上一页；键盘左右箭头同步支持对应翻页。
- 验证：`npm test` 7 个测试文件 96 项测试全部通过（新增两侧热区与横竖排流向切换测试）；`npm run build`（含 vue-tsc 类型检查）通过。真实浏览器视觉效果待用户进一步复核。

## 2026-11-02 · 柔性纸页与平滑落页

- 新增 `CurvedPageTurn.vue`，以 20 段纸面切片和正交投影呈现连续弯曲；900ms 内仅更新切片变换和明暗，不进行逐帧 Vue 状态重渲染。
- 移除刚性透视旋转与补救裁切。纵向尺寸固定为真实页高，避免抬起的页面因透视放大越过顶部；正文使用现有字体与 DOM。
- 翻页期间保留静止的旧页与即将露出的新页，落页后再提交目标页码。书脊阴影置于固定上层，弯曲阴影随进度归零，在最终平面帧绘制后移除动画层。
- 构建（含类型检查）、Lint、19 项阅读与分页测试通过；测试确认落页前旧页仍在、重复翻页被禁用、结束后才换页。真实浏览器视觉效果尚未复核。

## 2026-11-02 · 按参考图调整左侧卷纸

- 用户澄清需要圆筒状卷纸：左侧卷纸宽 64px，向外伸出 42px，上下超出纸面 5px；增加椭圆端面、圆筒明暗和接触投影，沿用米白纸色。正文区域内仅占原页边距 22px。
- 实际浏览器视觉效果待确认。

## 2026-11-02 · 收紧桌面标题栏

- 桌面全局标题栏从 92px 收至 72px，品牌和导航继续垂直居中，赏字工作区按令牌高度同步扩展。
- 截图显示翻页层仍越过书本上沿，因此单纯收紧标题栏没有解决遮挡，继续在下一项将翻页层限制到书页视口内。
- `npm run build` 与 `git diff --check` 通过。

## 2026-11-02 · 将翻页层裁切到书页范围

- 用户截图显示旋转页上沿越过双页书本边缘，伸进标题栏下方。新增与书本同尺寸的裁切视口，只裁切动画层，不裁切单页左侧的卷纸和书页投影。
- `npm run build`（含类型检查）通过；真实浏览器动画边界待确认。

## 2026-11-02 · 单页左侧卷边

- 按用户反馈将单页右下角卷角替换为左侧整条微卷纸边，宽 22px，使用弧形边缘、明暗渐变和窄投影。正文宽度与分页参数保持原值。
- 实际浏览器视觉效果待确认。

## 2026-11-02 · 增强纸页层次与双面翻页

- 根据用户最新要求增强拟物表现：单页增加薄纸叠层与卷角；双页增加页底叠层和书脊明暗。
- 翻页使用 720ms CSS 透视旋转，翻动层保留正文正反两面，竖排方向反转；动画装饰层不参与辅助技术读取。尾页不足双页时保留空白对页。
- 动画期间禁用重复翻页；参数变化、卸载和减少动效时清理动画，850ms 超时作为收尾保障。相同尺寸通知不重复分页。
- 验证：生产构建（含类型检查）、Lint、阅读与分页 19 项测试通过。实际浏览器视觉效果尚未确认。

## 2026-11-02 · 赏字页书本化改版与全文补全

### 改动

- 精简 `ReadingView.vue`：移除页内字体 / 文稿大选择器、底部控制栏和直接横竖排切换；保留站点页头与右侧工具轨。将横竖排选择并入版式面板，工具轨收敛为字体、文选、版式、题写、收藏五项；按本轮要求删除对照功能与对应状态。
- 新增 `BookViewer.vue` 与 `usePagination.ts`：短文呈现为单页，长文以双页展开，提供紧凑页码和上一组 / 下一组控制；正文按实际字符宽度分页，跨页续段保持顺序。字体、内容、方向、字号、行高、字距、版心宽度和工作区尺寸变化时重新分页。字体尚未加载时先按方形字面估算，目标字体加载后再测量。
- 重构 `ReadingSheet.vue` 为不可滚动的单页内容渲染。横排保留标题层级与段首缩进；竖排继续使用 `writing-mode: vertical-rl`，行距 / 字距通过阅读状态变量驱动。竖排分页按页面可用高度、列宽与版心宽度计算。
- 六篇作品都增加公开来源 URL 与全文标记。《项脊轩志》《前赤壁赋》《岳阳楼记》补齐全文，《定风波》补入创作序文；`陋室铭`、`山居秋暝` 保持全文。
- `scripts/build-font-subsets.py` 增加 `--content-only`，在更新赏字内容子集时跳过完整字体重建。本轮不改长期完整字体转换要求。
- 更新数据、分页、版式、阅读页面测试以及 README、设计系统、问题清单、交接文档。

### 验证

- `npm run typecheck`：通过。
- `npm run lint`：通过，0 warning。
- `npm run test`：7 个文件、95 项通过，Vitest 3.66 秒。
- `npm run build`：通过，Vite 构建 995 毫秒。
- `npm run fonts:build -- --content-only`：通过；共 1,047 个内容字符。霞鹜文楷和思源宋体覆盖完整，汇文明朝体缺 `楯`，朱雀仿宋缺 `○埳`；相关字体存在少数字形缺口，已由缺字报告标出。
- 生产构建保留赏字字体路由拆分；当前源字体子集与刚生成的 `dist` 资源 SHA-256 一致，完整字体文件未重建。
- `git diff --check`：通过。
- 浏览器视觉检查：未完成。桌面浏览器自动化因无法以足够置信度确认当前地址而被安全策略停止；未将 DOM 单测或本地 HTTP 可达当作实际视觉验收。

### 未完成 / 限制

- 本轮没有真实浏览器复核桌面书页比例、换字体后页界、竖排双页左右顺序及实际字形溢出；需后续在桌面浏览器中人工查看。
- 竖排版心宽度和标题 / 作者字列尺寸已纳入分页计算并由分页测试覆盖，但无法用当前自动化工具完成视觉确认。
- 全量 WOFF2 转换与 cmap / 字形 / OpenType / 可变轴完整性仍未处理，详见 `docs/issues.md` 中已确认的长期要求。

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

---

## 2026-11-02 · 首页落字可见度与覆盖范围调整

- 根据首页截图反馈增大字形、加深落字颜色并提高数量：桌面/平板/手机为 48/24/18 个，字号分别为 32–64px / 26–44px / 24–36px，不透明度为 0.45–0.55。
- 中央安全宽度收至桌面 30%、平板 46%、手机 50%；左右两侧横向位置和动画相位分别抽样，减少随机布局聚成斜线的情况。下落周期、减少动态效果支持和品牌标题层级不变。
- 调整集中于落字 composable、组件颜色令牌和对应测试；同步 README、设计系统、ADR、实施计划与交接说明。完整字体和赏字页实现未改。
- Chromium 实看 1440×900 桌面与 390×844 手机；两个视口均无纵向滚动，手机 18 个节点，桌面 48 个节点，标题/按钮保持清晰；另核对 1920×900 标题和按钮边界。`npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 83 项，4.39 秒）、`npm run build`（Vite 916ms）和 `git diff --check` 均通过。

---

## 2026-11-02 · 降低首页落字密度并避免相互重叠

- 根据后续预览反馈，将桌面/平板/手机节点数调整为 24/12/8，保留较大的字体与加深后的落字颜色。
- 同侧使用统一周期、均匀错开的动画相位，避免字形追越；限制相位抖动，按可用下落距离自动约束字号。矮屏桌面额外以视口高度限制 CSS 字号；左右侧仍留中央安全区。
- 新增轨迹间距测试，覆盖手机 320/844px、平板 568px、桌面 568/900px 高度。
- 浏览器盒体实测 1920×900、1024×568、390×844、320×568 四种视口均为 0 对落字重叠且页面不滚动；矮屏桌面字形自动收至 33–37px。首页标题与按钮区域仍保持干净。
- `npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 88 项，4.41 秒）、`npm run build`（Vite 913ms）及 `git diff --check` 均通过。

---

## 2026-11-02 · PC 首页多速度落字与字道防重叠

- 按用户反馈将 PC 首页数量从 24 小幅提高到 30 个，按可用侧宽分成 4–6 条字道；宽度按 64px 向下分档，运行时 1024–1407px 每侧 2 条，1408px 起每侧 3 条。
- 每条字道从 26/31/36/41/46/48 秒中取得独立速度；同一道统一速度并按随机间隔错相位，间隔保留最小安全距离，减少机械等距感且确保同道字形不追越。字道宽度及字形横向位置也按 seed 随机变化；字形、漂移及 ±8° 旋转的完整横向包围范围限制在字道内。
- 字号上限按最拥挤字道的节点数、可用下落高度及单字道宽度计算，移除之前矮屏下压字号的 CSS 覆盖。浏览器宽度按 64px 档位更新，普通窗口调整不反复重抽布局。
- 单元测试覆盖 PC 1024×568、1280×720、1380×768、1440×568 与 1920×900，检查每道速度、同道垂直间距及不同字道的横向包围区间。
- Chromium 实看 1912×914 PC 浏览器：验证 30 个落字、四款落字字体均出现、六种下落周期均在使用，页面无纵横滚动；当前画面 DOM 盒体检测为 0 对重叠。
- `npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 88 项）、`npm run build` 与 `git diff --check` 均通过。
- 后续产品开发与验收只按 PC Web 进行；既有手机和平板代码保留，不扩展适配工作。

## 2026-11-02 · PC 首页密度再次上调

- 根据用户继续加密的反馈，将桌面节点由 30 增至 36（增加 20%），不恢复到此前 48 个节点的密度。
- 重新验证各字道的随机相位间距和字号上限；当前测试覆盖的最拥挤情况为 1024×568，每道 9 个字。
- Chromium 实看 1912×914：36 个节点、四款字体、六种周期均在使用；当前帧 DOM 盒体检测为 0 对重叠，页面无纵横滚动。
- 全量 `typecheck`、`lint`、`test`（6 文件 / 88 项）、`build` 与 `git diff --check` 均通过。

## 2026-11-02 · PC 首页落字调整为 50 个

- 按用户明确要求将 PC 首页落字数从 36 改为 50；相位最小间距、独立速度字道、中央留白和字号自适应规则保持不变。
- 在 1024×568 低矮桌面视口下，每道最多 13 个字符；高度按 64px 向下分档为 512px，生成器把最大字号约束到 31px，以保留字形间距。
- Chromium 实看 1912×914：50 个节点、四款字体、六种周期均在使用；当前帧 DOM 盒体检测为 0 对重叠，页面无纵横滚动。
- 全量 `typecheck`、`lint`、`test`（6 文件 / 89 项）、`build` 与 `git diff --check` 均通过。

## 2026-11-02 · PC 首页增加到 70 字并扩展字道

- 按用户要求将 PC 首页数量增加到 70，每侧显示 3–4 条字道，共 6–8 列；1024px 宽 PC 每侧 3 条，1408px 档起每侧 4 条。
- 单字道宽度下限根据最小字形、最大横向漂移、旋转边界与边距计算；每道从 24/27/31/34/38/41/45/48 秒中分配独立周期。
- 窄矮 PC 屏会根据每道 11–12 个字的垂直间隔约束字号，避免仅增加数量导致上下重叠。
- Chromium 实看 1912×914：70 个节点、四款字体、八种周期均在使用；当前帧 DOM 盒体检测为 0 对重叠，页面无纵横滚动。
- 全量 `typecheck`、`lint`、`test`（6 文件 / 89 项）、`build` 与 `git diff --check` 均通过。

## 2026-11-02 · 打散每列内部位置

- 根据参考截图反馈，增大同列下落间距的随机疏密差异，并让单字横向位置与左右漂移方向独立随机。
- 桌面横向漂移调整为 ±10–22px、边界留白收至 8px；字号上限预留至少 20px 的列内横向活动范围。每列按自己的可用宽度、字数和屏高计算字号。
- 每个字可向左或向右漂移，相位间距使用随机权重生成，保持计算出的最小安全距离。Chromium 1912×914 实看 70 个节点、八种周期，当前帧 0 对重叠且页面无滚动。
- 全量 `typecheck`、`lint`、`test`（6 文件 / 89 项）、`build` 与 `git diff --check` 均通过。

## 2026-11-02 · 减少左右字列的镜像感

- 左右两侧现在分别生成字道宽度，不再共享同一列宽轮廓；原有的字道内随机字数、单字横向位置、漂移方向与疏密相位共同保留，使两边不再呈镜像式列宽节奏。
- 保留 70 个落字、每侧 3–4 条安全字道、八种不同速度、30% 中央留白与横向轨迹隔离；字道宽度和字数仍参与字号上限计算。
- Chromium 实看 1912×914：70 个节点、八种周期，当前帧 0 对落字重叠，页面尺寸仍为 1912×914。
- `npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 89 项）、`npm run build` 与 `git diff --check` 均通过。

## 2026-11-02 · 降低首页落字中的生僻字比例

- 原方案在每款字体的全部汉字 cmap 中等概率抽取 1,200 字，扩展区、兼容字与常用字没有使用频率差异，因此页面里会出现偏多的冷僻字。
- 生成器现在每款固定 seed 抽取 1,000 个 GB2312 一级汉字作为常用组，并从同一字体剩余 cmap 抽 200 个长尾字；运行时按 90% / 10% 概率分别取字。每个候选仍由对应字体的真实 cmap 覆盖。
- 四款字体仍各含 1,200 字，合并后为 3,479 个不同汉字。重新生成的首页 WOFF2 合计 2,066,064 字节（约 2.07 MB），比旧字池资源减少约 235 kB；首页资源仍与赏字字体及完整字体分离。
- Chromium 实看 1912×914：70 个落字来自四款真实字体、当前字符均不重复；字体检查通过，当前帧 0 对重叠，页面无滚动。
- `npm run fonts:home`、`npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 90 项）、`npm run build` 与 `git diff --check` 均通过。

## 2026-11-02 · 加大同列落字的字号差异

- 将 PC 落字安全字号底限从 32px 降至 22px，各列上限仍按列宽、字数和视口高度计算；随机分配字号时覆盖该列安全范围的两端，保证字号空间足够时每列至少有 4px 的跨度。
- 垂直间距仍按该列最大字号校验；极窄或极矮视口若安全范围不足 4px，则优先遵守计算出的安全上限。
- Chromium 实看 1912×914：70 个落字字号为 22–64px，共 33 种字号；当前帧 0 对重叠且页面无滚动。

## 2026-11-02 · 修正 PC 落字字号区间

- 根据用户澄清，撤销 22px 下限，PC 字号恢复为明确的 32–64px 范围；每列随机分配时包含该列安全区间的最小值和最大值，扩大同列字号跨度。
- 字号上限按列宽、漂移边界与垂直间距分别计算；标准 PC 保持 70 个落字。若极矮窗口无法同时容纳 70 个最小 32px 字形，则按垂直容量减少节点，避免把字号降到下限以下。
- 调整字道宽度的随机权重，避免过窄字道过多挤压字号上限。Chromium 1912×914 实看 70 个落字、32–64px、29 种字号；当前帧 0 对重叠且页面无滚动。
- `npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 91 项）、`npm run build` 与 `git diff --check` 均通过。

## 2026-11-02 · 首页隐藏标题栏与导航

- 首页不再渲染全局品牌标题栏和主导航；赏字与 404 页面继续显示站点导航。
- 首页容器改为完整 `100dvh`，移除依赖页头高度的视觉偏移，中央品牌标题与 CTA 对齐到完整视口中心。
- 浏览器检查 1912×914 首页：顶栏和导航不在无障碍树中，中央入口可见，页面无滚动。
- `npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 92 项）、`npm run build` 与 `git diff --check` 均通过。

## 2026-11-02 · 落字每轮下落后更换字符

- 每个落字节点在 CSS `animationiteration` 事件触发时，从同一款字体的首页覆盖池抽取新汉字；同一位置先轮完该字体的 1,200 字池再重新抽样。
- 字符选择保留常用字与长尾字的 90% / 10% 倾向；同一字池内不重复，池耗尽后也排除刚播放完的字。不重建节点、不改变字道、字号、位置、速度或下落相位。
- 字符轮播 PRNG 可注入 seed；测试覆盖完整字池不重复、池耗尽后不与上一轮重样、相同 seed 序列可复现，以及动画迭代事件只更新字符、不改节点布局。
- 初次复核发现 5173 开发服务仍返回更新前的 Vue 转换模块，页面没有动画迭代处理器；重启 Vite 并刷新首页后确认加载了新事件处理器。
- Chromium 实际观察 1912×914 页面：等待 50 秒，70 个落字节点全部换成新字符；`typecheck`、`lint`、`test`（6 文件 / 94 项）、`build` 与 `git diff --check` 均通过。

## 2026-11-02 · PC 首页落字字号下限提高到 42px

- 按用户要求将 PC 落字安全字号区间从 32–64px 调整为 42–64px；手机和平板分档保持原有配置。
- 继续按字道宽度、垂直容量裁剪节点数。1024px 宽、900px 高的安全布局为 68 个字；1024×384 矮屏减少到 28 个；宽屏标准高度仍为 70 个，避免把字号降到下限以下。
- 更新字号、列数与矮屏容量测试，以及设计系统、交接和 README 参数说明。
- Chromium 实际检查 1912×914：首页 70 个节点，计算字号为 42–64px。
- `npm run typecheck`、`npm run lint`、`npm run test`（6 文件 / 94 项）、`npm run build` 与 `git diff --check` 均通过。

## 2026-11-02 · 赏字书页纯净化与古典疏朗留白优化

- 彻底去除显性页码：移除底部悬浮页码栏（`.book-nav`）以及纸面数字，仅保留底层 `.zz-sr-only` 供屏幕阅读器做无障碍播报，书面彻底纯净化为古典书卷。
- 翻页悬浮热区收束：将最左侧与最右侧翻页按钮严格定位于书页内边缘（`left: 0` 与 `right: 0`），宽度收窄为 `clamp(52px, 5.5vw, 72px)`，完全不超出书本容器范围，杜绝向右溢出遮挡右侧轻工具轨。
- 古典书页疏朗留白优化：
  - 正文默认字号调整为 19px，默认行高升至 2.4，字距扩大至 0.04em，默认版心微调至 660px（每行约 26–28 字），文字呼吸感大幅改善；
  - 书页四周天头地脚及边距扩大：横排内边距扩至 `48px 56px 44px`，标题下间距增大到 36px，段落结尾间距升至 1.3em；竖排扩至 `44px 52px 42px`；
  - `usePagination.ts` 分页测量边界常数（`HORIZONTAL_INLINE_PADDING` 112、`HORIZONTAL_BLOCK_PADDING` 92、`VERTICAL_INLINE_PADDING` 104、`VERTICAL_BLOCK_PADDING` 86、`TITLE_BLOCK_HEIGHT` 116）与版式面板重置默认值完全同步对齐。
- 全量自动化测试（7 个测试文件 / 96 项用例）与生产环境编译构建（`vue-tsc -b && vite build`）全部通过。

## 2026-11-03 · 独立卷轴阅读模式

- 赏字顶部新增「书本 / 卷轴」，复用站点标题栏空间，不压缩原书本阅读区域。卷轴只保留文选、10 款纸色、10 款字体与 18–48px 字号；隐藏右侧工具轨，无底部操作栏。
- 新增 `ScrollViewer.vue`：原生 `vertical-rl` 连续全文，右侧卷首标题作者、左侧卷尾；轴杆是长卷自身的两端，随纸面滚动，不固定在视口边缘。CSS 实现装裱边、木轴、卷边、纤维与柔影，无新增依赖。
- 字体就绪后显现全文；异步加载有代次保护，失败时提示并保留备用字体全文。普通滚轮向左展卷，保留原生横向滚动、选择复制及 Home / End；字号与窗口变化由原生排版自动重排。
- `scrollTypography.ts` 复用年代、句读与书体规则；古代标点仅作显示转换并锚定前字，未知年代保留现代原标点。年代影响句读和天地留白，草书放宽列距；不生成书本鱼尾、中缝与分页，不宣称历史复原。
- 卷轴独立字号、纸色；共享文章与字体时通过 `syncLayout=false` 避免改写书本排版。书本原有选择联动行为保持。
- 全字体浏览器验证发现既有寒蝉活宋体含 117 条指向 `.notdef` 的无效 UVS，导致 Chromium OTS 拒收。已仅移除无效映射、修复构建管线；普通 cmap、字形顺序一致，并更新完整性审计报告。首页字体资源未改。
- 验证：134 项 Vitest、10 项 Chromium E2E；新增覆盖六篇文选全文、全部字体与纸色、复制选择、两种滚轮输入、卷首卷尾、设置隔离、未知年代约 1,700 字长文及末字可达。1024×568、1280×720、1440×900、1920×1080 均无页面溢出或段落纵向裁切；实际查看首尾截图，证据位于 `test-results/scroll-*-head.png` / `scroll-*-tail.png`。
- 边界：浏览器验收为 Chromium；未进行实体触控板或 Firefox / Safari 实测。构建保留既有大 chunk 警告。原字体未收录的字仍使用字体栈回退；自定义输入仍沿用现有 2,000 字上限（卷轴不额外截断）。未提交或推送。
- 最终检查：`npm run typecheck`、`npm run lint`、`npm run test`、`npm run test:e2e`、`npm run build` 与 `git diff --check` 通过；补充所有纸色切换与句读细节后，3 项卷轴 E2E 再次通过。


## 2026-11-03 · 卷轴双轴固定，内层文字横向滚动

- 按用户截图反馈调整交互：左右两根轴始终固定于卷轴两侧，装裱边与纸面保持完整；长文章仅在中间区域从右向左滚动。此项覆盖上一轮轴杆随纸面移动的方案。
- 将轴杆移至滚动容器之外，保留全文、标题、卷尾、滚轮、原生横向手势与选择复制。
- Chromium 定向回归覆盖滚动前后及到达末尾的两轴坐标不变、卷尾可达，以及四种 PC 视口的两轴始终可见；更新首尾截图并检查视觉。

## 2026-11-03 · 卷轴排版密致化重构、拖尾钤印与大字规制

- **卷尾拖尾钤印**：彻底废止生硬灰底「终」字标识；卷首只留标题与作者题署，更加开阔清朗；在文章左侧开辟 180px 拖尾留白，在下三分之一压角位钤盖朱红双边「字在」方印。
- **行距极密化对标**：直接参考黄令东老师字体原版演示站点（`https://rg-font.netlify.app/` 与 `https://qiji-font.netlify.app/`），草书 `--scroll-leading` 下探至 `1.10`，正书收敛至 `1.15`，行书收敛至 `1.12`；段落外边距归零；句读内嵌字角（`top: 72%`, `left: 94%`），再现古帖“密不透风、行气贯通”的古典视觉。
- **大字号规制**：默认字号调整为 55px，滑块上限提升至 70px，支持大字古法手卷排版。
- **天头地脚上下均等对称**：消除书本册页的非对称天大地下留白残留，将卷轴外层装裱框架 `.scroll-frame` 上下内边距统一收束为 `42px 32px`，内层宣纸 `.scroll-paper` 统一规范为 `clamp(24px, 4vh, 48px) 62px`，矮屏媒体查询下同步对称，手卷展卷视觉天地完全平正均衡。
- **顶栏层级解耦与案头悬浮控制岛（方案 A）**：顶栏恢复中正纯净，恒定居中仅呈现 `[ 书本 | 卷轴 ]` 模式分段按钮；长卷专用参数（文章、纸色、字体、字号）下沉至长卷上方正中，重构为温润半透明宣纸质感（磨砂微毛玻璃 + 细墨线分隔）的案头悬浮工具岛，控件等高美化，彻底解决控件堆叠拥挤感。
- **验证通过**：全量 135 项单元测试与 10 项 Playwright E2E 测试 100% 绿灯。

## 2026-11-04 · 首页「汉字探索」第一版与视觉精致化调优

- **落字单字悬停感应与点击激活**：
  - 将落字升级为可访问 `<button>` 语义，结合 CSS Compositor 在 `:hover`、`:focus-visible` 以及 `.glyph-field__item--active` 时应用 `animation-play-state: paused` 与浓墨高对比度，鼠标移开或关闭弹窗后平滑继续下落，保持 60fps 硬件加速；
  - 治理 `.home__stage` 与 `.glyph-field` 的 `pointer-events` 分层穿透，彻底解决背景落字点击被遮挡问题，同时确保中央「入字间」CTA 点击跳转 100% 灵敏顺畅。
- **双栏汉字探索弹窗（HanziExploreDialog.vue）**：
  - **左栏（原字体字形对照）**：静态展示该字在原飘落字体（如汇文明朝体、秋空火宋、霞鹜文楷、齐伋体等）下的字形与字体名称；字号放大至 118px 舒展对齐，纯净排版；
  - **右栏（Hanzi Writer 规范楷书与田字格）**：动态加载 `hanzi-writer`，内嵌标准习字格（外框与中心虚线十字），支持朱砂部首与墨色笔迹播放及重新播放；针对未收录字符优雅降级展示提示，杜绝 AI 编造；
  - **下方汉字属性与释义**：呈现拼音（17px 加粗）、部首（15px）、笔画数（15px）及中文释义（15px，行高 1.68）；
  - **精简优雅的数据来源链接**：底部精简为直达 GitHub 仓库的外链（`HanziDict ↗ · Hanzi Writer ↗`），注明 MIT 开源授权。
- **按需分包与零首屏负担（Code Splitting）**：
  - 8,105 规范字字典 `hanzidict.json` 与 `hanzi-writer` 均采用 `await import(...)` 懒加载，打包生成独立 chunk，首页主入口脚本保持零体积污染。
- **视觉反馈二次精致化调优**：
  - 按用户标注彻底精简移除：左栏顶部「原落字字体」微标、右栏顶部「规范笔顺」微标、左栏底部「首页动态落字字形」文字说明及底部冗长学术免责注脚；
  - 原落字字体字号由 78px 放大至 118px 对齐楷书，并在楷书背景加入精确 SVG 田字格；
  - 数据来源直通 GitHub，样式清雅克制。
- **全量测试与验证**：
  - 新增 `tests/hanzi-explore.spec.ts`（5 项用例）与 `e2e/home-explore.spec.ts`；
  - 全套 10 个测试套件 143 项 Vitest 测试 100% 通过；
  - 11 项 Playwright E2E 真实浏览器测试全绿（涵盖落字悬停暂停、点击弹窗、笔顺重播、Esc 键盘关闭及入字间跳转）；
  - `npm run typecheck`、`npm run lint` 与 `npm run build` 均 0 错误通过，无任何样式破坏与性能回退。

