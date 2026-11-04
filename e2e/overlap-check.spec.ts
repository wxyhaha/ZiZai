import { expect, test } from '@playwright/test'

interface OverlapInfo {
  a: { text: string; x: number; y: number; w: number; h: number; font: string }
  b: { text: string; x: number; y: number; w: number; h: number; font: string }
  overlapX: number
  overlapY: number
}

test('检测首页落字在真实渲染中的实际空间重叠', async ({ page }) => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ]

  let totalOverlapsFound = 0

  for (const vp of viewports) {
    await page.setViewportSize(vp)
    await page.goto('/')
    await page.waitForSelector('.glyph-field__item')

    // Sample across 5 seconds
    for (let step = 0; step < 15; step++) {
      const overlaps = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.glyph-field__item'))
        const rects = items.map((el) => {
          const r = el.getBoundingClientRect()
          const cs = window.getComputedStyle(el)
          return {
            text: el.textContent?.trim() || '',
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            font: cs.fontFamily,
            opacity: Number.parseFloat(cs.opacity),
          }
        })

        const visible = rects.filter((r) => r.opacity > 0.1 && r.y + r.height > 0 && r.y < window.innerHeight)
        const colls: OverlapInfo[] = []

        for (let i = 0; i < visible.length; i++) {
          for (let j = i + 1; j < visible.length; j++) {
            const a = visible[i]
            const b = visible[j]
            const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
            const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)

            if (overlapX > 0 && overlapY > 0) {
              colls.push({
                a: { text: a.text, x: a.x, y: a.y, w: a.width, h: a.height, font: a.font },
                b: { text: b.text, x: b.x, y: b.y, w: b.width, h: b.height, font: b.font },
                overlapX,
                overlapY,
              })
            }
          }
        }
        return colls
      })

      if (overlaps.length > 0) {
        totalOverlapsFound += overlaps.length
      }

      await page.waitForTimeout(200)
    }
  }

  expect(totalOverlapsFound).toBe(0)
})
