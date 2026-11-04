import type { FontEntry } from '@/types/font'

/**
 * 字体目录。
 *
 * 设计原则：
 * - 字体注册表是全站字体的单一事实来源（Single Source of Truth），
 *   严禁在业务逻辑中硬编码字体列表或字体数量。
 * - 只有 `licenseStatus: 'verified'` 且 `selfHosted: true` 的条目才会打包并分发全量字体文件。
 * - 赏字页面采用真正的全量 WOFF2 字体，100% 保留母本原字体的字符映射（cmap）、
 *   字形轮廓、OpenType 排版特性表与可变轴能力。
 * - 首页落字使用构建管线独立生成的轻量汉字子集，不加载全量字体。
 * - 详细授权依据、来源与核对记录见 docs/font-licenses.md 与 docs/font-integrity-report.md。
 */

export interface FontAssetPaths {
  /** 真正全量 WOFF2 字体路径（不裁剪任何字形与 OpenType 特性） */
  file: string
  /** 兼容历史接口的完整字体别名 */
  full: string
  /** 兼容历史接口的内容子集别名（现统一指向全量字体） */
  subset: string
  /** 全量字体的体积描述，用于在 UI 上如实告知用户 */
  fullSizeLabel: string
}

export interface FontEntryWithAssets extends FontEntry {
  assets?: FontAssetPaths
}

function makeFontAssets(fileUrl: string, fullSizeLabel: string): FontAssetPaths {
  return {
    file: fileUrl,
    full: fileUrl,
    subset: fileUrl,
    fullSizeLabel,
  }
}

