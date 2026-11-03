/**
 * 宣纸与古籍笺纸底色系统。
 *
 * 参考黄令东（Lingdong Huang）韵草体与齐伋体善本测试台（https://rg-font.netlify.app/）
 * 提供的 10 款经典古典纸张底色，并配以中国传统文人雅致纸品命名。
 */

export type PaperThemeId =
  | 'antiquewhite'
  | 'cornsilk'
  | 'floralwhite'
  | 'ghostwhite'
  | 'ivory'
  | 'linen'
  | 'oldlace'
  | 'seashell'
  | 'white'
  | 'whitesmoke'

export interface PaperTheme {
  id: PaperThemeId
  name: string
  labelEn: string
  color: string
  borderColor: string
  description: string
}

export const defaultPaperThemeId: PaperThemeId = 'antiquewhite'

export const paperThemes: PaperTheme[] = [
  {
    id: 'antiquewhite',
    name: '仿古竹纸',
    labelEn: 'ANTIQUEWHITE',
    color: '#FAEBD7',
    borderColor: 'rgba(92, 64, 51, 0.22)',
    description: '温润微黄的天然竹纸，泛古籍特有的柔和微光，适合长时间沉浸阅读。',
  },
  {
    id: 'cornsilk',
    name: '麦黄皮纸',
    labelEn: 'CORNSILK',
    color: '#FFF8DC',
    borderColor: 'rgba(102, 70, 40, 0.22)',
    description: '如秋熟麦穗与老树构皮的古雅微黄色调，朴茂浑厚。',
  },
  {
    id: 'floralwhite',
    name: '柔光暖宣',
    labelEn: 'FLORALWHITE',
    color: '#FFFAF0',
    borderColor: 'rgba(80, 60, 50, 0.18)',
    description: '净皮生宣微温如玉，柔白不刺眼，呈现细腻素雅的手工宣纸质感。',
  },
  {
    id: 'ghostwhite',
    name: '雪青冷宣',
    labelEn: 'GHOSTWHITE',
    color: '#F8F8FF',
    borderColor: 'rgba(60, 60, 90, 0.18)',
    description: '清冷皎洁、带有一抹淡雅天青的冷玉宣纸，墨色对比沉静清晰。',
  },
  {
    id: 'ivory',
    name: '象牙玉扣',
    labelEn: 'IVORY',
    color: '#FFFFF0',
    borderColor: 'rgba(85, 75, 50, 0.18)',
    description: '典雅温润的传统象牙玉扣纸，古雅端丽，沉静悦目。',
  },
  {
    id: 'linen',
    name: '浅赭麻纸',
    labelEn: 'LINEN',
    color: '#FAF0E6',
    borderColor: 'rgba(90, 65, 50, 0.22)',
    description: '如古朴织麻与汉唐麻纸般温润古朴，隐现自然纤维之韵。',
  },
  {
    id: 'oldlace',
    name: '沉香陈纸',
    labelEn: 'OLDLACE',
    color: '#FDF5E6',
    borderColor: 'rgba(95, 70, 45, 0.2)',
    description: '岁序沉淀的明清藏书陈纸，岁月沉香，淡雅怡人。',
  },
  {
    id: 'seashell',
    name: '海贝淡粉',
    labelEn: 'SEASHELL',
    color: '#FFF5EE',
    borderColor: 'rgba(100, 60, 55, 0.2)',
    description: '泛着若隐若现淡粉晕泽的桃花古笺，文气浪漫。',
  },
  {
    id: 'white',
    name: '澄心纯白',
    labelEn: 'WHITE',
    color: '#FFFFFF',
    borderColor: 'rgba(0, 0, 0, 0.15)',
    description: '光洁如雪、平滑如砥的澄心堂古法纯宣，对比极度分明。',
  },
  {
    id: 'whitesmoke',
    name: '白烟墨痕',
    labelEn: 'WHITESMOKE',
    color: '#F5F5F5',
    borderColor: 'rgba(50, 50, 50, 0.18)',
    description: '如白烟轻笼、古纸落墨的淡灰宣纸，雅致静穆。',
  },
]

export function getPaperTheme(id: string): PaperTheme {
  const match = paperThemes.find((p) => p.id === id)
  if (match) return match
  return paperThemes[0]
}
