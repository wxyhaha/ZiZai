# 字在 ZiZai · 设计系统（落地版）

> 这是**实际写进代码**的规范，与 `docs/design-reference/DESIGN_SYSTEM.md`（设计提案）
> 的差异都在这里体现。所有令牌的唯一来源是 `src/styles/tokens.scss`。
>
> 最后更新：2026-11-02

---

## 1. 设计原则

站点视觉的全部重量压在**字形本身**上。除此之外的一切——纸色、细线、留白、
朱砂点缀——都只负责让字站在合适的位置，不争抢注意力。

由此推出的硬约束：

1. 不使用山水画、梅竹枝叶、卷轴边框、仿古底纹等装饰元素；
2. 阴影几乎不出现（全站只有书页与浮层两处，且都极轻）；
3. 圆角克制（2–7px），不做胶囊化、不做大圆角卡片；
4. 动效只用于两处：落字背景、页面淡入；不做 hover 弹跳、不做滚动揭示；
5. 中文排版以「字距」而非西文的 tracking 为节奏单位，标题普遍带 `0.2em` 以上字距。

---

## 2. 色彩

| 令牌 | 值 | 用途 |
|---|---|---|
| `--zz-paper` | `#F7F4EC` | 页面主背景 |
| `--zz-paper-deep` | `#EFE8DB` | 选中态、次级层次 |
| `--zz-paper-reading` | `#F6F1E7` | 阅读书页 |
| `--zz-paper-ui` | `#FBF9F4` | 弹层背景 |
| `--zz-paper-raised` | `#F9F6F0` | 下拉框、次级控件 |
| `--zz-paper-field` | `#FBF8F2` | 输入框 |
| `--zz-ink` | `#322E2A` | 主要文字 |
| `--zz-ink-body` | `#443A32` | 正文 |
| `--zz-ink-soft` | `#5C5046` | 控件文字 |
| `--zz-ink-tagline` | `#5E534A` | 主文案 |
| `--zz-muted` | `#897E70` | 次级文字、说明 |
| `--zz-muted-soft` | `#908478` | 三级文字 |
| `--zz-drift` | `#B4A694` | 落字（装饰） |
| `--zz-line` | `#DFD6C8` | 细分割线 |
| `--zz-line-soft` | `#E7E0D3` | 更轻的分割线 |
| `--zz-line-strong` | `#D2C5B4` | 书页描边、滑块轨道 |
| `--zz-accent` | `#9A5548` | 朱砂：CTA、当前页、焦点 |
| `--zz-accent-soft` | `#F0E0DA` | 朱砂底（示意徽标） |
| `--zz-accent-wash` | `#F7EEE7` | 朱砂极淡底 |
| `--zz-accent-line` | `#C3A69A` | 朱砂细竖线 |

**对比度实测**（WCAG 2.1）：

| 组合 | 比值 | 等级 |
|---|---|---|
| `--zz-ink` on `--zz-paper` | 12.6 : 1 | AAA |
| `--zz-ink-body` on `--zz-paper-reading` | 10.4 : 1 | AAA |
| `--zz-muted` on `--zz-paper` | 3.9 : 1 | AA（大字号） |
| `--zz-accent` on `--zz-paper` | 5.4 : 1 | AA |

`--zz-muted` 只用于 12–13px 的辅助说明，不承载关键信息；所有关键操作按钮使用
`--zz-accent`（AA 级）。

---

## 3. 字体

### 字体栈

| 令牌 | 值 | 用途 |
|---|---|---|
| `--zz-font-serif` | `'ZiZai Brand Serif', 'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif` | 展示：首页标题、导航、弹层标题 |
| `--zz-font-sans` | `'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif` | 界面：说明文字、提示 |
| `--zz-font-kai` | `'LXGW WenKai', 'Kaiti SC', 'KaiTi', 'STKaiti', 'Noto Serif SC', serif` | 楷体正文 |
| `--zz-font-fangsong` | `'Zhuque Fangsong', 'FangSong', 'STFangsong', 'Noto Serif SC', serif` | 仿宋正文 |

### 「ZiZai Brand Serif」是什么

随首屏加载的**思源宋体子集**（90.1 kB，232 个字形，可变字重 400–500），
只覆盖首页、页头、页脚、
404 与关于弹层里实际渲染的文字。它的存在是为了让首屏字形真实、稳定，
而不是靠用户机器上装没装宋体。

