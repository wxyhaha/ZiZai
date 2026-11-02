/** 书页上下预留的动画空间；投影最大抬升保留 8px 阴影余量。 */
export const TURN_CLEARANCE = 40

export function projectTurn(width: number, height: number, progress: number, fromRight: boolean, count: number) {
  const direction = fromRight ? 1 : -1
  const segment = width / count
  const lift = Math.sin(Math.PI * progress)
  const distance = width * (1 + height / (2 * (TURN_CLEARANCE - 8)))
  let x = direction * 2 * (1 - 2 * progress)
  let z = 0
  return Array.from({ length: count }, (_, index) => {
    const angle = Math.PI * progress + 1.2 * lift * ((index + 0.5) / count - 0.5)
    const nextX = x + direction * segment * Math.cos(angle)
    const nextZ = z + segment * Math.sin(angle)
    const projectedStart = x / (1 - z / distance)
    const projectedEnd = nextX / (1 - nextZ / distance)
    const reverse = projectedEnd < projectedStart
    const startX = reverse ? nextX : x
    const startZ = reverse ? nextZ : z
    const dx = (reverse ? x - nextX : nextX - x) / segment
    const dz = (reverse ? z - nextZ : nextZ - z) / segment
    // 平面投影矩阵：上下两边随深度自然形成弧线，纹理不会重新排版。
    const matrix = [dx, -height * dz / (2 * distance), 0, -dz / distance,
      0, 1, 0, 0, 0, 0, 1, 0,
      startX, -height * startZ / (2 * distance), 0, 1 - startZ / distance]
    const result = {
      matrix,
      front: (projectedEnd - projectedStart) * direction >= 0,
      depth: Math.max(z, nextZ),
      shade: 0.1 * lift * Math.abs(Math.sin(angle)),
    }
    x = nextX
    z = nextZ
    return result
  })
}
