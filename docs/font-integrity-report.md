# 字体全量转换完整性验证审计报告 (Font Integrity Audit Report)

> **生成规范依据**：ADR-015 · 全量 WOFF2 保留原字体完整内容。
> 本报告由 `scripts/build-fonts.py` 自动化比对源字体（TTF/OTF）与全量 WOFF2 产物生成，杜绝任何字符子集裁剪与字形失真。
> 
> **审计执行时间**：2026-11-03 ｜ **收录字体总数**：10 款

---

## 一、全量字体转换完整性概览

| 字体标识 | 中文名 | 原始母本 | cmap 码位映射 | 字形轮廓保留 | 布局特性表 | 可变轴 (fvar) | 母本体积 | WOFF2 体积 | 压缩率 |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `huawen-mingchao` | **汇文明朝体** | `Huiwen.ttf` | ✅ 14070 (100%) | ✅ 13314 (100%) | ✅ 完整 | — | 23.7 MB | 7.9 MB | 33.1% |
| `lxgw-wenkai` | **霞鹜文楷** | `LXGWWenKai-Regular.ttf` | ✅ 46926 (100%) | ✅ 47336 (100%) | ✅ 完整 | — | 24.7 MB | 7.7 MB | 31.2% |
| `zhuque-fangsong` | **朱雀仿宋** | `ZhuqueFangsong-Regular.ttf` | ✅ 12882 (100%) | ✅ 13805 (100%) | ✅ 完整 | — | 8.4 MB | 4.6 MB | 54.5% |
| `noto-serif-sc` | **思源宋体** | `NotoSerifSC.ttf` | ✅ 30928 (100%) | ✅ 31058 (100%) | ✅ 完整 | ✅ 保留轴 | 24.0 MB | 10.5 MB | 43.9% |
| `qiji-font` | **齐伋刻本** | `Qiji-Combo.ttf` | ✅ 21068 (100%) | ✅ 19665 (100%) | ✅ 完整 | — | 39.2 MB | 17.5 MB | 44.7% |
| `lxgw-zhisong` | **霞鹜致宋** | `LXGWZhiSongCL.ttf` | ✅ 23595 (100%) | ✅ 23887 (100%) | ✅ 完整 | — | 8.4 MB | 3.7 MB | 43.8% |
| `genwan-mincho` | **源云明体** | `GenWanMin2TC-R.otf` | ✅ 35349 (100%) | ✅ 37684 (100%) | ✅ 完整 | — | 21.7 MB | 14.2 MB | 65.5% |
| `i-ming` | **一点明体** | `I.Ming-8.10.ttf` | ✅ 60017 (100%) | ✅ 60597 (100%) | ✅ 完整 | — | 24.7 MB | 10.2 MB | 41.4% |
| `chill-huosong` | **寒蝉活宋体** | `ChillHuoSong.otf` | ✅ 12152 (100%) | ✅ 13154 (100%) | ✅ 完整 | — | 28.6 MB | 11.2 MB | 39.1% |
| `rhyme-grass` | **韵草体** | `Rhyme-Grass-G.ttf` | ✅ 18352 (100%) | ✅ 15064 (100%) | ✅ 完整 | — | 50.8 MB | 8.6 MB | 16.9% |

---

## 二、逐款字体技术细节与布局表审计

### 汇文明朝体 (`huawen-mingchao`)

- **母本文件名**：`scripts/font-sources/Huiwen.ttf`
- **产物路径**：`src/assets/fonts/huawen-mingchao/huawen-mingchao.woff2`
- **字符映射 (cmap)**：源字体 14070 个码位，WOFF2 14070 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 13314 个，WOFF2 13314 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 23.71 MB → WOFF2 7.86 MB（体积缩减至 33.1%）。
- **保留排版特性表**：`GSUB`, `GPOS`, `GDEF`
- **安全丢弃的无用表**：`DSIG`（符合 WOFF2 规范要求，如 DSIG 签名表）。

### 霞鹜文楷 (`lxgw-wenkai`)

- **母本文件名**：`scripts/font-sources/LXGWWenKai-Regular.ttf`
- **产物路径**：`src/assets/fonts/lxgw-wenkai/lxgw-wenkai.woff2`
- **字符映射 (cmap)**：源字体 46926 个码位，WOFF2 46926 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 47336 个，WOFF2 47336 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 24.73 MB → WOFF2 7.72 MB（体积缩减至 31.2%）。
- **保留排版特性表**：`GSUB`, `GPOS`, `vhea`, `vmtx`

### 朱雀仿宋 (`zhuque-fangsong`)

- **母本文件名**：`scripts/font-sources/ZhuqueFangsong-Regular.ttf`
- **产物路径**：`src/assets/fonts/zhuque-fangsong/zhuque-fangsong.woff2`
- **字符映射 (cmap)**：源字体 12882 个码位，WOFF2 12882 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 13805 个，WOFF2 13805 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 8.42 MB → WOFF2 4.58 MB（体积缩减至 54.5%）。
- **保留排版特性表**：`GSUB`, `GPOS`, `GDEF`
- **安全丢弃的无用表**：`DSIG`（符合 WOFF2 规范要求，如 DSIG 签名表）。

