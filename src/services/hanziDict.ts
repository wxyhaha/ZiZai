export interface HanziDictRawEntry {
  p: string // pinyin
  r: string // radical
  s: number // strokes
  d: string // definition
  src?: string // source
}

export interface HanziInfo {
  char: string
  pinyin?: string
  radical?: string
  strokes?: number
  definition: string
  source: string
  hasDictData: boolean
}

let cachedDict: Record<string, HanziDictRawEntry> | null = null
let loadPromise: Promise<Record<string, HanziDictRawEntry>> | null = null

/**
 * 异步按需加载字典数据，避免在首页加载时引入约 700KB 的 JSON 资源
 */
async function loadDict(): Promise<Record<string, HanziDictRawEntry>> {
  if (cachedDict) return cachedDict
  if (!loadPromise) {
    loadPromise = import('@/data/hanzidict.json').then((module) => {
      cachedDict = module.default as Record<string, HanziDictRawEntry>
      return cachedDict
    })
  }
  return loadPromise
}

/**
 * 查询指定汉字的释义与元信息
 * @param char 单个汉字字符
 */
export async function getHanziInfo(char: string): Promise<HanziInfo> {
  const dict = await loadDict()
  const entry = dict[char]

  if (entry) {
    return {
      char,
      pinyin: entry.p || undefined,
      radical: entry.r || undefined,
      strokes: entry.s > 0 ? entry.s : undefined,
      definition: entry.d || '暂无详细释义',
      source: entry.src ? `${entry.src} (MIT)` : 'HanziDict (MIT)',
      hasDictData: true,
    }
  }

  // 兜底降级处理：如实标注，不编造释义
  return {
    char,
    pinyin: undefined,
    radical: undefined,
    strokes: undefined,
    definition: '暂无收录释义（此字可能属于现代通用规范汉字表外或古籍异体字）。',
    source: 'HanziDict (MIT License)',
    hasDictData: false,
  }
}