export const fonts: FontEntryWithAssets[] = [
  {
    id: 'huawen-mingchao',
    name: '汇文明朝体',
    latinName: 'Huiwen Mincho',
    cssWeight: '400',
    sourceFile: 'Huiwen.ttf',
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
    assets: makeFontAssets(
      new URL('../assets/fonts/huawen-mingchao/huawen-mingchao.woff2', import.meta.url).href,
      '7.9 MB',
    ),
    caveats: [
      '符号修正版未收录「楯」等少量生僻字，遇到原字体未收录字符时会自动回退到系统衬线体。',
    ],
  },
  {
    id: 'lxgw-wenkai',
    name: '霞鹜文楷',
    latinName: 'LXGW WenKai',
    cssWeight: '400',
    sourceFile: 'LXGWWenKai-Regular.ttf',
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
    assets: makeFontAssets(
      new URL('../assets/fonts/lxgw-wenkai/lxgw-wenkai.woff2', import.meta.url).href,
      '7.7 MB',
    ),
    caveats: ['保留字体名称「霞鹜」「LXGW」等；本项目全量转换为 WOFF2 分发，不修改字形轮廓。'],
  },
  {
    id: 'zhuque-fangsong',
    name: '朱雀仿宋',
    latinName: 'Zhuque Fangsong',
    cssWeight: '400',
    sourceFile: 'ZhuqueFangsong-Regular.ttf',
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
    assets: makeFontAssets(
      new URL('../assets/fonts/zhuque-fangsong/zhuque-fangsong.woff2', import.meta.url).href,
      '4.6 MB',
    ),
    caveats: ['v0.212 为技术预览版，部分生僻字仍在补入。'],
  },
  {
    id: 'noto-serif-sc',
    name: '思源宋体',
    latinName: 'Noto Serif SC',
    cssWeight: '200 900',
    sourceFile: 'NotoSerifSC.ttf',
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
    assets: makeFontAssets(
      new URL('../assets/fonts/noto-serif-sc/noto-serif-sc.woff2', import.meta.url).href,
      '10.5 MB',
    ),
    caveats: ['保留完整可变字重（wght 200–900），标题字重与正文字重共享同一份全量资源。'],
  },
  {
    id: 'qiji-font',
    name: '齐伋刻本',
    latinName: 'Qiji',
    cssWeight: '400',
    sourceFile: 'Qiji-Combo.ttf',
    family: '"Qiji", "Huiwen Mincho", "Songti SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://github.com/LingDong-/qiji-font/blob/master/OFL.txt',
    sourceUrl: 'https://github.com/LingDong-/qiji-font',
    author: '黄令东（Lingdong Huang）',
    description:
      '据明代万历闵齐伋、凌濛初套色雕版孤本重构，刀法斧凿之意跃然纸上，具纯正明刻线装书风骨。',
    tags: ['明代刻本', '套印善本', '古拙刀痕'],
    styleTag: '宋',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '山月',
    licenseCheckedAt: '2026-11-03',
    assets: makeFontAssets(
      new URL('../assets/fonts/qiji-font/qiji-font.woff2', import.meta.url).href,
      '17.5 MB',
    ),
    caveats: ['由于提取自明代古籍刻本，部分西文字符与现代标点缺字，会自动回退到衬线字体。'],
  },
  {
    id: 'lxgw-zhisong',
    name: '霞鹜致宋',
    latinName: 'LXGW ZhiSong',
    cssWeight: '400',
    sourceFile: 'LXGWZhiSongCL.ttf',
    family: '"LXGW ZhiSong", "Huiwen Mincho", "Songti SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'IPA Font License v1.0',
    licenseUrl: 'https://github.com/lxgw/LxgwZhiSong/blob/main/LICENSE.md',
    sourceUrl: 'https://github.com/lxgw/LxgwZhiSong',
    author: 'LXGW（落霞孤鹜）',
    description:
      '衍生于 IPAex 明朝，融入明末清初刻本的峭拔刀锋与文人写本的书卷气，中宫紧敛，清秀挺拔。',
    tags: ['明清刻本', '文人风骨', '清挺雅正'],
    styleTag: '宋',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '云岫',
    licenseCheckedAt: '2026-11-03',
    assets: makeFontAssets(
      new URL('../assets/fonts/lxgw-zhisong/lxgw-zhisong.woff2', import.meta.url).href,
      '3.7 MB',
    ),
    caveats: ['选用 Classic 经典刻本字形版，保留传统旧式印刷字形审美。'],
  },
  {
    id: 'genwan-mincho',
    name: '源云明体',
    latinName: 'GenWanMin',
    cssWeight: '400',
    sourceFile: 'GenWanMin2TC-R.otf',
    family: '"GenWanMin", "Huiwen Mincho", "Songti SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://github.com/ButTaiwan/genwan-font/blob/master/LICENSE.txt',
    sourceUrl: 'https://github.com/ButTaiwan/genwan-font',
    author: 'ButTaiwan',
    description:
      '基于思源明体改制，通过算法模拟古版木刻在宣纸上刷印时的微透与墨晕质感，笔触温润连绵。',
    tags: ['古墨微晕', '宣纸渗透', '温润怀旧'],
    styleTag: '宋',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '秋水',
    licenseCheckedAt: '2026-11-03',
    assets: makeFontAssets(
      new URL('../assets/fonts/genwan-mincho/genwan-mincho.woff2', import.meta.url).href,
      '14.2 MB',
    ),
    caveats: ['笔画交接处带墨晕圆角处理，特别适合模拟宣纸与竹纸上的古籍排印。'],
  },
  {
    id: 'i-ming',
    name: '一点明体',
    latinName: 'I.Ming',
    cssWeight: '400',
    sourceFile: 'I.Ming-8.10.ttf',
    family: '"I.Ming", "Huiwen Mincho", "Songti SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'IPA Font License v1.0',
    licenseUrl: 'https://github.com/ichitenfont/I.Ming/blob/master/COPYING',
    sourceUrl: 'https://github.com/ichitenfont/I.Ming',
    author: '刻石录（ichitenfont）',
    description:
      '恪守《康熙字典》与清代善本传承正字字理，刀刀见锋，骨力遒劲，尽显传统金石之正统风范。',
    tags: ['清代善本', '传承正字', '端方金石'],
    styleTag: '宋',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '松风',
    licenseCheckedAt: '2026-11-03',
    assets: makeFontAssets(
      new URL('../assets/fonts/i-ming/i-ming.woff2', import.meta.url).href,
      '10.2 MB',
    ),
    caveats: ['遵循传统六书正字字形（传承字形），部分简化或俗写笔画保留本字本义。'],
  },
  {
    id: 'chill-huosong',
    name: '寒蝉活宋体',
    latinName: 'Chill HuoSong',
    cssWeight: '400',
    sourceFile: 'ChillHuoSong.otf',
    family: '"Chill HuoSong", "Huiwen Mincho", "Songti SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://github.com/Warren2060/ChillMovableType/blob/main/LICENSE',
    sourceUrl: 'https://github.com/Warren2060/ChillMovableType',
    author: 'Warren2060',
    description:
      '再现古代活字与早期铅字印刷因纸墨不匀与字模磨损所形成的飞白断纹与斑驳颗粒，极具古旧手作沧桑。',
    tags: ['活字斑驳', '印泥残墨', '手作沧桑'],
    styleTag: '宋',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '微雨',
    licenseCheckedAt: '2026-11-03',
    assets: makeFontAssets(
      new URL('../assets/fonts/chill-huosong/chill-huosong.woff2', import.meta.url).href,
      '11.2 MB',
    ),
    caveats: ['带有做旧做残纹理算法，字形具有微小飞白斑驳感。'],
  },
  {
    id: 'rhyme-grass',
    name: '韵草体',
    latinName: 'Rhyme Grass',
    cssWeight: '400',
    sourceFile: 'Rhyme-Grass-G.ttf',
    family: '"Rhyme Grass", "Huiwen Mincho", "Kaiti SC", cursive, serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://github.com/LingDong-/rhyme-grass-font/blob/main/OFL.txt',
    sourceUrl: 'https://github.com/LingDong-/rhyme-grass-font',
    author: '黄令东（Lingdong Huang）',
    description:
      '取自晚明万历年间草书典籍《草韵辨体》，汇聚王羲之、智永、怀素诸家法帖，笔意跌宕，气韵通畅。',
    tags: ['明代行草', '文人法帖', '气脉连绵'],
    styleTag: '书法',
    suitedForBody: false,
    suitedForDisplay: true,
    sample: '醉翁',
    licenseCheckedAt: '2026-11-03',
    assets: makeFontAssets(
      new URL('../assets/fonts/rhyme-grass/rhyme-grass.woff2', import.meta.url).href,
      '8.6 MB',
    ),
    caveats: ['由于取自古代草书法帖集，未收录的罕用字或现代标点会自动回退到衬线体。'],
  },
  {
    id: 'zhi-mang-xing',
    name: '志莽行书',
    latinName: 'Zhi Mang Xing',
    cssWeight: '400',
    sourceFile: 'ZhiMangXing-Regular.ttf',
    family: '"Zhi Mang Xing", "Huiwen Mincho", "Kaiti SC", cursive, serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://raw.githubusercontent.com/googlefonts/zhimangxing/master/OFL.txt',
    sourceUrl: 'https://github.com/googlefonts/zhimangxing',
    author: '魏志莽',
    description:
      '中国书法家魏志莽手写真迹，行草相参，笔势连绵洒脱。深得清代吴昌硕金石行书大字与古代碑帖墨意，苍劲古拙。',
    tags: ['吴昌硕风骨', '金石行草', '笔墨淋漓'],
    styleTag: '行',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '松风',
    licenseCheckedAt: '2026-11-04',
    assets: makeFontAssets(
      new URL('../assets/fonts/zhi-mang-xing/zhi-mang-xing.woff2', import.meta.url).href,
      '2.8 MB',
    ),
    caveats: [
      '基于 GB2312 简体规范手写创作，简体字式下拥有完整 6,763 字覆盖；切换为繁体字式时未收录之繁体字会自然回退。',
    ],
  },
  {
    id: 'ma-shan-zheng',
    name: '马善政楷书',
    latinName: 'Ma Shan Zheng',
    cssWeight: '400',
    sourceFile: 'MaShanZheng-Regular.ttf',
    family: '"Ma Shan Zheng", "Huiwen Mincho", "Songti SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://raw.githubusercontent.com/googlefonts/mashanzheng/master/OFL.txt',
    sourceUrl: 'https://github.com/googlefonts/mashanzheng',
    author: '马善政',
    description:
      '当代书法家马善政手书，取法中国传统楹联名作与摩崖石刻榜书大字。方笔斩截、沉着雄强，极具古碑金石厚重气魄。',
    tags: ['摩崖金石', '榜书大字', '沉着雄强'],
    styleTag: '楷',
    suitedForBody: true,
    suitedForDisplay: true,
    sample: '江山',
    licenseCheckedAt: '2026-11-04',
    assets: makeFontAssets(
      new URL('../assets/fonts/ma-shan-zheng/ma-shan-zheng.woff2', import.meta.url).href,
      '3.2 MB',
    ),
    caveats: [
      '全量覆盖 GB2312 简体常用汉字，字势厚重大气；繁体模式下部分繁体字按设计自然回退。',
    ],
  },
  {
    id: 'long-cang',
    name: '龙藏体',
    latinName: 'Long Cang',
    cssWeight: '400',
    sourceFile: 'LongCang-Regular.ttf',
    family: '"Long Cang", "Huiwen Mincho", "Kaiti SC", cursive, serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://raw.githubusercontent.com/googlefonts/longcang/master/OFL.txt',
    sourceUrl: 'https://github.com/googlefonts/longcang',
    author: '陈孝民',
    description:
      '中国当代书法家陈孝民手写毛笔真迹，笔走龙蛇、逸兴遄飞。再现古代狂草大写意墨狂风神，飞白断连与枯润水墨张力极强。',
    tags: ['狂草飞白', '龙蛇飞动', '水墨写意'],
    styleTag: '书法',
    suitedForBody: false,
    suitedForDisplay: true,
    sample: '飞龙',
    licenseCheckedAt: '2026-11-04',
    assets: makeFontAssets(
      new URL('../assets/fonts/long-cang/long-cang.woff2', import.meta.url).href,
      '2.9 MB',
    ),
    caveats: [
      '基于 GB2312 简体规范手写创作，简体下 6,763 字完整；繁体古文下未收录的繁体字会自然回退。',
    ],
  },
  {
    id: 'tw-shuowen',
    name: '说文解字小篆',
    latinName: 'TW ShuoWen',
    cssWeight: '400',
    sourceFile: 'TW-ShuoWen.ttf',
    family: '"TW ShuoWen", "EBAS", "Huiwen Mincho", "Songti SC", serif',
    selfHosted: true,
    licenseStatus: 'verified',
    licenseName: 'SIL Open Font License 1.1',
    licenseUrl: 'https://data.gov.tw/license',
    sourceUrl: 'https://www.cns11643.gov.tw/',
    author: '台湾数位发展部 CNS 11643 全字库',
    description:
      '依东汉许慎《说文解字》秦汉小篆原典数字化修摹，圆劲挺拔、骨肉停匀、结体严整，为华夏文字金石小篆之正统渊源。',
    tags: ['秦汉小篆', '说文解字', '铁线金石'],
    styleTag: '书法',
    suitedForBody: false,
    suitedForDisplay: true,
    sample: '日月',
    licenseCheckedAt: '2026-11-04',
    assets: makeFontAssets(
      new URL('../assets/fonts/tw-shuowen/tw-shuowen.woff2', import.meta.url).href,
      '6.4 MB',
    ),
    caveats: [
      '依东汉许慎原典数字化，正体繁体字 6,745 字完整收录；为秦汉小篆复刻，不含秦汉后衍生的后起字、简体字与现代标点，未收录字符会自动回退到衬线体。',
    ],
  },
]

/** 按 id 查字体；找不到时回退到第一款，避免渲染崩溃。 */
export function getFont(id: string): FontEntryWithAssets {
  return fonts.find((f) => f.id === id) ?? fonts[0]
}

/** 设计稿的主字体：汇文明朝体。 */
export const defaultFontId = 'huawen-mingchao'

/**
 * 获取所有已核实并自托管的字体列表（用于构建管线与自动扩展）。
 */
export function getSelfHostedFonts(): FontEntryWithAssets[] {
  return fonts.filter((f) => f.selfHosted && f.licenseStatus === 'verified')
}
