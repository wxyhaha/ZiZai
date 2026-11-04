import { expect, test } from '@playwright/test'

test.describe('字在 ZiZai · 首页汉字探索功能验证', () => {
  test('落字悬停暂停、点击唤起双栏探索弹窗、笔顺重播与 Esc 键关闭', async ({ page }) => {
    await page.goto('/')

    // 1. 等待首页标题与落字渲染
    const heroTitle = page.locator('.hero__title')
    await expect(heroTitle).toBeVisible()

    const glyphs = page.locator('.glyph-field__item')
    await expect(glyphs.first()).toBeVisible()
    const glyphCount = await glyphs.count()
    expect(glyphCount).toBeGreaterThan(0)

    // 2. 选取当前已落入视口范围内的落字元素，测试悬停暂停与颜色加深交互
    await expect.poll(async () => {
      return page.evaluate(() => {
        const items = document.querySelectorAll('.glyph-field__item')
        for (let i = 0; i < items.length; i++) {
          const r = items[i].getBoundingClientRect()
          if (r.top > 100 && r.bottom < window.innerHeight - 100 && r.left > 50 && r.right < window.innerWidth - 50) {
            return i
          }
        }
        return -1
      })
    }, { timeout: 8000 }).toBeGreaterThanOrEqual(0)

    const visibleIndex = await page.evaluate(() => {
      const items = document.querySelectorAll('.glyph-field__item')
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect()
        if (r.top > 100 && r.bottom < window.innerHeight - 100 && r.left > 50 && r.right < window.innerWidth - 50) {
          return i
        }
      }
      return 0
    })
    const targetGlyph = glyphs.nth(visibleIndex)
    const charText = (await targetGlyph.textContent())?.trim() || ''
    expect(charText).toBeTruthy()

    await targetGlyph.dispatchEvent('mouseenter')
    await targetGlyph.hover({ force: true })
    // 悬停时 animation-play-state 应为 paused，且整列同轨汉字协同获得 paused 状态
    await expect.poll(async () => {
      return targetGlyph.evaluate((el) => {
        return window.getComputedStyle(el).animationPlayState
      })
    }).toBe('paused')
    await expect.poll(async () => page.locator('.glyph-field__item--paused').count()).toBeGreaterThan(1)

    // 3. 点击落字唤起探索双栏弹窗
    await targetGlyph.click({ force: true })

    const dialog = page.locator('.hanzi-explore-panel')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.hanzi-explore-header__title')).toContainText('汉字探索')
    await expect(dialog.locator('.hanzi-explore-header__title')).toContainText(charText)

    // 弹窗开启期间，整列汉字持续维持 paused，锁定相对车距
    const pausedDuringDialog = await page.locator('.glyph-field__item--paused').count()
    expect(pausedDuringDialog).toBeGreaterThan(1)

    // 4. 验证左栏：原字体展示与字体名称
    const leftCard = dialog.locator('.hanzi-card--original')
    await expect(leftCard).toBeVisible()
    await expect(leftCard.locator('.hanzi-card__glyph')).toHaveText(charText)
    const fontName = await leftCard.locator('.hanzi-card__font-name').textContent()
    expect(fontName?.trim()).toBeTruthy()

    // 5. 验证右栏：田字格标准容器（带规范笔顺动画或优雅 118px 楷书降级）
    const rightCard = dialog.locator('.hanzi-card--strokes')
    await expect(rightCard).toBeVisible()
    await expect(rightCard.locator('.hanzi-tian-grid')).toBeVisible()

    // 稍作等待以便笔顺动画加载与渲染，并输出视觉证据
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/homepage-explore-dialog-v2.png' })

    const replayBtn = rightCard.locator('.hanzi-replay-btn')
    if (await replayBtn.isVisible()) {
      await replayBtn.click()
    } else {
      await expect(rightCard.locator('.hanzi-card__no-stroke-tag')).toBeVisible()
      await expect(rightCard.locator('.hanzi-card__fallback-glyph')).toBeVisible()
    }

    // 6. 验证下方属性、释义与精简优雅的 GitHub 数据来源链接
    const metaRow = dialog.locator('.hanzi-meta-row')
    await expect(metaRow).toBeVisible()
    const defBox = dialog.locator('.hanzi-definition-box')
    await expect(defBox).toBeVisible()

    const sources = dialog.locator('.hanzi-explore-sources')
    await expect(sources).toContainText('数据来源')
    const dictLink = sources.locator('a[href="https://github.com/sinobaba/hanzidict"]')
    await expect(dictLink).toBeVisible()
    await expect(dictLink).toContainText('HanziDict')
    const writerLink = sources.locator('a[href="https://github.com/chanind/hanzi-writer"]')
    await expect(writerLink).toBeVisible()
    await expect(writerLink).toContainText('Hanzi Writer')

    // 7. 测试 Esc 键盘事件关闭弹窗
    // 弹窗关闭后拦截焦点回还，整列立即自动恢复平滑飘落，绝不卡死
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await page.mouse.move(0, 0)
    await expect.poll(async () => page.locator('.glyph-field__item--paused').count()).toBe(0)

    // 8. 验证中央「入字间」CTA 仍然顺畅可达
    const cta = page.locator('a.hero__cta')
    await expect(cta).toBeVisible()
    await cta.click()
    await page.waitForURL('**/studio')
    expect(page.url()).toContain('/studio')
  })

  test('生僻字/缺笔顺字符（如「瓲」）弹窗降级排版稳健性与真机截图', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.hero__title')).toBeVisible()

    // 借助 DEV 模式暴露的 window.__openExplore 注入生僻字「瓲」
    await page.evaluate(() => {
      ;(window as unknown as { __openExplore?: (g: unknown) => void }).__openExplore?.({
        id: 9999,
        laneId: 1,
        char: '瓲',
        fontId: 'huawen-mingchao',
        fontFamily: 'ZiZai Falling Huiwen Mincho',
        side: 'left',
        left: '20%',
        size: 52,
        duration: 30,
        delay: -5,
        drift: 12,
        opacity: 0.5,
        rotation: 4,
      })
    })

    const dialog = page.locator('.hanzi-explore-panel')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.hanzi-explore-header__title')).toContainText('瓲')

    // 验证田字格及降级 118px 楷书居中
    const rightCard = dialog.locator('.hanzi-card--strokes')
    await expect(rightCard.locator('.hanzi-tian-grid')).toBeVisible()
    await expect(rightCard.locator('.hanzi-card__fallback-glyph')).toBeVisible()
    await expect(rightCard.locator('.hanzi-card__no-stroke-tag')).toContainText('暂无楷书笔顺数据')

    // 等待字典加载并捕获真机截图
    await page.waitForTimeout(600)
    await page.screenshot({ path: 'test-results/homepage-explore-dialog-fallback-dan.png' })

    // 验证拼音缺省破折号使用中性灰
    const pinyinVal = dialog.locator('.hanzi-meta-item:first-child .hanzi-meta-item__val')
    await expect(pinyinVal).toHaveClass(/hanzi-meta-item__val--empty/)
  })

  test('验证田字格无边缘留白，且落字原字体格子与楷书格子保持 1:1 正方形等大对齐', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.hero__title')).toBeVisible()

    // 注入用户反馈截图中的汉字「聂」（思源宋体）
    await page.evaluate(() => {
      ;(window as unknown as { __openExplore?: (g: unknown) => void }).__openExplore?.({
        id: 8888,
        laneId: 2,
        char: '聂',
        fontId: 'noto-serif-sc',
        fontFamily: 'ZiZai Falling Noto Serif SC',
        side: 'right',
        left: '70%',
        size: 52,
        duration: 30,
        delay: -5,
        drift: 12,
        opacity: 0.5,
        rotation: 0,
      })
    })

    const dialog = page.locator('.hanzi-explore-panel')
    await expect(dialog).toBeVisible()

    // 等待弹窗进场动画（scale 缩放过渡）完全稳定
    await page.waitForTimeout(350)

    const leftDisplay = dialog.locator('.hanzi-card--original .hanzi-card__display')
    const rightDisplay = dialog.locator('.hanzi-card--strokes .hanzi-card__display')
    const tianGrid = dialog.locator('.hanzi-tian-grid')

    await expect(leftDisplay).toBeVisible()
    await expect(rightDisplay).toBeVisible()
    await expect(tianGrid).toBeVisible()

    const leftBox = await leftDisplay.boundingBox()
    const rightBox = await rightDisplay.boundingBox()
    const gridBox = await tianGrid.boundingBox()

    expect(leftBox).not.toBeNull()
    expect(rightBox).not.toBeNull()
    expect(gridBox).not.toBeNull()

    // 1. 验证两侧格子宽高均为 1:1 正方形，误差不超过 1px
    expect(Math.abs(leftBox!.width - leftBox!.height)).toBeLessThanOrEqual(1)
    expect(Math.abs(rightBox!.width - rightBox!.height)).toBeLessThanOrEqual(1)

    // 2. 验证落字原字体格子与楷书格子完全等大
    expect(Math.abs(leftBox!.width - rightBox!.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(leftBox!.height - rightBox!.height)).toBeLessThanOrEqual(1)

    // 3. 验证田字格完全占满楷书格子的内容区（与外边框仅差 1px 边线厚度，左右总共 2px）
    expect(Math.abs(gridBox!.width - rightBox!.width)).toBeLessThanOrEqual(2.5)
    expect(Math.abs(gridBox!.height - rightBox!.height)).toBeLessThanOrEqual(2.5)

    // 等待笔顺绘制与字典释义载入后截图
    await page.waitForTimeout(1000)
    await page.screenshot({ path: 'test-results/homepage-explore-dialog-nie-square.png' })
  })
})