之所以保留可变字重轴（而不是拆成两个静态文件），是因为标题用 500、
导航用 400，两种字重都必须是真实字形 —— 让浏览器对 400 做合成加粗会糊。

**约束**：只能在展示层使用。正文与长文本使用阅读字体族，由赏字路由懒加载。

### 字号

| 令牌 | 值 | 用途 |
|---|---|---|
| `--zz-text-2xs` | 11px | 极小标签、徽标 |
| `--zz-text-xs` | 12px | 辅助说明、页脚 |
| `--zz-text-sm` | 13px | 次级说明、按钮（小） |
| `--zz-text-base` | 15px | 正文、导航 |
| `--zz-text-md` | 17px | 下拉框、主文案（移动端） |
| `--zz-text-lg` | 19px | CTA |
| `--zz-text-xl` | 22px | 弹层标题 |
| `--zz-text-2xl` | 30px | 品牌名 |
| `--zz-text-display` | `clamp(64px, 9.2vw, 132px)` | 首页主标题 |

阅读正文默认 22px，行高 2.2。移动端（≤767px）收敛到 18px / 2.0，
保证一行 16 字左右。

### 字距

中文标题的字距是这个站点最关键的排版特征。

| 令牌 | 值 | 用途 |
|---|---|---|
| `--zz-track-tight` | 0.06em | 正文、说明 |
| `--zz-track-normal` | 0.12em | 标题、导航 |
| `--zz-track-wide` | 0.2em | 页脚、标签 |
| `--zz-track-wider` | 0.3em | 导航项 |
| `--zz-track-widest` | 0.42em | 副标题（首页 eyebrow） |

**重要**：任何使用 `letter-spacing` 且需要视觉居中的元素，必须同时设置
`text-indent: <同样的值>`，否则末字之后会多出一份间距，整体偏左。

---

## 4. 间距

8px 基准阶梯：`--zz-space-1` 4 / `2` 8 / `3` 12 / `4` 16 / `5` 24 / `6` 32 /
`7` 48 / `8` 64 / `9` 96。

页面左右留白统一为 `--zz-gutter: 6%`（移动端 16px），容器上限 1540px。

---

## 5. 形态

| 令牌 | 值 | 用途 |
|---|---|---|
| `--zz-radius-xs` | 2px | 书页、CTA 按钮（方形感） |
| `--zz-radius-sm` | 4px | 图标按钮、chip |
| `--zz-radius-md` | 6px | 弹层 |
| `--zz-radius-lg` | 7px | 下拉框 |
| `--zz-shadow-sheet` | `0 12px 45px rgb(58 47 35 / 5.5%)` | 书页 |
| `--zz-shadow-layer` | `-15px 0 65px rgb(30 20 10 / 10%)` | 侧边抽屉（阶段 D） |

---

## 6. 动效

| 令牌 | 值 |
|---|---|
| `--zz-ease-out` | `cubic-bezier(.22,.61,.36,1)` |
| `--zz-ease-soft` | `cubic-bezier(.4,0,.2,1)` |
| `--zz-dur-fast` | 140ms |
| `--zz-dur-base` | 220ms |
| `--zz-dur-slow` | 320ms |

### 落字动画

- 数量：≥1024px 14 个 / ≥768px 10 个 / ≥480px 7 个 / <480px 5 个
- 时长 26–46 s，负延迟铺满整个周期（任意时刻都有字在半空）
- 分布：仅左右两条字道（左 2–27%、右 73–97%），中央 40% 永远留空
- 透明度峰值 0.2–0.46，字号越大越淡
- 仅动画 `transform` 与 `opacity`，容器 `contain: strict`
- `prefers-reduced-motion: reduce` 时**不渲染节点**

---

## 7. 纸纹

`.zz-grain` 用两层极稀疏径向渐变点阵叠加：

```scss
background-image:
  radial-gradient(rgb(84 67 50 / 9%) .55px, transparent .95px),
  radial-gradient(rgb(146 126 98 / 8%) .55px, transparent .95px);
background-size: 8px 8px, 13px 13px;
opacity: .3;
```

预期效果是「几乎看不出来，但大面积纸色不发塑料」。书页内部再叠一层更淡的点阵
（`rgb(138 111 82 / 5.8%)`，9px，`opacity: .23`）。

---

## 8. 布局与响应式

