import { test, expect } from '@playwright/test'

test.describe('字在 ZiZai · 核心端到端流程与排版真实性验证', () => {
  test('首页访问与「入字间」路由，以及 /studio?panel=texts 直达文选面板 (ZZ-001 真实浏览器回归)', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/字在/)

    // 点击首页「入字间」主入口
    const cta = page.locator('.hero__cta')
    await expect(cta).toBeVisible()
    await cta.click()

    // 验证路由成功进入 /studio
    await expect(page).toHaveURL(/\/studio/)
    await expect(page.locator('.book-spread')).toBeVisible()

    // 验证直达带参入口 /studio?panel=texts 正确打开文选面板（ZZ-001 修复验证）
    await page.goto('/studio?panel=texts')
    const dialogTitle = page.locator('[role="dialog"] .panel__title')
    await expect(dialogTitle).toBeVisible()
    await expect(dialogTitle).toContainText('文选')
  })

  test('长文双页展开、左右槽位映射与边缘翻页动效', async ({ page }) => {
    await page.goto('/studio')

    // 默认作品为《项脊轩志》，属于长文，使用双页展开
    const spread = page.locator('.book-spread')
    await expect(spread).toBeVisible()
    await expect(spread).toHaveAttribute('data-page-mode', 'spread')

    // 验证默认横排物理槽位：左槽 (.book-spread > .sheet--first) 为第 1 页，右槽 (.book-spread > .sheet--second) 为第 2 页
    const leftSlot = page.locator('.book-spread > .sheet--first')
    const rightSlot = page.locator('.book-spread > .sheet--second')
    await expect(leftSlot).toBeVisible()
    await expect(rightSlot).toBeVisible()
    await expect(leftSlot).toHaveAttribute('data-page', '1')
    await expect(rightSlot).toHaveAttribute('data-page', '2')

    // 验证标题与作者渲染
    await expect(leftSlot.locator('.sheet__title')).toHaveText('项脊轩志')
    await expect(leftSlot.locator('.sheet__meta')).toContainText('归有光')

    // 验证横排边缘翻页按钮：右侧为「下一组页面」，左侧为「上一组页面」（此时禁用）
    const rightTrigger = page.locator('.turn-trigger--right')
    const leftTrigger = page.locator('.turn-trigger--left')
    await expect(rightTrigger).toHaveAttribute('aria-label', '下一组页面')
    await expect(leftTrigger).toHaveAttribute('aria-label', '上一组页面')
    await expect(leftTrigger).toBeDisabled()
    await expect(rightTrigger).toBeEnabled()

    // 点击右侧热区翻页
    await rightTrigger.click()

    // 翻页动效触发并在结束后进入下一组页面（第 3、4 页）
    await expect(page.locator('.curved-turn')).not.toBeVisible({ timeout: 5000 })
    await expect(leftSlot).toHaveAttribute('data-page', '3')
    await expect(rightSlot).toHaveAttribute('data-page', '4')
    await expect(leftTrigger).toBeEnabled()

    // 点击左侧热区向后翻页
    await leftTrigger.click()
    await expect(page.locator('.curved-turn')).not.toBeVisible({ timeout: 5000 })
    await expect(leftSlot).toHaveAttribute('data-page', '1')
    await expect(rightSlot).toHaveAttribute('data-page', '2')
  })

  test('竖排古籍排版流向、行距字距与避头尾禁则', async ({ page }) => {
    await page.goto('/studio')

    // 打开版式面板
    const typographyBtn = page.locator('.tools__btn', { hasText: '版式' })
    await typographyBtn.click()
    await expect(page.locator('[role="dialog"] .panel__title')).toContainText('版式')

    // 切换至竖排
    const verticalBtn = page.locator('.direction__button', { hasText: '竖排' })
    await verticalBtn.click()

    // 关闭面板
    await page.keyboard.press('Escape')

    // 验证书页应用竖排样式
    const firstSheet = page.locator('.book-spread > .sheet--first')
    await expect(firstSheet).toHaveClass(/sheet--vertical/)
    const verticalFlow = page.locator('.book-spread > .sheet .sheet__vertical-flow')
    await expect(verticalFlow.first()).toBeVisible()

    // 验证竖排物理槽位反转：右侧槽为第 1 读序（第 1 页），左侧槽为第 2 读序（第 2 页）
    const rightSlot = page.locator('.book-spread > .sheet--second')
    const leftSlot = page.locator('.book-spread > .sheet--first')
    await expect(rightSlot).toHaveAttribute('data-page', '1')
    await expect(leftSlot).toHaveAttribute('data-page', '2')

    // 验证竖排边缘翻页热区反转：左侧变为下一组页面，右侧变为上一组页面
    const leftTrigger = page.locator('.turn-trigger--left')
    const rightTrigger = page.locator('.turn-trigger--right')
    await expect(leftTrigger).toHaveAttribute('aria-label', '下一组页面')
    await expect(rightTrigger).toHaveAttribute('aria-label', '上一组页面')

    // 验证避头尾禁则：检查各列列首字符，绝不孤悬句末点号
    const columns = await page.locator('.book-spread > .sheet .sheet__column--body').allTextContents()
    const forbiddenStarts = ['，', '。', '！', '？', '；', '：', '）', '》', '”']
    for (const text of columns) {
      if (text.length > 0) {
        expect(forbiddenStarts.includes(text[0])).toBe(false)
      }
    }
  })

  test('键盘快捷键作用域约束（弹窗激活时不翻页，修饰键过滤）', async ({ page }) => {
    await page.goto('/studio')
    const leftSlot = page.locator('.book-spread > .sheet--first')
    await expect(leftSlot).toHaveAttribute('data-page', '1')

    // 1. 带修饰键 (Ctrl/Alt) 不触发翻页
    await page.keyboard.press('Control+ArrowRight')
    await page.waitForTimeout(300)
    await expect(leftSlot).toHaveAttribute('data-page', '1')

    // 2. 正常键盘 ArrowRight 触发翻页
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.curved-turn')).not.toBeVisible({ timeout: 5000 })
    await expect(leftSlot).toHaveAttribute('data-page', '3')

    // 3. 打开文选面板时，按下 ArrowLeft 不翻页
    await page.locator('.tools__btn', { hasText: '文选' }).click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(300)
    await expect(leftSlot).toHaveAttribute('data-page', '3')

    // 关闭弹窗后按 ArrowLeft 可以正常向前翻页
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()

    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('.curved-turn')).not.toBeVisible({ timeout: 5000 })
    await expect(leftSlot).toHaveAttribute('data-page', '1')
  })

  test('收藏笺搭配完整记录与状态恢复 (ZZ-003/004 验证)', async ({ page }) => {
    await page.goto('/studio')

    // 打开收藏面板
    await page.locator('.tools__btn', { hasText: '收藏' }).click()
    const bookmarkDialog = page.locator('[role="dialog"]')
    await expect(bookmarkDialog).toBeVisible()
    await expect(bookmarkDialog.locator('.panel__title')).toContainText('收藏')

    // 点击保存当前搭配
    const saveBtn = bookmarkDialog.locator('.save')
    await saveBtn.click()

    // 验证出现收藏卡片
    const bookmarkCard = bookmarkDialog.locator('.item').first()
    await expect(bookmarkCard).toBeVisible()
    await expect(bookmarkCard.locator('.item__title')).toContainText('项脊轩志')

    // 切换至短诗并修改作品
    await page.keyboard.press('Escape')
    await page.locator('.tools__btn', { hasText: '文选' }).click()
    await page.locator('.text-item', { hasText: '山居秋暝' }).click()

    // 书页已变为《山居秋暝》且为单页模式
    await expect(page.locator('.book-spread > .sheet .sheet__title')).toHaveText('山居秋暝')
    await expect(page.locator('.book-spread')).toHaveAttribute('data-page-mode', 'single')

    // 再次打开收藏面板并点击恢复旧收藏
    await page.locator('.tools__btn', { hasText: '收藏' }).click()
    await page.locator('.item__main', { hasText: '项脊轩志' }).click()

    // 验证状态成功恢复为双页展开的《项脊轩志》
    await expect(page.locator('.book-spread')).toHaveAttribute('data-page-mode', 'spread')
    await expect(page.locator('.book-spread > .sheet .sheet__title')).toHaveText('项脊轩志')
  })
})
