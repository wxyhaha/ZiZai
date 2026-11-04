// scripts/build-hanzidict.mjs
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outputPath = path.resolve(rootDir, 'src/data/hanzidict.json')

const BASE_URL = 'https://raw.githubusercontent.com/sinobaba/hanzidict/master/data'

async function fetchCsv(filename) {
  console.log(`正在获取 ${filename}...`)
  const res = await fetch(`${BASE_URL}/${filename}`)
  if (!res.ok) {
    throw new Error(`获取 ${filename} 失败: HTTP ${res.status}`)
  }
  return res.text()
}

/**
 * 极简 CSV 行解析器（支持双引号包围的逗号与转义双引号）
 */
function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

async function main() {
  console.log('开始拉取开源 HanziDict 规范字数据...')

  // 1. 获取 characters.csv: official_no,char,usage_level,hsk_level,radical,strokes,total_strokes,stroke_order
  const charsCsv = await fetchCsv('characters.csv')
  const charLines = charsCsv.split(/\r?\n/).filter(Boolean)
  const charHeader = parseCsvLine(charLines[0])
  const charIdx = charHeader.indexOf('char')
  const radIdx = charHeader.indexOf('radical')
  const strokeIdx = charHeader.indexOf('total_strokes')

  const dict = {}

  for (let i = 1; i < charLines.length; i++) {
    const cols = parseCsvLine(charLines[i])
    const char = cols[charIdx]
    if (!char) continue
    dict[char] = {
      p: '',
      r: cols[radIdx] || '',
      s: Number(cols[strokeIdx]) || 0,
      d: '',
      src: 'HanziDict',
    }
  }

  console.log(`已载入 ${Object.keys(dict).length} 个规范汉字基础字形数据。`)

  // 2. 获取 char_pronunciations.csv: char,pinyin,pinyin_numeric
  const pronCsv = await fetchCsv('char_pronunciations.csv')
  const pronLines = pronCsv.split(/\r?\n/).filter(Boolean)
  const pronHeader = parseCsvLine(pronLines[0])
  const pronCharIdx = pronHeader.indexOf('char')
  const pronPinyinIdx = pronHeader.indexOf('pinyin')

  for (let i = 1; i < pronLines.length; i++) {
    const cols = parseCsvLine(pronLines[i])
    const char = cols[pronCharIdx]
    const pinyin = cols[pronPinyinIdx]
    if (char && dict[char] && !dict[char].p) {
      dict[char].p = pinyin
    }
  }

  console.log('已载入注音拼音数据。')

  // 3. 获取 glosses.csv: char,pinyin,pinyin_numeric,pos,pos_en,content,content_en,examples,source
  const glossCsv = await fetchCsv('glosses.csv')
  const glossLines = glossCsv.split(/\r?\n/).filter(Boolean)
  const glossHeader = parseCsvLine(glossLines[0])
  const glossCharIdx = glossHeader.indexOf('char')
  const glossContentIdx = glossHeader.indexOf('content')
  const glossSourceIdx = glossHeader.indexOf('source')

  for (let i = 1; i < glossLines.length; i++) {
    const cols = parseCsvLine(glossLines[i])
    const char = cols[glossCharIdx]
    const content = cols[glossContentIdx]
    const source = cols[glossSourceIdx]
    if (char && dict[char] && !dict[char].d && content) {
      // 选取首个有效中文释义
      dict[char].d = content
      if (source) {
        dict[char].src = source
      }
    }
  }

  console.log('已载入释义数据。正在保存 JSON 文件...')

  const jsonStr = JSON.stringify(dict)
  await fs.writeFile(outputPath, jsonStr, 'utf-8')
  const stat = await fs.stat(outputPath)
  console.log(`生成成功！输出文件: ${outputPath} (${(stat.size / 1024).toFixed(1)} KB)`)
}

main().catch((err) => {
  console.error('构建失败:', err)
  process.exit(1)
})
