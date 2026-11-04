# -*- coding: utf-8 -*-
"""
Generate modular authoritative texts dataset for ZiZai:
1. src/data/texts/preQinHan.ts (先秦两汉)
2. src/data/texts/weiJin.ts (魏晋南北朝)
3. src/data/texts/tang.ts (隋唐五代)
4. src/data/texts/songYuan.ts (两宋金元)
5. src/data/texts/mingQingModern.ts (明清及现代)
6. src/data/texts/index.ts
"""
import os
import json
import re

from texts_data.pre_qin_han import PRE_QIN_HAN_TEXTS
from texts_data.wei_jin import WEI_JIN_TEXTS
from texts_data.tang import TANG_TEXTS
from texts_data.song_yuan import SONG_YUAN_TEXTS
from texts_data.ming_qing_modern import MING_QING_MODERN_TEXTS

# Regular expression to strip punctuation and whitespace for pure Hanzi count
PUNCT_REGEX = re.compile(r'[\s，。？！、；：“”‘’《》〈〉（）〔〕【】—…·\-_·.,?!:;\'"()\[\]]')

def calculate_char_count(paragraphs):
    full_text = "".join(paragraphs)
    pure_chars = PUNCT_REGEX.sub("", full_text)
    return len(pure_chars)

def get_length_tier(char_count):
    if char_count < 150:
        return "short"
    elif char_count <= 600:
        return "medium"
    else:
        return "long"

def process_texts(raw_texts, era_group):
    processed = []
    for t in raw_texts:
        entry = dict(t)
        count = calculate_char_count(entry["paragraphs"])
        entry["charCount"] = count
        entry["lengthTier"] = get_length_tier(count)
        entry["eraGroup"] = era_group
        processed.append(entry)
    return processed

def to_ts_export(texts, export_name):
    json_str = json.dumps(texts, ensure_ascii=False, indent=2)
    return f"""import type {{ TextEntry }} from '@/types/text'

export const {export_name}: TextEntry[] = {json_str}
"""

def main():
    target_dir = os.path.join(os.path.dirname(__file__), "..", "src", "data", "texts")
    os.makedirs(target_dir, exist_ok=True)

    pre_qin_han = process_texts(PRE_QIN_HAN_TEXTS, "先秦两汉")
    wei_jin = process_texts(WEI_JIN_TEXTS, "魏晋")
    tang = process_texts(TANG_TEXTS, "唐代")
    song_yuan = process_texts(SONG_YUAN_TEXTS, "宋元")
    ming_qing_modern = process_texts(MING_QING_MODERN_TEXTS, "明清现代")

    all_texts = pre_qin_han + wei_jin + tang + song_yuan + ming_qing_modern

    # Check for duplicate IDs
    seen_ids = set()
    for t in all_texts:
        if t["id"] in seen_ids:
            raise ValueError(f"Duplicate ID found: {t['id']}")
        seen_ids.add(t["id"])

    print(f"Total texts: {len(all_texts)}")
    print(f"- 先秦两汉: {len(pre_qin_han)}")
    print(f"- 魏晋: {len(wei_jin)}")
    print(f"- 唐代: {len(tang)}")
    print(f"- 宋元: {len(song_yuan)}")
    print(f"- 明清现代: {len(ming_qing_modern)}")

    # Write individual modular files
    with open(os.path.join(target_dir, "preQinHan.ts"), "w", encoding="utf-8") as f:
        f.write(to_ts_export(pre_qin_han, "preQinHanTexts"))

    with open(os.path.join(target_dir, "weiJin.ts"), "w", encoding="utf-8") as f:
        f.write(to_ts_export(wei_jin, "weiJinTexts"))

    with open(os.path.join(target_dir, "tang.ts"), "w", encoding="utf-8") as f:
        f.write(to_ts_export(tang, "tangTexts"))

    with open(os.path.join(target_dir, "songYuan.ts"), "w", encoding="utf-8") as f:
        f.write(to_ts_export(song_yuan, "songYuanTexts"))

    with open(os.path.join(target_dir, "mingQingModern.ts"), "w", encoding="utf-8") as f:
        f.write(to_ts_export(ming_qing_modern, "mingQingModernTexts"))

    # Write aggregated index.ts
    index_content = """import type { TextCategory, TextEntry } from '@/types/text'
import { toTraditional } from '@/utils/hanziConvert'
import { preQinHanTexts } from './preQinHan'
import { weiJinTexts } from './weiJin'
import { tangTexts } from './tang'
import { songYuanTexts } from './songYuan'
import { mingQingModernTexts } from './mingQingModern'

export { preQinHanTexts, weiJinTexts, tangTexts, songYuanTexts, mingQingModernTexts }

export const texts: TextEntry[] = [
  ...preQinHanTexts,
  ...weiJinTexts,
  ...tangTexts,
  ...songYuanTexts,
  ...mingQingModernTexts,
]

export const textCategories = ['诗', '词', '赋', '散文', '其他'] as const

export const defaultTextId = 'xiang-ji-xuan'

/** 按 id 查文稿；找不到时回退到第一篇。默认返回繁体版。 */
export function getText(id: string, variant: 'traditional' | 'simplified' = 'traditional'): TextEntry {
  const base = texts.find((t) => t.id === id) ?? texts[0]
  if (variant === 'simplified') {
    return base
  }
  return {
    ...base,
    title: base.titleTrad || toTraditional(base.title),
    author: base.authorTrad || toTraditional(base.author),
    summary: base.summaryTrad || toTraditional(base.summary || ''),
    paragraphs: base.paragraphsTrad || base.paragraphs.map(toTraditional),
  }
}

export const getTextsByCategory = (category: TextCategory): TextEntry[] => {
  return texts.filter((t) => t.category === category)
}

export const getTextsByEraGroup = (
  eraGroup: '先秦两汉' | '魏晋' | '唐代' | '宋元' | '明清现代'
): TextEntry[] => {
  return texts.filter((t) => t.eraGroup === eraGroup)
}
"""
    with open(os.path.join(target_dir, "index.ts"), "w", encoding="utf-8") as f:
        f.write(index_content)

    print("src/data/texts/ modular files created successfully.")

if __name__ == "__main__":
    main()
