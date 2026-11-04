import { describe, expect, it } from 'vitest'
import { buildGlyphs } from '@/composables/useFallingGlyphs'

describe('Collision diagnostics and verification', () => {
  it('tests prototype staggering algorithm on odd/even counts', () => {
    for (const count of [8, 9, 10, 11, 12, 13, 14, 17]) {
      const u = Array<number>(count)
      for (let i = 0; i < count; i++) {
        if (count % 2 === 0) {
          u[i] = i % 2 === 0 ? 0.06 + 0.2 * 0.5 : 0.74 + 0.2 * 0.5
        } else {
          if (i === count - 1) {
            u[i] = 0.5
          } else {
            u[i] = i % 2 === 0 ? 0.06 + 0.2 * 0.5 : 0.74 + 0.2 * 0.5
          }
        }
      }

      for (let i = 0; i < count; i++) {
        const j = (i + 1) % count
        const diff = Math.abs(u[i] - u[j])
        expect(diff).toBeGreaterThanOrEqual(0.3)
      }
    }
  })

  it('verifies that no rear-end collisions occur across 100 seeds in desktop viewports', () => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
    ]

    let severeCollisions = 0
    let moderateCollisions = 0

    for (const vp of viewports) {
      for (let seed = 1; seed <= 100; seed++) {
        const glyphs = buildGlyphs({
          width: vp.width,
          height: vp.height,
          viewport: 'desktop',
          seed: seed * 10007,
        })

        // Sample across animation cycle
        const sampleSteps = 30
        const duration = glyphs[0].duration

        for (let s = 0; s < sampleSteps; s++) {
          const t = (s / sampleSteps) * duration
          const rects = glyphs.map((g) => {
            const rawProgress = (t / g.duration) - (g.delay / g.duration)
            const p = ((rawProgress % 1) + 1) % 1
            const y = -0.2 * vp.height + p * 1.2 * vp.height
            const leftVal = Number.parseFloat(g.left)
            const leftPx = (leftVal / 100) * vp.width
            const x = leftPx + p * g.drift
            const size = g.size
            return {
              id: g.id,
              char: g.char,
              laneId: g.laneId,
              x,
              y,
              w: size,
              h: size,
              visible: y + size > 0 && y < vp.height,
            }
          }).filter((r) => r.visible)

          // Check pairwise overlaps
          for (let i = 0; i < rects.length; i++) {
            for (let j = i + 1; j < rects.length; j++) {
              const a = rects[i]
              const b = rects[j]
              // Check overlap
              const ovX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
              const ovY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
              if (ovX > 0 && ovY > 0) {
                if (ovX > 10 && ovY > 10) {
                  severeCollisions++
                } else {
                  moderateCollisions++
                }
              }
            }
          }
        }
      }
    }

    expect(severeCollisions).toBe(0)
    expect(moderateCollisions).toBe(0)
  })
})
