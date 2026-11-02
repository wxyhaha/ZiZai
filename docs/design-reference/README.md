# 字在 ZiZai — 设计交付包（v2）

这是新项目 **「字在（ZiZai）」** 的设计资料和 AI 开发规范；不是 Vue 正式工程。**新项目从零创建，旧仓库 `fontCollections` 仅供可选历史参考。**

## 预览

- 浏览器打开 `index.html`：零依赖交互设计原型，不需要安装依赖。
- 查看 `homepage-editable.png` 和 `reading-editable.png`：两个主要页面的静态视觉参考。
- 查看 `font-selector-editable.png`：字体选择面板的视觉参考。

## 可编辑视觉稿

- `homepage-editable.svg`：首页矢量设计稿。
- `reading-editable.svg`：赏字页矢量设计稿。
- `font-selector-editable.svg`：字体选择器设计稿。

SVG 通常可导入 Figma / Illustrator / Inkscape 编辑；导入后的字体和布局取决于目标软件与设备。**交付不包含原生 `.fig` 文件，也不附带受版权保护的字体文件。**

## AI 开发资料

- `DESIGN_SYSTEM.md`：页面、视觉、交互、响应式和验收规范。
- **`AI_MASTER_PROMPT.md`**：完整新版开发提示词。全新创建独立 Vue 3 + Vite + TypeScript 工程，不以旧仓库为基础。

## 使用顺序

1. 建立新项目目录，例如 `zizai/`。
2. 将此设计包放到新项目 `docs/design-reference/` 中。
3. 将 `AI_MASTER_PROMPT.md` 原文交给 Codex / Claude Code 等编码 Agent。
4. 首轮只实现阶段 A + B（全新工程、设计系统、首页）；后续按文档推进。

## 限制说明

1. 交互原型是独立 HTML/CSS/JS 演示，不是可直接部署的 Vue 生产工程。
2. 字体预览使用近似的系统字体，不代表已接入真实、已授权的古风字体。
3. 历史仓库 `https://github.com/wxyhaha/fontCollections` 不需要修改、升级或迁移；只有个别文本/字体数据在核查后才可以选择性使用。
4. 设计包静态 PNG 是矢量稿预览，不是自动化浏览器测试截图。
