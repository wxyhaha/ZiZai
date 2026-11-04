import { test, expect, type Page } from '@playwright/test'
import { texts } from '../src/data/texts'
import { fonts } from '../src/data/fonts'
import { paperThemes } from '../src/data/paperThemes'
import { sanitizeTextForEra, getEraPunctuationStyle } from '../src/data/punctuationStyles'
import { toTraditional } from '../src/utils/hanziConvert'

async function ensureSettingsOpen(page: Page) {
  const drawer = page.locator('.panel')
  if (!(await drawer.isVisible())) {
    await page.getByRole('button', { name: '卷轴设置' }).click({ force: true })
    await expect(drawer).toBeVisible()
  }
}

test('长卷全文、滚轮、两端轴杆、复制与设置隔离', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('/studio')
  await page.getByRole('button', { name: '卷轴', exact: true }).click()
  const viewer = page.locator('.scroll-viewer')
  const viewport = page.locator('.scroll-viewport')
  await expect(viewer).toHaveAttribute('aria-busy', 'false')
  await expect(viewer).toHaveCSS('--scroll-size', '55px')
  await expect(page.locator('.rail')).toHaveCount(0)
  await expect(page.locator('.book-spread')).toHaveCount(0)
  // 验证旧胶囊工具栏已彻底移除，仅在右侧保留卷轴设置入口
  await expect(page.locator('.scroll-toolbar')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '卷轴设置' })).toBeVisible()

  expect(await viewport.evaluate(el => el.scrollLeft)).toBe(0)
  await expect(page.locator('.scroll-rod--head')).toBeInViewport()
  // 抽样验证覆盖五大时期的代表性典籍在卷轴下的排版与标点纯化
  const sampleTextIds = ['xue-er', 'chu-shi-biao', 'jiang-jin-jiu', 'qian-chi-bi-fu', 'xiang-ji-xuan']
  const sampleTexts = sampleTextIds.map((id) => texts.find((t) => t.id === id)!)
  for (const text of sampleTexts) {
    await ensureSettingsOpen(page)
    await page.getByRole('button', { name: '选择文章' }).click({ force: true })
    await page.locator('.text-item', { hasText: text.titleTrad || text.title }).click({ force: true })
    await expect(viewer).toHaveAttribute('aria-busy', 'false')
    const content = await page.locator('.scroll-paragraph').allTextContents()
    const rawParas = text.paragraphsTrad || text.paragraphs
    expect(content).toEqual(rawParas.map((p) => sanitizeTextForEra(p, getEraPunctuationStyle(text.era))))
  }
  await viewport.hover()
  const headBefore = await page.locator('.scroll-rod--head').boundingBox()
  const tailBefore = await page.locator('.scroll-rod--tail').boundingBox()
  await page.mouse.wheel(0, 600)
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBeLessThan(-100)
  expect(await page.locator('.scroll-rod--head').boundingBox()).toEqual(headBefore)
  expect(await page.locator('.scroll-rod--tail').boundingBox()).toEqual(tailBefore)
  await viewport.focus()
  await page.keyboard.press('End')
  await expect(page.locator('.scroll-rod--tail')).toBeInViewport()
  await expect(page.locator('.scroll-rod--head')).toBeInViewport()
  await expect(page.locator('.scroll-ending')).toBeInViewport()
  expect(await page.locator('.scroll-rod--head').boundingBox()).toEqual(headBefore)
  expect(await page.locator('.scroll-rod--tail').boundingBox()).toEqual(tailBefore)
  await page.keyboard.press('Home')
  await expect(page.locator('.scroll-rod--head')).toBeInViewport()

  await ensureSettingsOpen(page)
  for (const paper of paperThemes) {
    await page.locator(`.paper-palette__item[data-paper-id="${paper.id}"]`).click({ force: true })
    await expect(viewer).toHaveCSS('--scroll-paper', paper.color)
  }
  await page.locator('.paper-palette__item[data-paper-id="white"]').click({ force: true })
  await page.locator('.font-card[data-font-id="lxgw-wenkai"]').click({ force: true })
  await page.getByLabel('字号', { exact: true }).fill('42')
  await expect(viewer).toHaveAttribute('aria-busy', 'false')
  await expect(viewer).toHaveCSS('--scroll-size', '42px')
  await expect(viewer).toHaveCSS('--scroll-paper', '#FFFFFF')
  await page.screenshot({ path: 'test-results/scroll-drawer-settings.png' })

  // 验证按 Esc 可关闭抽屉
  await page.keyboard.press('Escape')
  await expect(page.locator('.panel')).toHaveCount(0)

  const selected = await page.locator('.scroll-paragraph').first().evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el)
    const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range)
    return selection.toString()
  })
  expect(selected.length).toBeGreaterThan(10)
  await page.getByRole('button', { name: '书本', exact: true }).click()
  await expect(page.locator('.rail')).toBeVisible()
  await expect(page.locator('.book-spread .sheet').first()).toHaveCSS('--reading-size', '30px')
  await expect(page.locator('.book-spread .sheet').first()).toHaveCSS('--reading-font', /LXGW WenKai/)
  await page.getByRole('button', { name: '卷轴', exact: true }).click()
  await expect(viewer).toHaveCSS('--scroll-size', '42px')
})