| 断点 | 变量 | 行为 |
|---|---|---|
| ≥1024px | — | 完整页头、中央书页、右侧 208px 工具轨 |
| 768–1023px | — | 工具轨收窄到 168px，书页优先 |
| ≤767px | `$bp-mobile` | 页头 72px；书页全宽；工具信息移到书页下方；正文字号收敛到 18px |
| ≤480px | `$bp-narrow` | 导航间距进一步压缩 |
| 高度 ≤700px | `short-screen` | 首页压缩装饰间距（不新增内容） |
| 高度 ≤600px | `very-short-screen` | 首页隐藏页脚入口与分隔竖线，保住 CTA |

### 高度锁定原则

- 首页：`height: calc(100dvh - var(--zz-header-h))`，`overflow: hidden` —— **永不滚动**
- 赏字：同样锁高，`.sheet__inner` 内部滚动 —— 页头与工具永远不会被正文挤出视口
- 移动端赏字：允许页面级滚动，书页 `min-height: 60dvh`

---

## 9. 组件规范

### 按钮

| 类型 | 规格 |
|---|---|
| 主 CTA | 1.3px 朱砂描边、`radius: 2px`、高 64px（移动端 54/50）、`letter-spacing: .21em`；hover 反白为朱砂底 + 纸色字 |
| 图标按钮 | 34px 方形、`radius: 4px`、hover 底色 `--zz-paper-deep` |
| 模式切换（横/竖排） | 高 40px、`radius: 4px`、选中态 `--zz-paper-deep` 底 + `--zz-ink` 字；移动端只留图标 |
| 徽标 | 11px、`radius: 2px`；「已核实」用纸色底，「示意」用朱砂淡底 |

### 下拉框

高 51px（移动端 44px），1px `--zz-line` 描边，`radius: 7px`，
背景 `--zz-paper-raised`。自绘右下箭头（7px 旋转 45° 的两条边），
避免各浏览器原生箭头风格不一。

### 书页

- 1px `--zz-line-strong` 描边，`radius: 2px`，背景 `--zz-paper-reading`
- 极轻阴影 + 内部点阵
- 内容区 padding：横排 `52px 8% 46px`；竖排 `26px 26px 22px`
- 标题 36px（移动端 27px），作者 13px / `0.22em` 字距

### 浮层

统一由 Reka UI `Dialog` 提供：焦点陷阱、Esc、点外关闭、`aria-modal`、
焦点返回、滚动锁定。外观自行绘制：`--zz-paper-ui` 背景、1px 描边、
`radius: 6px`、`--zz-shadow-sheet`。

**规则**：同一时刻只允许一个主浮层；不做弹窗套弹窗。

---

## 10. 无障碍

- 所有交互元素使用语义标签（`<button>` / `<a>` / `<select>` / `<label>`）
- 焦点：`:focus-visible` 使用 2px 朱砂描边 + 3px offset；鼠标点击不显示焦点环
- 跳转链接 `.zz-skip-link` 指向 `#main`，默认移出视口，聚焦时滑入
- 屏幕阅读器专用文本统一用 `.zz-sr-only`
- 装饰层（落字）使用 `aria-hidden="true"` + `pointer-events: none`
- 模式切换按钮用 `aria-pressed` 表达状态，不用 `aria-checked`
- 当前页导航用 `aria-current="page"`
- 授权状态不只靠颜色表达：徽标有文字「已核实」/「示意」
- 支持 `prefers-reduced-motion`：动画停止，落字不渲染

---

## 11. 与设计提案（DESIGN_SYSTEM.md）的差异汇总

| 项 | 提案 | 落地 | 理由 |
|---|---|---|---|
| 主字体 | 汇文明朝体 | 霞鹜文楷 | 授权未核实，不可分发（ADR-006） |
| 首页标题字号 | 76–152px | `clamp(64px, 9.2vw, 132px)` | 320px 窄屏下 64px 才不会溢出 |
| 右侧工具栏 | 7 个图标按钮 | 当前字体信息 + 待开放能力清单 | 阶段 D 才做抽屉；不放假按钮 |
| 纸纹 | 「肉眼不明显」 | 双层点阵 `opacity: .3` | 定量后可在多屏下保持一致 |
| 阅读正文 | 18–23px | 22px（移动端 18px） | 与 680px 版心配合得到 30 字/行 |