### 思源宋体 (`noto-serif-sc`)

- **母本文件名**：`scripts/font-sources/NotoSerifSC.ttf`
- **产物路径**：`src/assets/fonts/noto-serif-sc/noto-serif-sc.woff2`
- **字符映射 (cmap)**：源字体 30928 个码位，WOFF2 30928 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 31058 个，WOFF2 31058 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 23.96 MB → WOFF2 10.52 MB（体积缩减至 43.9%）。
- **保留排版特性表**：`GSUB`, `GPOS`, `GDEF`, `vhea`, `vmtx`, `BASE`
- **可变字重轴 (fvar)**：✅ 完整保留：`wght` (200.0~900.0, default=200.0)

### 齐伋刻本 (`qiji-font`)

- **母本文件名**：`scripts/font-sources/Qiji-Combo.ttf`
- **产物路径**：`src/assets/fonts/qiji-font/qiji-font.woff2`
- **字符映射 (cmap)**：源字体 21068 个码位，WOFF2 21068 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 19665 个，WOFF2 19665 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 39.17 MB → WOFF2 17.51 MB（体积缩减至 44.7%）。
- **保留排版特性表**：`GDEF`

### 霞鹜致宋 (`lxgw-zhisong`)

- **母本文件名**：`scripts/font-sources/LXGWZhiSongCL.ttf`
- **产物路径**：`src/assets/fonts/lxgw-zhisong/lxgw-zhisong.woff2`
- **字符映射 (cmap)**：源字体 23595 个码位，WOFF2 23595 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 23887 个，WOFF2 23887 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 8.37 MB → WOFF2 3.66 MB（体积缩减至 43.8%）。
- **保留排版特性表**：`GSUB`, `GPOS`, `GDEF`, `vhea`, `vmtx`

### 源云明体 (`genwan-mincho`)

- **母本文件名**：`scripts/font-sources/GenWanMin2TC-R.otf`
- **产物路径**：`src/assets/fonts/genwan-mincho/genwan-mincho.woff2`
- **字符映射 (cmap)**：源字体 35349 个码位，WOFF2 35349 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 37684 个，WOFF2 37684 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 21.72 MB → WOFF2 14.23 MB（体积缩减至 65.5%）。
- **保留排版特性表**：`GSUB`, `GPOS`, `vhea`, `vmtx`, `BASE`

### 一点明体 (`i-ming`)

- **母本文件名**：`scripts/font-sources/I.Ming-8.10.ttf`
- **产物路径**：`src/assets/fonts/i-ming/i-ming.woff2`
- **字符映射 (cmap)**：源字体 60017 个码位，WOFF2 60017 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 60597 个，WOFF2 60597 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 24.69 MB → WOFF2 10.23 MB（体积缩减至 41.4%）。
- **保留排版特性表**：`GSUB`, `GPOS`, `GDEF`, `vhea`, `vmtx`, `BASE`

### 寒蝉活宋体 (`chill-huosong`)

- **母本文件名**：`scripts/font-sources/ChillHuoSong.otf`
- **产物路径**：`src/assets/fonts/chill-huosong/chill-huosong.woff2`
- **字符映射 (cmap)**：源字体 12152 个码位，WOFF2 12152 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 13154 个，WOFF2 13154 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 28.64 MB → WOFF2 11.19 MB（体积缩减至 39.1%）。
- **浏览器兼容修复**：移除 117 条指向 `.notdef` 的无效 cmap format 14 变体映射；普通 cmap、有效变体及字形不变。
- **保留排版特性表**：`GSUB`, `GPOS`, `GDEF`, `vhea`, `vmtx`

### 韵草体 (`rhyme-grass`)

- **母本文件名**：`scripts/font-sources/Rhyme-Grass-G.ttf`
- **产物路径**：`src/assets/fonts/rhyme-grass/rhyme-grass.woff2`
- **字符映射 (cmap)**：源字体 18352 个码位，WOFF2 18352 个码位（匹配度：**100% 完全一致**）。
- **字形总数 (Glyph Count)**：源字体 15064 个，WOFF2 15064 个（字形顺序与轮廓完全保留）。
- **体积与压缩**：源文件 50.82 MB → WOFF2 8.57 MB（体积缩减至 16.9%）。
- **保留排版特性表**：`vhea`, `vmtx`

---

## 三、结论与合规性声明

1. **零子集裁剪**：全量 WOFF2 转换过程**未调用 fontTools.subset.Subsetter 对字符进行任何修剪**，不掺入任何 GB2312 局限子集。
2. **原生排版与变体保留**：原字体的横竖排指标表（`vhea`/`vmtx`）、文字特性置换表（`GSUB`/`GPOS`）以及思源宋体的动态字重轴（`fvar`）在输出 WOFF2 中均 100% 得到保留。
3. **增量可复现验证**：构建管线配置了哈希增量缓存（`scripts/.build-cache.json`），任意时刻均可通过 `python -I scripts/build-fonts.py` 复现比对结果。
