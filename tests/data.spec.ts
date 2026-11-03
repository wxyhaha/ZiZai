import { describe, expect, it } from 'vitest'
import { fonts, getFont } from '@/data/fonts'
import { texts, getText, textCategories } from '@/data/texts'

describe('字体目录', () => {
  it('id 唯一', () => {
    const ids = fonts.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('每款字体都有必需的元信息', () => {
    for (const font of fonts) {
      expect(font.name, font.id).toBeTruthy()
      expect(font.family, font.id).toBeTruthy()
      expect(font.description.length, font.id).toBeGreaterThan(10)
      expect(font.tags.length, font.id).toBeGreaterThan(0)
      expect(font.sample.length, font.id).toBeGreaterThan(0)
    }
  })

  it('未核实授权的字体不得自托管文件', () => {
    for (const font of fonts) {
      if (font.licenseStatus !== 'verified') {
        expect(font.selfHosted, `${font.id} 未核实授权却标记为自托管`).toBe(false)
        expect(font.assets, `${font.id} 未核实授权却附带字体资源`).toBeUndefined()
        expect(font.caveats?.length, `${font.id} 未核实授权但没有说明`).toBeGreaterThan(0)
      }
    }
  })

  it('自托管字体必须记录授权与来源', () => {
    for (const font of fonts.filter((f) => f.selfHosted)) {
      expect(font.licenseStatus, font.id).toBe('verified')
      expect(font.licenseName, font.id).toBeTruthy()
      expect(font.licenseUrl, font.id).toMatch(/^https?:\/\//)
      expect(font.sourceUrl, font.id).toMatch(/^https?:\/\//)
      expect(font.licenseCheckedAt, font.id).toBeTruthy()
    }
  })

  it('自托管字体必须同时提供内容子集与完整字体', () => {
    for (const font of fonts.filter((f) => f.selfHosted)) {
      expect(font.assets, `${font.id} 缺少字体资源路径`).toBeTruthy()
      expect(font.assets?.subset, font.id).toBeTruthy()
      expect(font.assets?.full, font.id).toBeTruthy()
      expect(font.assets?.fullSizeLabel, font.id).toMatch(/\d/)
    }
  })

  it('所有分发的字体资源均为标准的 WOFF2 格式且包含有效资产', () => {
    const allWoff2 = Object.keys(import.meta.glob('../src/assets/fonts/**/*.woff2'))
    expect(allWoff2.length).toBeGreaterThanOrEqual(14)
    for (const path of allWoff2) {
      expect(path).toMatch(/\.woff2$/)
    }
    // 验证每款自托管字体的 subset 与 full 文件真实存在于资源池中
    for (const font of fonts.filter((f) => f.selfHosted)) {
      const subsetFile = font.assets?.subset
      const fullFile = font.assets?.full
      expect(subsetFile).toBeTruthy()
      expect(fullFile).toBeTruthy()
      const subsetName = subsetFile!.split('/').pop()!
      const fullName = fullFile!.split('/').pop()!
      expect(allWoff2.some((p) => p.endsWith(`/${subsetName}`)), `${subsetName} 不存在`).toBe(true)
      expect(allWoff2.some((p) => p.endsWith(`/${fullName}`)), `${fullName} 不存在`).toBe(true)
    }
  })

  it('设计稿的主字体（汇文明朝体）已核实授权并可分发', () => {
    const huiwen = getFont('huawen-mingchao')
    expect(huiwen.licenseStatus).toBe('verified')
    expect(huiwen.selfHosted).toBe(true)
    expect(huiwen.assets?.subset).toBeTruthy()
    expect(huiwen.licenseName).toContain('CC0')
  })

  it('每款字体的回退栈里都包含一个通用兜底族名', () => {
    for (const font of fonts) {
      expect(font.family, font.id).toMatch(/serif$/)
    }
  })

  it('未知 id 回退到第一款字体而不是抛错', () => {
    expect(getFont('not-a-real-font').id).toBe(fonts[0].id)
  })
})

describe('古文目录', () => {
  it('id 唯一', () => {
    const ids = texts.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('分类都在约定范围内', () => {
    for (const text of texts) {
      expect(textCategories, text.id).toContain(text.category)
    }
  })

  it('每篇都有标题、作者与正文', () => {
    for (const text of texts) {
      expect(text.title, text.id).toBeTruthy()
      expect(text.author, text.id).toBeTruthy()
      expect(text.category, text.id).toBeTruthy()
      expect(text.paragraphs.length, text.id).toBeGreaterThan(0)
      for (const p of text.paragraphs) {
        expect(p.length, `${text.id} 有空段落`).toBeGreaterThan(0)
      }
    }
  })

  it('每篇作品都有公开来源，内置正文均明确为全文', () => {
    for (const text of texts) {
      expect(text.sourceUrl, text.id).toMatch(/^https:\/\//)
      expect(text.sourceTitle, text.id).toBeTruthy()
      expect(text.isExcerpt, text.id).toBe(false)
    }
  })

  it('被补全的长文包含各自的结尾段落', () => {
    const byId = Object.fromEntries(texts.map((text) => [text.id, text.paragraphs.join('')]))
    expect(byId['xiang-ji-xuan']).toContain('今已亭亭如盖矣。')
    expect(byId['qian-chi-bi-fu']).toContain('不知东方之既白。')
    expect(byId['yue-yang-lou']).toContain('时六年九月十五日。')
    expect(byId['ding-feng-bo']).toContain('三月七日，沙湖道中遇雨。')
  })

  it('正文不为空且不含未替换的占位符', () => {
    for (const text of texts) {
      const body = text.paragraphs.join('')
      expect(body.length, text.id).toBeGreaterThan(20)
      expect(body, text.id).not.toContain('TODO')
      expect(body, text.id).not.toContain('待补')
    }
  })

  it('未知 id 回退到第一篇', () => {
    expect(getText('not-a-real-text').id).toBe(texts[0].id)
  })
})
