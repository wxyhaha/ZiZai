/**
 * 五大时代标点符号与学术考据数据库。
 *
 * 梳理中国古代标点符号史发展脉络，收录先秦两汉、魏晋隋唐、宋元雕版、明清善本、近代现代五大体系，
 * 提供权威文献出处、出土文物考古依据、排版与微观几何规范，以及文章朝代自动映射规则。
 */

export type PunctuationStyleId = 'pre-qin' | 'wei-jin' | 'song-yuan' | 'ming-qing' | 'modern'

export interface ReferenceItem {
  author: string
  title: string
  publisher: string
  note?: string
}

export interface AccompanyingFrame {
  borderStyle: 'none' | 'single' | 'double'
  fishtail: 'none' | 'single' | 'double'
  hasLinedColumns: boolean
}

export interface PunctuationStyle {
  id: PunctuationStyleId
  name: string
  shortName: string
  eraSpan: string
  symbolType: 'hook' | 'cinnabar-circle' | 'fine-circle' | 'woodblock-two-color' | 'modern-fullwidth'
  occupiesSpace: boolean
  description: string
  historicalBackground: string
  archeologicalArtifacts: string[]
  typographicRules: string[]
  references: ReferenceItem[]
  accompanyingFrame: AccompanyingFrame
}

export const punctuationStyles: PunctuationStyle[] = [
  {
    id: 'pre-qin',
    name: '先秦两汉 · 简帛钩识',
    shortName: '先秦简帛',
    eraSpan: '先秦至两汉（前11世纪 — 公元220年）',
    symbolType: 'hook',
    occupiesSpace: false,
    description:
      '战国楚简、秦简与马王堆帛书符号。以向右微翘的折笔墨钩「乚」标识句终与章讫，以短横或实心墨点区分小读，字侧附挂，还原竹木编联之天然古貌。',
    historicalBackground:
      '商周甲骨与金文中已有分段界画。战国楚简与睡虎地秦简中普遍使用折笔墨钩（乚）、墨点及短横作为断句、章首与重文符号。由于竹简修长、编绳连缀，古人将钩识附于简右或行侧，绝不打断正文字格。',
    archeologicalArtifacts: [
      '湖北荆门郭店一号楚墓竹简《老子甲本》（战国中期，以折锋墨钩标记章讫）',
      '湖北云梦睡虎地秦简《日书》（秦昭王至始皇时期，以短横、圆点与小方块断句）',
      '湖南长沙马王堆三号汉墓帛书《老子甲本卷后古轶书》（西汉文帝时期，以墨点与钩点标段）',
      '甘肃居延汉简与敦煌汉简（汉代官府文书与戍卒书信，随文钩识与小顿符号）',
    ],
    typographicRules: [
      '字侧附挂不占格：符号附挂于汉字右侧与简边缘窄隙（East Gutter Track），正文字格紧密排布，不占用正文字方。',
      '长句折钩与分读墨点：句终章讫采用向右微翘的折笔墨钩（乚），分句与语助停顿采用小墨点（·）或短横。',
      '简帛素雅装帧：纯粹还原简帛质朴形貌，无后世印刷版框、无折缝中缝与鱼尾象鼻。',
    ],
    references: [
      {
        author: '管锡华',
        title: '《中国古代标点符号发展史》',
        publisher: '中华书局',
        note: '详考战国楚简、秦汉简牍至汉魏帛书标点形态流变，确立古书句读附挂法谱系。',
      },
      {
        author: '启功',
        title: '《古代标点符号的演变》',
        publisher: '收录于《启功丛稿·题跋卷》',
        note: '考释简帛墨钩、古人读书钩识习惯及“不破字方”的排版美学。',
      },
      {
        author: '林穗芳',
        title: '《标点符号源流考》',
        publisher: '人民出版社',
        note: '系统梳理甲骨金文到简牍帛书时期的二十余种辅助钩识与读号。',
      },
    ],
    accompanyingFrame: {
      borderStyle: 'none',
      fishtail: 'none',
      hasLinedColumns: false,
    },
  },
  {
    id: 'wei-jin',
    name: '魏晋隋唐 · 手书朱圈',
    shortName: '魏晋朱圈',
    eraSpan: '魏晋南北朝至隋唐（公元220年 — 907年）',
    symbolType: 'cinnabar-circle',
    occupiesSpace: false,
    description:
      '六朝手抄卷轴与敦煌写经体式。学者与传抄者以毛笔蘸朱砂红泥点读，以中空朱圈断句断章，以提按朱撇分读停顿，朱墨争辉，笔意灵动。',
    historicalBackground:
      '魏晋纸张普及后，抄本与经卷大盛。学者研经讲学广泛使用朱砂点读以别句意。唐代科举“明经试”更专设句读测试，写本中毛笔手点朱红圆圈与斜撇成为士人读书治学的视觉标识。',
    archeologicalArtifacts: [
      '敦煌莫高窟藏经洞 P.2544《论语郑氏注》唐写本（手书朱圈断句、朱笔分段）',
      '吐鲁番阿斯塔那墓出土西晋元康六年《三国志·吴志·孙权传》写本（朱砂旁点）',
      '大英图书馆藏 S.797 敦煌唐写本《文选》注本（朱色圆圈句读与朱墨双色附注）',
      '日本藏唐写本《毛诗正义》残卷（唐代文人手批朱圈与音读记号）',
    ],
    typographicRules: [
      '字侧朱砂圈点：中空朱圈（⚪）断句，提按朱撇（丶）分读，均精准落于汉字字身右侧行间窄隙，不占正文字方。',
      '纵向乌丝栏界行：还原手抄纸卷经生用墨笔或朱笔界画的纵向界行（乌丝栏），收敛行气。',
      '卷轴舒展形制：无印刷折页版框、无中缝鱼尾象鼻，呈现卷轴舒卷之古雅。',
    ],
    references: [
      {
        author: '陈垣',
        title: '《校勘学释例（卷六·句读篇）》',
        publisher: '中华书局',
        note: '考述魏晋六朝与唐代古写本中朱墨句读、离经辨志之体例。',
      },
      {
        author: '张伯伟',
        title: '《中国古代句读理论与实践研究》',
        publisher: '中华书局',
        note: '详尽考证敦煌写经朱圈朱点断句规则与唐代明经句读制度之历史原貌。',
      },
      {
        author: '蒋礼鸿',
        title: '《敦煌文书校读记》',
        publisher: '浙江古籍出版社',
        note: '细致考辨敦煌写本中朱笔钩划、圆圈与提撇之标点功能。',
      },
    ],
    accompanyingFrame: {
      borderStyle: 'none',
      fishtail: 'none',
      hasLinedColumns: true,
    },
  },
  {
    id: 'song-yuan',
    name: '宋元雕版 · 细铁线圈',
    shortName: '宋元细墨',
    eraSpan: '五代至宋元（公元960年 — 1368年）',
    symbolType: 'fine-circle',
    occupiesSpace: false,
    description:
      '雕版印刷黄金时期形制。全版单色墨印，以精谨木刻刀法将极细铁线空心墨圈与斜削等腰角点雕入印版，随字附刻，纯黑清雅。',
    historicalBackground:
      '宋代浙刻、蜀刻与建阳刻极为繁荣，版面确立了“行款恒定”的刚性格律。刻工将断句墨圈与小角点直接刻于枣梨印版字身右侧，随墨一并刷印，开启了书籍机械化标点之先河。',
    archeologicalArtifacts: [
      '国家图书馆藏宋两浙东路茶盐司刻本《周礼》（宋刻孤本，版随细墨圈句读）',
      '宋绍兴十四年两浙东路转运司刻本《史记》（细铁线墨圈与角点并用）',
      '元至正十一年刻本《文献通考》（元代建阳雕版句读典型）',
      '宋两宋之际巾箱本《论语》（精严铁线墨圈雕印）',
    ],
    typographicRules: [
      '雕版单色墨印：句读圈点与正文同为枣木或梨木雕版墨印，细线空心圈圆润劲拔如铁线，角点如木刻下刀。',
      '四周单边墨栏：宋代善本标志性的单墨线边栏，平正均匀。',
      '中缝单黑鱼尾：折缝版心上方雕刻单黑鱼尾、上象鼻、书名与汉字叶码。',
      '附挂字侧不占格：附于字旁行隙，保持九行十八字刚性字格毫不变形。',
    ],
    references: [
      {
        author: '宿白',
        title: '《唐宋时期的雕版印刷》',
        publisher: '文物出版社',
        note: '考订宋元两浙、蜀中、建阳雕版印版构造、版心鱼尾与版面墨圈刻例。',
      },
      {
        author: '钱存训',
        title: '《中国纸和印刷文化史》',
        publisher: '商务印书馆',
        note: '系统论述宋代雕版技术细节与墨印标点工艺演进。',
      },
      {
        author: '潘美月',
        title: '《宋代版刻考》',
        publisher: '学生书局',
        note: '详释两宋官刻与坊刻善本的边栏、鱼尾与句读刊刻法式。',
      },
    ],
    accompanyingFrame: {
      borderStyle: 'single',
      fishtail: 'single',
      hasLinedColumns: true,
    },
  },
  {
    id: 'ming-qing',
    name: '明清刻本 · 朱墨套印',
    shortName: '明清套印',
    eraSpan: '明代至清代（公元1368年 — 1912年）',
    symbolType: 'woodblock-two-color',
    occupiesSpace: false,
    description:
      '明万历吴兴闵齐伋、凌濛初多色套印技术巅峰。正文沉墨黑字端严，标点圈点以天然朱砂红版分印叠套，朱墨辉映，文雅绝伦。',
    historicalBackground:
      '明代后期饾版与分版套印大行于世，闵凌两家将多色套版用于典籍刊刻。先印正文黑字，再以朱砂红印泥压印句读与圈点批语，朱墨双色争辉，为中国线装善本视觉审美之最高范式。',
    archeologicalArtifacts: [
      '明万历四十四年吴兴闵齐伋朱墨双色套印本《国语》（善本绝品，朱圈句读精整）',
      '明天启元年乌程凌濛初朱墨套印本《世说新语》（朱点句读、朱笔行评）',
      '明万历凌瀛初套印本《杜工部集》（三色套印，朱墨相发）',
      '清乾隆武英殿聚珍版《四库全书荟要》（清代殿版线装规制集大成者）',
    ],
    typographicRules: [
      '朱墨双色分版刷印：标点符号为天然矿物朱砂红色调（#b83625），带微润墨晕。',
      '四周文武双边栏：外粗（2.5px）内细（1px）双边栏，规矩森严。',
      '中缝对鱼尾与象鼻：版心上下对设双黑鱼尾，贯穿黑象鼻，垂直排印叶名与汉字叶码。',
      '字侧附挂不占格：句读精准浮于字身右下空档，绝对不撑破正文刚性格律。',
    ],
    references: [
      {
        author: '赵万里',
        title: '《中国版刻图录》',
        publisher: '文物出版社',
        note: '古籍善本形态集大成者，收录明万历闵凌套印本高精原版图影与形制考。',
      },
      {
        author: '冀淑英',
        title: '《明代闵凌刻套印本考》',
        publisher: '国家图书馆善本论丛',
        note: '详考闵齐伋与凌濛初套印善本之套印版式与朱砂点读机制。',
      },
      {
        author: '屈万里',
        title: '《古籍导读》',
        publisher: '台湾开明书店',
        note: '阐明文武双边栏、对鱼尾象鼻与朱墨套印之古籍标准制式。',
      },
    ],
    accompanyingFrame: {
      borderStyle: 'double',
      fishtail: 'double',
      hasLinedColumns: true,
    },
  },
  {
    id: 'modern',
    name: '近代现代 · 全角独立',
    shortName: '近代现代',
    eraSpan: '1919年新文化运动至今',
    symbolType: 'modern-fullwidth',
    occupiesSpace: true,
    description:
      '新文化运动《请颁行新式标点符号议案》确立的现代标点系统。标点享有独立 1em 全角字宽，严格遵循现代避头尾排版规则。',
    historicalBackground:
      '1919年国语统一筹备会提出《请颁行新式标点符号议案》，经胡适、周作人、钱玄同等倡导，北洋政府教育部于1920年正式颁行。标点从字侧附挂走向独立占格字符流，实现了现代汉语语法结构的精准表达。',
    archeologicalArtifacts: [
      '1919年《请颁行新式标点符号议案》（马裕藻、周作人、朱希祖、刘复、钱玄同、胡适六人联名呈文）',
      '1920年上海亚东图书馆首版标点符号本《水浒传》（胡适作序，中国第一部新式标点白话小说）',
      '1920年北洋政府教育部第53号训令《通令采用新式标点符号》',
      '1951年政务院《关于正确使用祖国语言文字的指示》附《标点符号用法》',
    ],
    typographicRules: [
      '1em 全角独立占格：每个标点独占一个正文字方（100% em），不再附挂于字旁。',
      '现代避头尾禁则（JIS X 4051 / W3C 中文排版指南）：句末点号严禁出现在行首，行首标点自动前推挤入前行行末。',
      '极简开阔装帧：无古代版框、无中缝鱼尾象鼻，以现代流式页面呈现。',
    ],
    references: [
      {
        author: '胡适、钱玄同 等',
        title: '《请颁行新式标点符号议案》',
        publisher: '国语统一筹备会（1919）',
        note: '现代汉语标点符号系统奠基历史文献。',
      },
      {
        author: '林穗芳',
        title: '《中国标点符号史话》',
        publisher: '人民出版社',
        note: '详述近现代新式标点从晚清萌芽到新文化运动确立之全过程。',
      },
      {
        author: '国家质量监督检验检疫总局',
        title: '《国家标准 GB/T 15834-2011 标点符号用法》',
        publisher: '中国标准出版社',
        note: '现行法定国家标点规范标准。',
      },
    ],
    accompanyingFrame: {
      borderStyle: 'none',
      fishtail: 'none',
      hasLinedColumns: false,
    },
  },
]

