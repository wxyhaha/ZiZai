# 字体源文件准备

`npm run fonts:build` 需要原始字体源文件（TTF），它们**不进入版本库**
（每款 25–30 MB）。请自行下载并放到 `scripts/font-sources/`，文件名如下：

| 字体 | 下载地址 | 期望文件名 |
|---|---|---|
| 汇文明朝体 Huiwen Mincho | https://github.com/bosswnx/huiwenmincho-improved（根目录 `匯文明朝體.ttf`） | 下载后命名为 `Huiwen.ttf` |
| 霞鹜文楷 LXGW WenKai | https://github.com/lxgw/LxgwWenKai/releases | `LXGWWenKai-Regular.ttf` |
| 朱雀仿宋 Zhuque Fangsong | https://github.com/TrionesType/zhuque/releases | `ZhuqueFangsong-Regular.ttf` |
| 思源宋体 Noto Serif SC | https://github.com/google/fonts/tree/main/ofl/notoserifsc | `NotoSerifSC[wght].ttf` |

放置后运行：

```bash
python -I scripts/build-font-subsets.py scripts/font-sources
```

脚本会输出各子集的体积与缺字清单，并重新生成
`src/styles/fonts/{brand,reading-fonts}.scss`。

**当前行为与待实现要求**：脚本的 `*-full.woff2` 仍只包含 GB2312 目标范围，且会将阅读用可变字体固定为 400。用户已要求全量版本保留原字体全部字符、字形及排版/可变轴能力，转换实现尚未调整；见 `docs/issues.md` 与 ADR-015。不要将当前文件名中的 `full` 理解为已经覆盖原字体全部内容。

## 首页落字字体

`npm run fonts:home` 使用同一目录中的四款原始字体，从各自真实 cmap 里筛选汉字，再独立生成首页 WOFF2 子集、`src/data/home-glyph-pools.json` 与 `src/styles/fonts/home-glyphs.scss`。当前每款抽样 1,200 个字，共 4,425 个不同汉字；生成器会再次打开子集并核验抽中的码位确实存在。

这些首页子集服务于随机背景展示，**不是完整字体**，不代替赏字页资源，也不会更改 `fonts:build` 或全量字体保留要求。重新生成需要上表四款字体源文件及 `fonttools` / `brotli`。

依赖：`pip install fonttools brotli`

> **注意**：思源宋体是可变字体，默认轴值是 200（ExtraLight）。
> 脚本会把它收窄到 400–500 / 钉成 400 与 500 两个静态切片，
> 不要绕过这一步，否则标题会细得立不住。
