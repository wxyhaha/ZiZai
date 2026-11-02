import type { FontEntry } from '@/types/font'

/**
 * 字体目录。
 *
 * 说明：
 * - 只有 `licenseStatus: 'verified'` 的条目才会随本项目分发字体文件。
 * - `family` 是 app 内的 CSS 字体族名，回退栈保证字体尚未加载或
 *   缺少字形时仍有可读的中文衬线兜底，不会掉成方块。
 * - 每款字体都有两套资源（见 scripts/build-font-subsets.py）：
 *   `subset` 覆盖站内已收录内容，随路由加载；
 *   `full` 覆盖 GB2312 全字，仅在用户题写出现缺字时按需拉取。
 * - 详细授权依据、来源与核对日期见 docs/font-licenses.md。
 */

export interface FontAssetPaths {
  /** 内容子集：覆盖站内全部古文与界面文案 */
  subset: string
  /** 完整字体：覆盖 GB2312 全字，按需加载 */
  full: string
  /** 完整字体的体积描述，用于在 UI 上如实体告知用户 */
  fullSizeLabel: string
}

export interface FontEntryWithAssets extends FontEntry {
  assets?: FontAssetPaths
}

export const fonts: FontEntryWithAssets[] = [
  {
    id: 'huawen-mingchao',
    name: '汇文明朝体',
    latinName: 'Huiwen Mincho',
    family: '"Huiwen Mincho", "Songti SC", "STSong", "SimSun", "Noto Serif SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'CC0 1.0 Universal（公有领域贡献）',
    licenseUrl: 'https://github.com/bosswnx/huiwenmincho-improved/blob/main/LICENSE',
    sourceUrl: 'https://github.com/bosswnx/huiwenmincho-improved',
    author: '特里王（原作者）· bosswnx（符号修正版）',
    description:
      '据旧式铅字风貌制作的明朝体，横细竖粗、起落有锋芒，字形端正清雅。设计稿中的主字体，现作为默认正文字体。',
    tags: ['明朝风格', '端正清雅'],
    styleTag: '宋',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '山月',
    licenseCheckedAt: '2026-11-02',
    assets: {
      subset: new URL('../assets/fonts/huawen-mingchao/huawen-mingchao.woff2', import.meta.url).href,
      full: new URL('../assets/fonts/huawen-mingchao/huawen-mingchao-full.woff2', import.meta.url)
        .href,
      fullSizeLabel: '4.1 MB',
    },
    caveats: [
      '符号修正版未收录「楯」等少量生僻字，遇到时会回退到思源宋体，观感基本一致。',
      '完整字体覆盖 GB2312 全部 6763 字，属于常用书写范围；超出范围的字仍会回退。',
    ],
  },
  {
    id: 'lxgw-wenkai',
    name: '霞鹜文楷',
    latinName: 'LXGW WenKai',
    family: '"LXGW WenKai", "Kaiti SC", "KaiTi", "STKaiti", "Noto Serif SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://github.com/lxgw/LxgwWenKai/blob/main/OFL.txt',
    sourceUrl: 'https://github.com/lxgw/LxgwWenKai',
    author: 'LXGW（落霞孤鹜）',
    description:
      '基于 Klee One 补字而成的楷体风格字体，笔画温润、结构舒展，长文阅读时字面呼吸感强。',
    tags: ['楷书风格', '温润舒展'],
    styleTag: '楷',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '竹影',
    licenseCheckedAt: '2026-11-02',
    assets: {
      subset: new URL('../assets/fonts/lxgw-wenkai/lxgw-wenkai.woff2', import.meta.url).href,
      full: new URL('../assets/fonts/lxgw-wenkai/lxgw-wenkai-full.woff2', import.meta.url).href,
      fullSizeLabel: '1.5 MB',
    },
    caveats: ['保留字体名称「霞鹜」「LXGW」等；本项目只做 web 子集，不修改字形。'],
  },
  {
    id: 'zhuque-fangsong',
    name: '朱雀仿宋',
    latinName: 'Zhuque Fangsong',
    family: '"Zhuque Fangsong", "FangSong", "STFangsong", "Noto Serif SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://github.com/TrionesType/zhuque/blob/main/LICENSE.txt',
    sourceUrl: 'https://github.com/TrionesType/zhuque',
    author: '浙江稷米科技（TrionesType）',
    description:
      '仿宋体风格的开源字体，笔画匀细、起收含蓄，兼顾骨力与安静，尤其适合竖排古籍与短章题签。',
    tags: ['仿宋风格', '匀细安静'],
    styleTag: '仿宋',
    suitedForBody: true,
    suitedForDisplay: false,
    sample: '纸上',
    licenseCheckedAt: '2026-11-02',
    assets: {
      subset: new URL('../assets/fonts/zhuque-fangsong/zhuque-fangsong.woff2', import.meta.url).href,
      full: new URL('../assets/fonts/zhuque-fangsong/zhuque-fangsong-full.woff2', import.meta.url)
        .href,
      fullSizeLabel: '2.5 MB',
    },
    caveats: ['v0.212 为技术预览版，部分生僻字仍在补入。'],
  },
  {
    id: 'noto-serif-sc',
    name: '思源宋体',
    latinName: 'Noto Serif SC',
    family: '"Noto Serif SC", "Songti SC", "SimSun", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://github.com/notofonts/noto-cjk/blob/main/Serif/LICENSE',
    sourceUrl: 'https://github.com/notofonts/noto-cjk',
    author: 'Google / Adobe',
    description:
      '覆盖完整的开源宋体，结构严谨、字面均齐，作为全站兜底字形，保证任何字符都有稳定呈现。',
    tags: ['宋体风格', '结构严谨'],
    styleTag: '宋',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '春秋',
    licenseCheckedAt: '2026-11-02',
    assets: {
      subset: new URL('../assets/fonts/noto-serif-sc/noto-serif-sc.woff2', import.meta.url).href,
      full: new URL('../assets/fonts/noto-serif-sc/noto-serif-sc-full.woff2', import.meta.url).href,
      fullSizeLabel: '1.3 MB',
    },
  },
]

/** 按 id 查字体；找不到时回退到第一款，避免渲染崩溃。 */
export function getFont(id: string): FontEntryWithAssets {
  return fonts.find((f) => f.id === id) ?? fonts[0]
}

/** 设计稿的主字体：汇文明朝体。 */
export const defaultFontId = 'huawen-mingchao'

/**
 * 所有自托管字体共用的默认回退栈。
 * 用在 UI 元素上，保证在字体尚未加载时也有合理的衬线字形。
 */
export const fallbackSerif = '"Noto Serif SC", "Songti SC", "SimSun", serif'