export const defaultPunctuationStyleId: PunctuationStyleId = 'ming-qing'

export function getPunctuationStyle(id?: PunctuationStyleId): PunctuationStyle {
  return punctuationStyles.find((s) => s.id === id) ?? punctuationStyles[3] // 默认明清套印
}

/**
 * 依据文章所属朝代字段纯函数推导默认时代标点风格。
 *
 * 优先朝代联动原则：
 * - 先秦两汉（春秋、战国、先秦、秦、西汉、东汉等） -> pre-qin
 * - 魏晋隋唐（魏、晋、三国、六朝、南北朝、隋、唐、五代等） -> wei-jin
 * - 宋元雕版（宋、北宋、南宋、辽、金、元等） -> song-yuan
 * - 明清刻本（明、清等） -> ming-qing
 * - 近现代或缺省古风回退 -> ming-qing（最受喜爱的典雅刻本），若显式为现当代则为 modern
 */
export function getEraPunctuationStyle(era?: string): PunctuationStyleId {
  if (!era) return 'ming-qing'
  const clean = era.trim()
  if (/现|当|近/.test(clean)) return 'modern'
  if (/商|周|春秋|战国|先秦|秦|汉/.test(clean)) return 'pre-qin'
  if (/魏|晋|三国|六朝|南北朝|隋|唐|五代/.test(clean)) return 'wei-jin'
  if (/宋|辽|金|元/.test(clean)) return 'song-yuan'
  if (/明|清/.test(clean)) return 'ming-qing'
  return 'ming-qing'
}