test('全部字体与 PC 视口无裁切，保存首尾视觉证据', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('/studio')
  await page.getByRole('button', { name: '卷轴', exact: true }).click()
  await ensureSettingsOpen(page)
  for (const font of fonts) {
    await page.locator(`.font-card[data-font-id="${font.id}"]`).click({ force: true })
    await expect(page.locator('.scroll-viewer')).toHaveAttribute('aria-busy', 'false')
    await expect(page.locator('.scroll-status')).toHaveCount(0)
    await expect(page.locator('.scroll-body')).toHaveCSS('writing-mode', 'vertical-rl')
  }
  await page.locator('.font-card[data-font-id="rhyme-grass"]').click({ force: true })
  await page.getByLabel('字号', { exact: true }).fill('55')
  await page.keyboard.press('Escape')
  await page.screenshot({ path: `test-results/scroll-cursive.png` })
  await ensureSettingsOpen(page)
  await page.locator('.font-card[data-font-id="lxgw-wenkai"]').click({ force: true })
  await page.keyboard.press('Escape')
  for (const [width, height] of [[1024, 568], [1280, 720], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width: width!, height: height! })
    await ensureSettingsOpen(page)
    await page.getByLabel('字号', { exact: true }).fill('55')
    await page.keyboard.press('Escape')
    await expect(page.locator('.scroll-viewer')).toHaveAttribute('aria-busy', 'false')
    const geometry = await page.locator('.scroll-viewport').evaluate(el => ({
      height: el.clientHeight, scrollHeight: el.scrollHeight,
      pageWidth: document.documentElement.scrollWidth, width: innerWidth,
      pageHeight: document.documentElement.scrollHeight, viewportHeight: innerHeight,
      paragraphsFit: [...el.querySelectorAll('.scroll-paragraph')].every(p => p.scrollHeight <= p.clientHeight + 1),
    }))
    expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.height + 1)
    expect(geometry.pageWidth).toBe(geometry.width)
    expect(geometry.pageHeight).toBe(geometry.viewportHeight)
    expect(geometry.paragraphsFit).toBe(true)
    await page.locator('.scroll-viewport').focus()
    await page.keyboard.press('Home')
    await expect(page.locator('.scroll-rod--head')).toBeInViewport()
    await expect(page.locator('.scroll-rod--tail')).toBeInViewport()
    await page.screenshot({ path: `test-results/scroll-${width}-head.png` })
    await page.keyboard.press('End')
    await expect(page.locator('.scroll-rod--tail')).toBeInViewport()
    await expect(page.locator('.scroll-rod--head')).toBeInViewport()
    await expect(page.locator('.scroll-ending')).toBeInViewport()
    await page.screenshot({ path: `test-results/scroll-${width}-tail.png` })
  }
})

test('未知年代长文原标点完整，横向手势与最大字号可到末字', async ({ page }) => {
  await page.goto('/studio')
  await page.locator('.tools__btn', { hasText: '题写' }).click()
  const source = '“山川异域”：风月同天。ABC123，𠮷。'.repeat(70) + '末字终验'
  await page.locator('#draft-text').fill(source)
  await page.getByRole('button', { name: '应用到书页', exact: true }).click()
  await page.getByRole('button', { name: '卷轴', exact: true }).click()
  await expect(page.locator('.scroll-viewer')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.handscroll')).toHaveAttribute('data-punctuation', 'modern')
  await expect(page.locator('.scroll-paragraph')).toHaveText(toTraditional(source))
  await ensureSettingsOpen(page)
  await page.getByLabel('字号', { exact: true }).fill('70')
  await page.keyboard.press('Escape')
  const viewport = page.locator('.scroll-viewport')
  await viewport.hover()
  await page.mouse.wheel(-600, 0)
  await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBeLessThan(-100)
  await viewport.focus()
  await page.keyboard.press('End')
  await expect(page.locator('.scroll-rod--tail')).toBeInViewport()
  const last = await page.locator('.scroll-paragraph').evaluate(el => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()!
    while (!node.textContent?.includes('末字終驗') && !node.textContent?.includes('末字终验')) node = walker.nextNode()!
    const range = document.createRange()
    range.setStart(node, node.textContent!.length - 4); range.setEnd(node, node.textContent!.length)
    const rect = range.getBoundingClientRect()
    return { x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom, height: innerHeight }
  })
  expect(last.x).toBeGreaterThan(0)
  expect(last.y).toBeGreaterThan(0)
  expect(last.bottom).toBeLessThan(last.height)
})
