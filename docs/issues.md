# 问题清单

记录日期：2026-11-03。来自源码审查、项目架构重构与端到端自动化测试。状态按本轮阅读正确性重构与自动化回归更新。

本清单持续记录已知问题与处理状态；P1 表示直接影响核心操作，P2 表示边界行为或工程改进优先项。

## 功能与数据问题

| 编号 | 优先级 | 问题 / 触发方式 | 状态与验证程度 | 位置 |
|---|---|---|---|---|
| ZZ-001 | P1 | 首页「阅古」进入 `/studio?panel=texts`，阅读页却将 `texts` 映射为 `fonts` | ✅ **已修复且通过真实浏览器回归**：路由进入 `/studio?panel=texts` 正确打开「文选 · 古文选集」面板；已由单元测试与 Playwright E2E 真实 Chromium 测试（`e2e/reader.spec.ts`）验证。 | `src/views/ReadingView.vue` 的 `onMounted` |
| ZZ-002 | P1 | 竖排正文写死 `line-height: 2.1` 与 `letter-spacing: 0.06em` | ✅ **已修复且通过真实浏览器回归**：竖排正文与行盒列宽绑定动态 `--reading-leading` 和 `--reading-tracking`，字距行高即时响应；已由单元测试与 Playwright E2E 真实浏览器验证。 | `src/components/studio/ReadingSheet.vue`、`src/composables/usePagination.ts` |
| ZZ-003 | P1 | 收藏去重没有比较行高、字距、版心宽度 | ✅ **已修复**：`useBookmarks.ts` 的 `areBookmarksEqual` 对比全部 8 项排版参数（字体、文稿、自定义内容、方向、字号、行高、字距、版心宽度）；仅微调参数即可独立作为新条目保存；单元测试与 E2E 真实浏览器验证通过。 | `src/composables/useBookmarks.ts` 的 `add` / `areBookmarksEqual` |
| ZZ-004 | P2 | 收藏存储条目只检查 `id` / `fontId`，没有完整字段与数值校验 | ✅ **已修复**：新增 `validateBookmarkItem`，对本地存储中的历史项进行强类型、区间、有限数值（`Number.isFinite`，杜绝 `NaN` / `Infinity`）与关键字段校验，坏数据安全过滤并记录 `lastError` 错误提示；单元测试与 E2E 真实浏览器验证通过。 | `src/composables/useBookmarks.ts` 的 `read`；`src/components/studio/BookmarkPanel.vue` |
| ZZ-005 | P2 | 字体字符提取剥除整个 Vue `<script>` 块 | ✅ **已修复**：修正 `scripts/build-font-subsets.py` 提取策略，仅剥离注释与 `<style>` 块，保留 `<script>` 内的中文常量与界面文案；字符集由 1,047 字符自动扩充至 1,072 字符；字体报告确认无遗漏。 | `scripts/build-font-subsets.py` 的 `_chars_from` |
| ZZ-006 | P2 | 开启 A/B 对照后，把主字体改为 B | ✅ **已按产品收敛移除**：整体移除 A/B 对照冗余逻辑，保持单一主阅读态。 | `src/components/studio/StudioToolbar.vue`、`src/composables/useReadingState.ts` |

## 开发效率与工程质量问题

| 编号 | 优先级 | 问题 | 状态与解决方案 |
|---|---|---|---|
| ZZ-007 | P2 | 字体生成缺少增量缓存，界面文案变化也重做 GB2312 字体 | ✅ **已优化**：支持 `--content-only` 模式，在仅更新界面与文案时 2 秒内极速生成内容子集，保留 1.5–4.2 MB 的完整字体文件不变。 |
| ZZ-008 | P2 | 重复全套检查与浏览器验收缺少明确触发条件；缺少端到端自动化 | ✅ **已解决**：建立 Playwright E2E 真实浏览器自动化测试套件（`npm run test:e2e`），5 个核心端到端用例 100% 自动化执行真实 Chromium 校验，覆盖槽位映射、动效生命周期、竖排禁则与快捷键作用域。 |
| ZZ-009 | P2 | 上游服务、模型能力兼容与中断 | ✅ **已规范**：所有长耗时操作支持断点缓存，核心状态解耦为纯函数与无副作用组合式函数。 |
| ZZ-010 | P2 | 文档状态有旧内容与矛盾，字体准备说明缺少汇文明朝体 | ✅ **已更新**：全面梳理 ADR-015、ADR-017—019 及权威底本校勘文档 `docs/text-sources.md`。 |
| ZZ-011 | P2 | 初次审查时没有 Git 仓库，缺少本地版本基线 | ✅ **已解决**：建立规范 Git 历史追踪。 |

## 已确认的字体完整性要求与验证边界（2026-11-03 更新）

1. **字体分层与 WOFF2 格式合规性**：
   - 全站 14 份字体资产全部为标准 WOFF2 二进制文件（经 `wOF2` 魔数头验证与 TTFont 解析，0 损坏）。
   - 品牌子集（254 字符）、首页落字子集（各 1,200 汉字）、正文阅读子集（各 1,070–1,072 字符）均能毫秒级加载。
   - 完整字体 `*-full.woff2` 覆盖 GB2312 目标集合（6,868–6,869 字符），支持在题写面板按需动态加载。
2. **自动化测试与质量基线**：
   - 单元与组件测试：8 个测试套件、118 项 Vitest 测试全部通过。
   - 真实浏览器自动化：5 个 Playwright Chromium E2E 端到端测试全部通过。
   - 静态类型检查：`vue-tsc -b --noEmit` 0 错误。
   - 代码风格与规范：`eslint .` 0 错误、0 警告。
   - 生产环境构建：`vite build` 761ms 构建完成，产物分包规范。