/**
 * 时代标点纯化转换器：
 * 当选择古代四大时代标点体系（先秦两汉、魏晋隋唐、宋元雕版、明清刻本）时，
 * 严格剥离现代特有的外加书名号《》、引号“”‘’「」、括号等符号，
 * 统一将大句停顿（。？！；）归并为「。」，小读分句（，、）归并为「，」，
 * 保证一次只加载一种该时期的纯正标点体系，杜绝古今标点参杂混用。
 * 当选择「近代现代」模式时，保留全部现代标点符号与书名号。
 */
export function sanitizeTextForEra(text: string, styleId: PunctuationStyleId): string {
  if (styleId === 'modern' || !text) {
    return text
  }

  let result = text
    // 1. 彻底移除现代外加的成对符号：书名号、引号、各类现代括号
    .replace(/[《》〈〉]/g, '')
    .replace(/[“”‘’「」『』"']/g, '')
    .replace(/[（）()【】〔〕［］｛｝]/g, '')

  // 2. 现代冒号处理：在古人引语（如“子曰：”、“客曰：”）中转为分读逗号，其余转为逗号
  result = result.replace(/([曰云道问答语谓说歌])：/g, '$1，')
  result = result.replace(/：/g, '，')

  // 3. 破折号与省略号处理
  result = result.replace(/[—–—]{1,}/g, '，')
  result = result.replace(/[….]{2,}/g, '。')

  // 4. 统一归并停顿为古籍二元句读：
  // 大句（句终、问、叹、分号）->「。」
  result = result.replace(/[。？！；]/g, '。')
  // 小读（停顿、逗号、顿号）->「，」
  result = result.replace(/[，、]/g, '，')

  // 5. 清除连续重复出现的标点（例如「，，」->「，」，「。。」->「。」，「，。」->「。」）
  result = result.replace(/[，。]*[。][，。]*/g, '。')
  result = result.replace(/[，]{2,}/g, '，')

  return result
}

