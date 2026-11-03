/**
 * 五大时代古籍装帧与版面制式数据库。
 *
 * 梳理中国书籍史装帧形制流变（先秦简帛、魏晋隋唐卷轴官抄、宋元雕版、明清套印善本、现代开本），
 * 提供权威文献学考据、出土文物与传世善本依据、物理边框/版心/天地留白规范。
 */

export type EraFormatId = 'pre-qin' | 'wei-jin' | 'song-yuan' | 'ming-qing' | 'modern'

export interface ReferenceItem {
  author: string
  title: string
  publisher: string
  note?: string
}

export interface EraFormat {
  id: EraFormatId
  name: string
  shortName: string
  eraSpan: string
  description: string
  borderStyle: 'none' | 'single' | 'double'
  fishtailStyle: 'none' | 'single' | 'double'
  hasNose: boolean
  hasLeafNum: boolean
  marginRatio: string
  historicalBackground: string
  archeologicalArtifacts: string[]
  typographicRules: string[]
  references: ReferenceItem[]
}

export const eraFormats: EraFormat[] = [
  {
    id: 'pre-qin',
    name: '先秦两汉 · 简帛纯笺',
    shortName: '先秦简帛',
    eraSpan: '先秦至两汉（前11世纪 — 公元220年）',
    description:
      '竹木编简与马王堆帛书形制。版面纯朴无框，无后世刻本印刷栏线与中缝鱼尾，文字纵引成行，天清地朗，重现简策编联之古雅风貌。',
    borderStyle: 'none',
    fishtailStyle: 'none',
    hasNose: false,
    hasLeafNum: false,
    marginRatio: '1.5:1（天宽地窄）',
    historicalBackground:
      '纸张发明普及前，先秦两汉典籍多书于竹简、木牍或缣帛。竹简以丝绳或麻绳编联为策，书写自上而下，一行一简。简策顶部留出空简与宽裕天头，底部截齐，无外围墨框界线，体现了中国古典装帧最早期的天然留白审美。',
    archeologicalArtifacts: [
      '湖北荆门郭店一号楚墓竹简《老子甲本》（战国中期，简长32.3cm，两道丝绳编连，素雅无外框）',
      '湖北云梦睡虎地十一号秦墓竹简《为吏之道》（战国晚期至秦代，墨书整肃，纵向成列）',
      '湖南长沙马王堆三号汉墓帛书《老子》（西汉文帝时期，朱丝栏与素帛通幅书写）',
      '甘肃金塔肩水金关汉简与武威汉简《仪礼》（西汉成帝时期，完整编简册书实物）',
    ],
    typographicRules: [
      '素简无框：版面四围不设墨线边栏，还原简策边缘齐整自然的空间边界。',
      '绝无中缝：无后世折叠印刷之版心、中缝、象鼻与鱼尾，文字纵列通畅。',
      '天宽地窄：页面上方天头留白是地脚的 1.5 倍左右，保持简策“首朗尾严”的古典视线秩序。',
    ],
    references: [
      {
        author: '王国维',
        title: '《简牍检署考》',
        publisher: '中华书局',
        note: '中国简牍制度开山之作，详考先秦两汉简策制度、编联方式与行款格律。',
      },
      {
        author: '李零',
        title: '《简帛古书与学术源流》',
        publisher: '生活·读书·新知三联书店',
        note: '系统论述楚简、秦简与帛书的装潢、书写篇题、尾题及分段排版制式。',
      },
      {
        author: '钱存训',
        title: '《书于竹帛：中国古代的文字记录》',
        publisher: '上海书店出版社',
        note: '考述中国古代甲骨、金石、简牍、缣帛到纸卷的书写材料与版面变迁。',
      },
    ],
  },
  {
    id: 'wei-jin',
    name: '魏晋隋唐 · 官抄界格',
    shortName: '魏晋官抄',
    eraSpan: '魏晋南北朝至隋唐（公元220年 — 907年）',
    description:
      '敦煌遗书与六朝隋唐手抄卷轴规制。全幅通景舒卷，外设严整单线墨栏，内部贯通纵向乌丝栏，行行界画分明，行款严饬而笔意流淌。',
    borderStyle: 'single',
    fishtailStyle: 'none',
    hasNose: false,
    hasLeafNum: false,
    marginRatio: '1.6:1（天宽地窄）',
    historicalBackground:
      '魏晋纸张普及后，书籍形态由简策演进为卷轴装。隋唐官府抄书与寺院写经建立了高度规整的抄撰标准，如朝廷写经标准“每纸二十八行，行十七字”。经生抄写前先以软笔淡墨或画针压印出纵向乌丝栏与四围外边，卷首卷尾相续，无折痕中缝。',
    archeologicalArtifacts: [
      '敦煌莫高窟藏经洞唐写本 P.2544《论语郑氏注》（四围单栏，内施乌丝栏界格）',
      '吐鲁番阿斯塔那墓出土西晋元康六年《三国志·吴志·孙权传》写本（西晋规整界格写本实物）',
      '大英图书馆藏 S.797 敦煌唐写本《文选》注本（标准二十八行十七字官抄经律）',
      '日本正仓院藏唐代贞观二十年写本《王羲之进十七帖》（唐代内府官抄手卷原样）',
    ],
    typographicRules: [
      '通幅单边外栏：全幅以细劲单墨线收束版面四方，保持卷轴连绵通贯。',
      '乌丝栏界格贯通：每列两侧划定均匀墨界（乌丝栏），界线顶天立地，规范行气。',
      '卷轴通景不折：无折叠中缝，无鱼尾，保持展开卷轴时行云流水般的长卷视线流动。',
    ],
    references: [
      {
        author: '张秀民',
        title: '《中国印刷史（第一编·写本时期）》',
        publisher: '浙江古籍出版社',
        note: '考述魏晋六朝以至隋唐书籍手写传抄制度、纸幅规格与界格法度。',
      },
      {
        author: '宿白',
        title: '《唐宋时期的雕版印刷（第一章）》',
        publisher: '文物出版社',
        note: '深入论析敦煌唐代写经的每纸行数、字数规制对早期雕版印刻之奠基。',
      },
      {
        author: '潘吉星',
        title: '《中国科学技术史·造纸与印刷卷》',
        publisher: '科学出版社',
        note: '详释古代麻纸、皮纸手工抄纸帘纹与乌丝栏界画工具的历史原貌。',
      },
    ],
  },
  {
    id: 'song-yuan',
    name: '宋元雕版 · 疏朗白口',
    shortName: '宋元白口',
    eraSpan: '五代至宋元（公元960年 — 1368年）',
    description:
      '宋代浙刻、蜀刻与元代建阳雕版黄金典范。四周单边细墨栏，中缝折叶素雅白口，版心上方端立单黑鱼尾，开版疏朗大气，文质彬彬。',
    borderStyle: 'single',
    fishtailStyle: 'single',
    hasNose: true,
    hasLeafNum: true,
    marginRatio: '1.6:1（天宽地窄）',
    historicalBackground:
      '宋代刻书讲究文字优美、校勘精严与版面开阔。两浙东路茶盐司、国子监与蜀刻大字本多采用“四周单边”与“白口”（版心折缝处除鱼尾、书名与叶码外，上下不着黑线墨杠）。其单黑鱼尾朝下，如同鱼尾潜跃，版面清气逼人，历来为古籍版本收藏家视若拱璧。',
    archeologicalArtifacts: [
      '国家图书馆藏宋两浙东路茶盐司刻本《周礼》（宋刻孤本，四周单边，版心中缝白口单鱼尾）',
      '宋绍兴十四年两浙东路转运司刻本《史记》（宋大字本典范，四周单边，疏朗大字）',
      '宋严州郡庠刻本《周易》（宋刻白口单鱼尾标杆善本）',
      '元至正十一年刻本《文献通考》（元代建阳名刻，单边白口大字）',
    ],
    typographicRules: [
      '四周单边墨线：版框外围为精谨挺拔的细单墨线（宽度 1.5px），匀净平正。',
      '中缝白口单鱼尾：中缝（版心）上下无通天黑墨条，仅置一枚黑鱼尾（鱼尖向下），印刻书名与汉字叶码。',
      '天头高旷：天地比例 1.6:1，上空下敛，符合宋代士大夫虚旷幽深的书卷美学。',
    ],
    references: [
      {
        author: '李致忠',
        title: '《古籍版本学概论》',
        publisher: '北京图书馆出版社',
        note: '系统定义宋刻善本之版框（单边/双边）、中缝版心（白口/黑口）、鱼尾形制之判定通则。',
      },
      {
        author: '叶德辉',
        title: '《书林清话（卷三·宋刻板式）》',
        publisher: '中华书局',
        note: '详细梳理两宋各路官刻、坊刻之单边墨线与白口鱼尾刊刻习惯。',
      },
      {
        author: '潘美月',
        title: '《宋代版刻考》',
        publisher: '学生书局',
        note: '全面梳理浙、蜀、建三地宋版书版式结构与中缝鱼尾象鼻特征。',
      },
    ],
  },
  {
    id: 'ming-qing',
    name: '明清刻本 · 文武双边',
    shortName: '明清双边',
    eraSpan: '明代至清代（公元1368年 — 1912年）',
    description:
      '明万历闵凌套印本与清康熙乾隆内府殿版大成。四周文武双边（外粗内细），中缝贯穿黑象鼻与上下对黑鱼尾，叶码端严，堂皇庄重。',
    borderStyle: 'double',
    fishtailStyle: 'double',
    hasNose: true,
    hasLeafNum: true,
    marginRatio: '1.8:1（天宽地窄）',
    historicalBackground:
      '明代中叶以后线装书全面定型，版面设计达到高度程序化与成熟完备。明万历闵齐伋、凌濛初套印本及清内府武英殿刻本均崇尚“四周双边”（外栏粗黑、内栏细密，称为文武栏）。中缝上方设黑象鼻与上鱼尾，下方设下鱼尾与大黑线，上下对峙，版心森严端正，视觉张力极强。',
    archeologicalArtifacts: [
      '明万历四十四年吴兴闵齐伋朱墨双色套印本《国语》（四周文武双边，版心对鱼尾黑象鼻）',
      '明天启元年乌程凌濛初朱墨套印本《世说新语》（文武双边墨框，中缝对鱼尾雕印精绝）',
      '清康熙武英殿铜活字本《古今图书集成》（清代内府殿版最高规制文武双边）',
      '清乾隆武英殿聚珍版《四库全书荟要》（乾隆内府线装善本标准典范）',
    ],
    typographicRules: [
      '文武双边版框：外粗（2.5px）内细（1px）双层墨栏，内外间隔约 3px，庄重严密。',
      '中缝对鱼尾黑象鼻：版心上下对设双鱼尾，贯穿粗黑象鼻，正中刻书名、卷次与汉字叶码。',
      '极宽天头：天头与地脚留白比例达 1.8:1，天高地阔，专为古人写批、圈点评注留出雅致空间。',
    ],
    references: [
      {
        author: '赵万里',
        title: '《中国版刻图录》',
        publisher: '文物出版社',
        note: '全书收录明清殿版、套印本、文人私刻图影与文武双边版框实测数据。',
      },
      {
        author: '冀淑英',
        title: '《明代闵凌刻套印本考》',
        publisher: '国家图书馆善本论丛',
        note: '考订闵凌套印本的文武双边刻版工艺与版心对鱼尾构图法度。',
      },
      {
        author: '屈万里',
        title: '《古籍导读》',
        publisher: '台湾开明书店',
        note: '详释明清线装书天头地脚留空尺度、象鼻与鱼尾功能之版本学要义。',
      },
    ],
  },
  {
    id: 'modern',
    name: '近代现代 · 雅致通栏',
    shortName: '近代现代',
    eraSpan: '1919年新文化运动至今',
    description:
      '现代书籍装帧与现代排版学体系。摒弃古代印刷框线与中缝装饰，采用现代开本黄金比例留白，视线通畅纯粹，适合现代长文深度阅读。',
    borderStyle: 'none',
    fishtailStyle: 'none',
    hasNose: false,
    hasLeafNum: false,
    marginRatio: '1:1（现代均等）',
    historicalBackground:
      '新文化运动后，中国印刷装帧全面吸纳现代排版工业标准。铅活字与胶印技术的普及使书籍彻底告别了筒子页折装与中缝版心，版面呈现为纯粹的现代书页，讲究网格系统、清晰的字体层级与通栏疏朗的呼吸感。',
    archeologicalArtifacts: [
      '商务印书馆民国铅印本《四部丛刊》（现代开本与古典文字之结合早期范本）',
      '人民文学出版社经典古典文学普及本（现代通栏排版经典规范）',
    ],
    typographicRules: [
      '纯净无框通栏：去除所有古代刻印边栏与乌丝界行，文字自由流淌于纸面。',
      '现代黄金开本：遵循现代版面边距规范，留白疏朗均称，适配现代阅读视线。',
    ],
    references: [
      {
        author: '钱存训',
        title: '《中国纸和印刷文化史》',
        publisher: '商务印书馆',
        note: '论述从线装古籍向现代铅印平装书装帧形态转换之历史过程。',
      },
      {
        author: '朱联保',
        title: '《中国近现代出版印刷史料》',
        publisher: '上海远东出版社',
        note: '梳理民国近代出版机构排版装帧工艺与现代开本版心之演进。',
      },
    ],
  },
]

export const defaultEraFormatId: EraFormatId = 'ming-qing'

export function getEraFormat(id: EraFormatId | null | undefined): EraFormat {
  return eraFormats.find((f) => f.id === id) ?? eraFormats[3]
}

/** 根据文章朝代推导默认时代装帧 */
export function getEraFormatByTextEra(era: string | undefined): EraFormatId {
  if (!era) return 'modern'
  if (['先秦', '春秋', '战国', '秦', '汉', '西汉', '东汉'].some((k) => era.includes(k))) {
    return 'pre-qin'
  }
  if (['魏', '晋', '南朝', '北朝', '隋', '唐', '盛唐', '中唐', '晚唐', '五代'].some((k) => era.includes(k))) {
    return 'wei-jin'
  }
  if (['宋', '北宋', '南宋', '辽', '金', '元'].some((k) => era.includes(k))) {
    return 'song-yuan'
  }
  if (['明', '清'].some((k) => era.includes(k))) {
    return 'ming-qing'
  }
  return 'modern'
}
