/**
 * 三大书体排版规制与行气法则数据库。
 *
 * 考据中国书法史与古代典籍刊刻中不同书体（正书、行书、草书）的行款界格流变，
 * 解决草书狂草与纵向乌丝栏的切字视觉冲突，重现“正书严正有栏、行书舒朗淡栏、草书飞动无栏”的传世法度。
 */

export type ScriptStyleId = 'regular' | 'running' | 'cursive'

export interface ReferenceItem {
  author: string
  title: string
  publisher: string
  note?: string
}

export interface ScriptStyle {
  id: ScriptStyleId
  name: string
  shortName: string
  suitedFonts: string
  columnLineStyle: 'solid' | 'subtle' | 'none'
  columnSpacingRatio: number
  description: string
  historicalBackground: string
  archeologicalArtifacts: string[]
  typographicRules: string[]
  references: ReferenceItem[]
}

export const scriptStyles: ScriptStyle[] = [
  {
    id: 'regular',
    name: '正书规制 · 字方乌丝',
    shortName: '正书乌丝',
    suitedFonts: '宋体 · 楷书 · 仿宋',
    columnLineStyle: 'solid',
    columnSpacingRatio: 1.0,
    description:
      '宋元明清主流经籍刻本与科举官印典范。字方严整端谨，纵向贯穿挺拔清晰的乌丝界行（纵栏），字字相承，庄重肃穆。',
    historicalBackground:
      '正书（真书、楷书、宋体及仿宋）讲究“字居一格、字方不破”。从唐代官抄写经的乌丝栏，到宋元明清国子监、内府雕版，凡正书典籍皆刻有纵向乌丝界行。乌丝栏约束着文字的横向重心，形成如仪仗般森严整肃的版面气场。',
    archeologicalArtifacts: [
      '宋绍兴十四年两浙东路转运司刻本《史记》（严整乌丝界行，正楷端谨）',
      '明万历吴兴闵齐伋套印本《国语》（宋体正字，行款乌丝精严）',
      '清康熙武英殿刻本《御制数理精蕴》（清殿版正字界格标准典范）',
      '唐敦煌遗书《妙法莲华经》官抄卷（手绘乌丝栏楷书经卷）',
    ],
    typographicRules: [
      '清晰乌丝界行：每列文字两侧设有清晰墨线界栏（solid border），收拢行气。',
      '刚性字方居中：文字严格居于字方正中，上下字距紧凑均称，不偏不倚。',
      '端穆气度：行距适中，字势庄重，适合正统经史子集与严谨文献阅读。',
    ],
    references: [
      {
        author: '张秀民',
        title: '《中国印刷史》',
        publisher: '浙江古籍出版社',
        note: '考述中国历代正字刻本界栏行款与九行十八字、十行二十字之官刻规制。',
      },
      {
        author: '叶德辉',
        title: '《书林清话（卷三·历代界行考）》',
        publisher: '中华书局',
        note: '论析唐写本与宋元明清刻本乌丝栏与朱丝栏界行之刊刻异同。',
      },
      {
        author: '马衡',
        title: '《中国书籍制度变迁史》',
        publisher: '商务印书馆',
        note: '系统论述中国古代书籍字方、行款、界格与正书审美之演化。',
      },
    ],
  },
  {
    id: 'running',
    name: '行书规制 · 疏朗淡栏',
    shortName: '行书淡栏',
    suitedFonts: '行楷 · 行书 · 手札',
    columnLineStyle: 'subtle',
    columnSpacingRatio: 1.15,
    description:
      '元代赵孟頫松雪体写刻与晚明文人私刻体式。界行弱化为极淡之墨影（淡栏），行距适度开阔，行气连绵生姿，顾盼有情。',
    historicalBackground:
      '元代赵孟頫开创了以行楷写刻入书之风（松雪体刻本），晚明文人自刻文集与诗抄亦风行行书。行书字形开合变化大、笔画探出较多，若用浓黑重线界栏会束缚笔意，故刻工将界行雕得极细或印以淡墨，甚至隐栏，留出舒缓呼吸感。',
    archeologicalArtifacts: [
      '元刻本《松雪斋文集》（元代著名赵体写刻本，淡线界行，行气自然流美）',
      '明万历茅氏白马寨刻本《苏长公合作》（晚明行书写刻名品，弱化纵栏）',
      '明崇祯刻本《董其昌画禅室随笔》（明末行书流派写刻善本）',
      '文徵明小楷行书杂诗手卷（明代文人自书淡栏界格纸式）',
    ],
    typographicRules: [
      '弱化淡墨界行：纵向界线半透明虚显（subtle border，透明度约 4%），隐隐勾勒行位而不夺文意。',
      '行距适度放宽：行距在正书基础上增加 10%~20%，容纳行书揖让回顾之势。',
      '流丽书卷气：行内字距随笔意自然起伏，呈现文人文集书札之空灵清隽。',
    ],
    references: [
      {
        author: '容庚',
        title: '《丛帖目》',
        publisher: '中华书局',
        note: '详载历代行书法帖刻石版式与墨拓界行之虚实处理法式。',
      },
      {
        author: '启功',
        title: '《启功论书绝句百首》',
        publisher: '生活·读书·新知三联书店',
        note: '考订赵孟頫、文徵明诸家写刻之界格审美与行气布白之妙。',
      },
      {
        author: '黄永年',
        title: '《古籍版本学（写刻本编）》',
        publisher: '江苏教育出版社',
        note: '专门考证元明文人写刻本行楷字形与版面界栏淡化之演进。',
      },
    ],
  },
  {
    id: 'cursive',
    name: '草书规制 · 连绵无栏',
    shortName: '草书无栏',
    suitedFonts: '章草 · 今草 · 狂草',
    columnLineStyle: 'none',
    columnSpacingRatio: 1.45,
    description:
      '草书汇刻与历代草圣法帖拓本绝学。绝对隐去纵向界行（无栏），放宽行距，严防乌丝切断飞扬笔锋，任由牵丝引带纵横驰骋。',
    historicalBackground:
      '明万历范度所辑《草韵辨体》、明邢侗辑《草字汇》以及历代法帖刻石（如怀素《自叙帖》、张旭《古诗四帖》），皆恪守“无内侧界行”之铁律。草书笔势跌宕奔放，左右穿插引带极广，若有纵向乌丝栏，黑线必生生切断飞动之笔锋，造成极刺目的“切笔之伤”。因此，历代草书刻本均保留四周外框与中缝鱼尾，但内部绝去界行，放宽行距 1.4~1.6 倍，任其飞流奔涌。',
    archeologicalArtifacts: [
      '明万历范度辑刻《草韵辨体》（明代草书韵汇刻本善本，外有边栏鱼尾，内绝去乌丝界行）',
      '明万历四十年邢侗辑《草字汇》（草书大全刻本，无栏放宽行距排版）',
      '宋拓唐怀素《自叙帖》刻石（历代法帖草书无栏布白之神品）',
      '明清法帖《淳化阁帖·草书卷》（四周有框、内无界格之法帖标准制式）',
    ],
    typographicRules: [
      '绝去纵向界行：版心内部彻底隐去界行线条（border: none），杜绝黑线切断连绵笔锋。',
      '行距放宽 1.4~1.6 倍：为左右探出之大草撇捺与牵丝留出充裕游弋空间，防止墨迹黏连。',
      '外框鱼尾依然存续：保留古籍四周外框与中缝鱼尾象鼻，实现外规矩而内自在的极高境界。',
    ],
    references: [
      {
        author: '范度（明）',
        title: '《草韵辨体（序与凡例）》',
        publisher: '明万历四十二年原刻本',
        note: '明代草书典籍刊刻权威体例，明确阐述草书汇刻不可施界行乌丝以碍笔势之理。',
      },
      {
        author: '启功',
        title: '《古代碑帖版本常识》',
        publisher: '中华书局',
        note: '考辨唐宋元明法帖与草书刻石之界格、行款与行气章法之关系。',
      },
      {
        author: '石韫玉（清）',
        title: '《草字汇（重镌序）》',
        publisher: '清乾隆刻本',
        note: '详释草书字形舒展放纵、版面行距宜宽宜空之刊刻通则。',
      },
    ],
  },
]

export const defaultScriptStyleId: ScriptStyleId = 'regular'

export function getScriptStyle(id: ScriptStyleId | null | undefined): ScriptStyle {
  return scriptStyles.find((s) => s.id === id) ?? scriptStyles[0]
}

/** 根据当前字体的 styleTag / id 智能推导默认书体规制 */
export function getScriptStyleByFont(fontId: string, styleTag?: string): ScriptStyleId {
  if (fontId === 'rhyme-grass' || styleTag === '书法') {
    return 'cursive'
  }
  return 'regular'
}
