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

    // 验证标题与作者渲染（默认展示权威底本繁体正字）
    await expect(leftSlot.locator('.sheet__title')).toHaveText('項脊軒志')
    await expect(leftSlot.locator('.sheet__meta')).toContainText('歸有光')

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

    // 验证竖排模式下古代句读依附于字身右侧（列右 East Gutter），绝不在列左侧
    const firstJudouSvg = page.locator('.book-spread > .sheet .sheet__column--body .judou-mark .punct-svg').first()
    if (await firstJudouSvg.isVisible()) {
      const columnEl = page.locator('.book-spread > .sheet .sheet__column--body').first()
      const columnBox = await columnEl.boundingBox()
      const markBox = await firstJudouSvg.boundingBox()
      if (columnBox && markBox) {
        const columnCenter = columnBox.x + columnBox.width / 2
        const markCenter = markBox.x + markBox.width / 2
        expect(markCenter).toBeGreaterThan(columnCenter)
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

  test('全量字体按需切换、自由题写与权威缺字检测验证', async ({ page }) => {
    await page.goto('/studio')

    // 1. 切换字体：打开字体图鉴并切换为「霞鹜文楷」
    await page.locator('.tools__btn', { hasText: '字体' }).click()
    const fontDialog = page.locator('[role="dialog"]')
    await expect(fontDialog.locator('.panel__title')).toContainText('字体')
    await page.locator('.font-card', { hasText: '霞鹜文楷' }).click()

    // 验证书页应用霞鹜文楷的字体族名
    const title = page.locator('.book-spread .sheet__title').first()
    await expect(title).toHaveCSS('font-family', /LXGW WenKai/)

    // 2. 自由题写：输入任意自定义生僻字并应用，无需重新生成子集
    await page.locator('.tools__btn', { hasText: '题写' }).click()
    const writingDialog = page.locator('[role="dialog"]')
    await expect(writingDialog.locator('.panel__title')).toContainText('题写')
    const textarea = page.locator('#draft-text')
    await textarea.fill('青青子衿，悠悠我心。但为君故，沉吟至今。')
    await page.locator('.action--primary', { hasText: '应用到书页' }).click()

    // 验证自定义题写内容实时渲染于书页
    await expect(page.locator('.book-spread .prose')).toContainText('青青子衿')

    // 3. 权威缺字提示：切换回默认「汇文明朝体」并输入未收录字符「楯」
    await page.locator('.tools__btn', { hasText: '字体' }).click()
    await page.locator('.font-card', { hasText: '汇文明朝体' }).click()

    await page.locator('.tools__btn', { hasText: '题写' }).click()
    await textarea.fill('旧时栏楯')
    // 验证权威 cmap 提示
    const glyphNotice = page.locator('.glyph-notice--soft')
    await expect(glyphNotice).toBeVisible()
    await expect(glyphNotice).toContainText('不在 汇文明朝体 的收录范围内')
    await expect(glyphNotice).toContainText('超出原字体字符库')
  })

  test('古籍风雅：10 款宣纸底色即时切换、五大时代标点演化、学术考据弹窗与策略 A 强联动', async ({ page }) => {
    await page.goto('/studio')

    // 1. 验证策略 A 强联动：在横排下打开版式面板，选择明清刻本，系统自动触发切至竖排并应用双边栏与朱圈
    await page.locator('.tools__btn', { hasText: '版式' }).click()
    const typographyDialog = page.locator('[role="dialog"]')
    await expect(typographyDialog.locator('.panel__title')).toContainText('版式')

    // 点击「明清刻本」主按钮（带有「竖排专享」提示）
    const mingQingBtn = typographyDialog.locator('.punctuation-era__main-btn', { hasText: '明清刻本' })
    await mingQingBtn.click()

    // 关闭版式面板
    await page.keyboard.press('Escape')
    await expect(typographyDialog).not.toBeVisible()

    // 验证竖排应用：明清刻本文武双边框、版心鱼尾与朱墨套印朱圈
    const firstSheet = page.locator('.book-spread > .sheet--first')
    await expect(firstSheet.locator('.woodblock-frame--double')).toBeVisible()
    await expect(firstSheet.locator('.banxin')).toBeVisible()
    await expect(firstSheet.locator('.banxin .banxin__fishtail').first()).toBeVisible()
    await expect(firstSheet.locator('.banxin .banxin__title')).toContainText('項脊軒志')
    await expect(firstSheet.locator('.banxin .banxin__leaf')).toContainText('叶')

    // 验证明清朱圈标记 .judou-mark--ming-qing 与朱砂红色调 (#b83625 -> rgb(184, 54, 37))
    const judouSvg = firstSheet.locator('.judou-mark--ming-qing .punct-svg--mingqing-circle').first()
    await expect(judouSvg).toBeVisible()
    await expect(firstSheet.locator('.judou-mark--ming-qing').first()).toHaveCSS('color', 'rgb(184, 54, 37)')

    // 2. 打开版式面板切换宣纸底色
    await page.locator('.tools__btn', { hasText: '版式' }).click()
    await expect(typographyDialog.locator('.panel__title')).toContainText('版式')

    // 切换为「麦黄皮纸 (CORNSILK)」
    const cornsilkItem = typographyDialog.locator('.paper-palette__item', { hasText: '麦黄皮纸' })
    await cornsilkItem.click()
    await expect(cornsilkItem).toHaveClass(/is-active/)
    await expect(firstSheet).toHaveCSS('--reading-bg', '#FFF8DC')

    // 3. 验证学术考据弹窗：点击先秦两汉后面的 ℹ 图标
    const preQinInfoBtn = typographyDialog.locator('.punctuation-era__info-btn').first()
    await preQinInfoBtn.click()

    // 验证考据浮层内容（考古文物依据、排版格律与管锡华/启功专著）
    const infoModal = page.locator('.info-modal')
    await expect(infoModal).toBeVisible()
    await expect(infoModal.locator('.info-modal__title')).toContainText('先秦两汉')
    await expect(infoModal).toContainText('出土文物与善本遗存')
    await expect(infoModal).toContainText('睡虎地秦简')
    await expect(infoModal).toContainText('管锡华')

    // 关闭考据浮层
    await page.keyboard.press('Escape')
    await expect(infoModal).not.toBeVisible()

    // 4. 在版式面板中手动切换时代标点至「宋元雕版」
    const songYuanBtn = typographyDialog.locator('.punctuation-era__main-btn', { hasText: '宋元雕版' })
    await songYuanBtn.click()

    // 验证宋元雕版伴随装帧：四周单边墨栏与纯黑细铁线圈，且绝不参杂现代书名号与引号
    await expect(firstSheet.locator('.woodblock-frame--single')).toBeVisible()
    await expect(firstSheet.locator('.judou-mark--song-yuan .punct-svg').first()).toBeVisible()
    await expect(firstSheet.locator('.sheet__inner--vertical')).not.toContainText('《')
    await expect(firstSheet.locator('.sheet__inner--vertical')).not.toContainText('“')

    // 5. 关闭版式面板，切换文章验证朝代自动联动
    await page.keyboard.press('Escape')
    await expect(typographyDialog).not.toBeVisible()

    // 打开文选面板，选择先秦《论语·学而》
    await page.locator('.tools__btn', { hasText: '文选' }).click()
    const textDialog = page.locator('[role="dialog"]')
    await expect(textDialog.locator('.panel__title')).toContainText('文选')
    await page.locator('.text-item', { hasText: /論語·學而|论语·学而/ }).click()

    // 验证先秦文章自动联动：标点切换为先秦简帛钩识，版框默认素雅无框
    await expect(page.locator('.book-spread [data-page="1"]')).toContainText(/論語·學而|论语·学而/)
    await expect(page.locator('.book-spread [data-page="1"] .punct-svg--hook').first()).toBeVisible()
    await expect(page.locator('.book-spread [data-page="1"] .woodblock-frame')).not.toBeVisible()

    // 6. 验证「恢复默认排版」：手动在版式面板中修改参数（切换为明清刻本文武双边）后一键还原为当前先秦文章朝代默认值
    await page.locator('.tools__btn', { hasText: '版式' }).click()
    const mingQingEraBtn = typographyDialog.locator('.era-format__main-btn', { hasText: '明清刻本' })
    await mingQingEraBtn.click()
    await expect(page.locator('.book-spread [data-page="1"] .woodblock-frame--double')).toBeVisible()

    // 点击「恢复默认排版」按钮
    await typographyDialog.locator('.reset', { hasText: '恢复默认排版' }).click()

    // 验证恢复为先秦文章对应的朝代默认值（先秦标点、无版框）
    await expect(page.locator('.book-spread [data-page="1"] .punct-svg--hook').first()).toBeVisible()
    await expect(page.locator('.book-spread [data-page="1"] .woodblock-frame')).not.toBeVisible()

    // 7. 策略 A 闭环验证：手动切回横排，自动回退为现代标点且无古籍版框
    const horizontalBtn = typographyDialog.locator('.direction__button', { hasText: '横排' })
    await horizontalBtn.click()
    await page.keyboard.press('Escape')
    await expect(page.locator('.book-spread > .sheet--first')).not.toHaveClass(/sheet--vertical/)
    await expect(page.locator('.book-spread .prose').first()).toBeVisible()
    await expect(page.locator('.book-spread .judou-mark')).toHaveCount(0)
    await expect(page.locator('.book-spread .woodblock-frame')).toHaveCount(0)
  })

  test('配置选项中繁简体切换与即时渲染（默认繁体正字，顶栏不外露繁简按钮保持极简）', async ({ page }) => {
    await page.goto('/studio')
    const leftSlot = page.locator('.book-spread > .sheet--first')

    // 1. 顶栏保持极简纯粹：仅展示 [ 书本 | 卷轴 ]，最外层不放置繁简切换
    await expect(page.locator('.reading-variants')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '书本', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '卷轴', exact: true })).toBeVisible()

    // 2. 默认展示权威底本之正体繁体字
    await expect(leftSlot.locator('.sheet__title')).toHaveText('項脊軒志')
    await expect(leftSlot.locator('.sheet__meta')).toContainText('歸有光')

    // 3. 打开版式配置面板，字式规范默认为「繁体正字」
    await page.locator('.tools__btn', { hasText: '版式' }).click()
    const typographyDialog = page.locator('[role="dialog"]')
    await expect(typographyDialog.locator('.panel__title')).toContainText('版式')

    const tradOption = typographyDialog.locator('.direction__button', { hasText: '繁体正字' })
    const simpOption = typographyDialog.locator('.direction__button', { hasText: '通行简体' })
    await expect(tradOption).toHaveAttribute('aria-pressed', 'true')
    await expect(simpOption).toHaveAttribute('aria-pressed', 'false')

    // 4. 在配置选项中点击「通行简体」，书页即时响应切换为简体正字
    await simpOption.click()
    await expect(simpOption).toHaveAttribute('aria-pressed', 'true')
    await expect(tradOption).toHaveAttribute('aria-pressed', 'false')
    await expect(leftSlot.locator('.sheet__title')).toHaveText('项脊轩志')
    await expect(leftSlot.locator('.sheet__meta')).toContainText('归有光')

    // 5. 在配置选项中点击「繁体正字」，即刻无缝切回正体繁体
    await tradOption.click()
    await expect(tradOption).toHaveAttribute('aria-pressed', 'true')
    await expect(leftSlot.locator('.sheet__title')).toHaveText('項脊軒志')
    await expect(leftSlot.locator('.sheet__meta')).toContainText('歸有光')

    // 关闭版式面板
    await page.keyboard.press('Escape')
    await expect(typographyDialog).not.toBeVisible()
  })

  test('时代装帧与书体规制双维重构：宋元白口、草书无栏避切笔、版本学考据弹窗与智能强联动', async ({ page }) => {
    await page.goto('/studio')

    // 1. 打开版式面板，验证两大全新正交分类「时代装帧 · 版面制式」与「书体规制 · 行气法则」
    await page.locator('.tools__btn', { hasText: '版式' }).click()
    const typographyDialog = page.locator('[role="dialog"]')
    await expect(typographyDialog.locator('.era-format__legend')).toContainText('时代装帧')
    await expect(typographyDialog.locator('.script-style__legend')).toContainText('书体规制')

    // 2. 验证时代装帧五大体系与书体规制三大体系均已渲染，且书体规制文字精炼无型号括号，图标以书法单字呈现
    await expect(typographyDialog.locator('.era-format__item')).toHaveCount(5)
    await expect(typographyDialog.locator('.script-style__item')).toHaveCount(3)
    await expect(typographyDialog.locator('.script-style__item').first()).toContainText('宋体 · 楷书 · 仿宋')
    await expect(typographyDialog.locator('.script-style__item').first()).not.toContainText('（')

    // 验证三大书体规制微标以「楷」、「行」、「草」书法单字矢量呈现
    await expect(typographyDialog.locator('.script-style__symbol svg path')).toHaveCount(3)

    // 验证侧边栏去冗余：无小字提示、无冗余版框开关
    await expect(typographyDialog.locator('.control__hint')).toHaveCount(0)
    await expect(typographyDialog.locator('.era-format__hint')).toHaveCount(0)
    await expect(typographyDialog.locator('.classic-features')).toHaveCount(0)

    // 3. 点击时代装帧「宋元雕版」：策略 A 自动切入竖排直行并应用单边墨框，同时竖排模式收敛仅保留「字号」滑块
    const songYuanEraBtn = typographyDialog.locator('.era-format__main-btn', { hasText: '宋元雕版' })
    await songYuanEraBtn.click()
    await expect(typographyDialog.locator('.control')).toHaveCount(1)
    await expect(typographyDialog.locator('.control__label')).toHaveText('字号')

    // 4. 点击时代装帧 ℹ 按钮打开学术考据弹窗
    const songYuanInfoBtn = typographyDialog.locator('.era-format__info-btn').nth(2)
    await songYuanInfoBtn.click()

    const formatModal = page.locator('.format-modal')
    await expect(formatModal).toBeVisible()
    await expect(formatModal.locator('.format-modal__title')).toContainText('宋元雕版')
    await expect(formatModal.locator('.format-modal__title')).toContainText('疏朗白口')
    await expect(formatModal).toContainText('出土文物与传世善本')
    await expect(formatModal).toContainText('严州')
    await expect(formatModal).toContainText('叶德辉')

    // 关闭考据弹窗
    await page.keyboard.press('Escape')
    await expect(formatModal).not.toBeVisible()

    // 5. 点击书体规制「草书规制 · 连绵无栏」后的 ℹ 考据按钮
    const cursiveInfoBtn = typographyDialog.locator('.script-style__info-btn').nth(2)
    await cursiveInfoBtn.click()
    await expect(formatModal).toBeVisible()
    await expect(formatModal.locator('.format-modal__title')).toContainText('草书规制')
    await expect(formatModal.locator('.format-modal__title')).toContainText('连绵无栏')
    await expect(formatModal).toContainText('草韵辨体')
    await expect(formatModal).toContainText('切断')
    await expect(formatModal).toContainText('范度')

    // 关闭考据弹窗
    await page.keyboard.press('Escape')
    await expect(formatModal).not.toBeVisible()

    // 6. 切换书体规制为「草书规制」并关闭版式面板
    const cursiveScriptBtn = typographyDialog.locator('.script-style__main-btn', { hasText: '草书规制' })
    await cursiveScriptBtn.click()
    await page.keyboard.press('Escape')

    // 7. 核心验证：草书模式下，书页保持古籍四周单边框 (woodblock-frame--single)，但列内绝去乌丝栏 (sheet__column--lined-none)，无纵向切笔墨线
    const firstSheet = page.locator('.book-spread > .sheet--first')
    await expect(firstSheet).toHaveClass(/sheet--cursive/)
    await expect(firstSheet.locator('.woodblock-frame--single')).toBeVisible()
    await expect(firstSheet.locator('.sheet__column--lined-none').first()).toBeVisible()
    await expect(firstSheet.locator('.sheet__column--lined-solid')).toHaveCount(0)

    // 8. 验证切换字体为《韵草体》时，自动联动草书规制
    await page.locator('.tools__btn', { hasText: '字体' }).click()
    const fontDialog = page.locator('[role="dialog"]')
    await expect(fontDialog).toBeVisible()
    await page.locator('.font-card', { hasText: '韵草体' }).click()

    // 验证书页已应用草书字体且保持无界行防切笔
    await expect(firstSheet).toHaveClass(/sheet--cursive/)
    await expect(firstSheet.locator('.sheet__column--lined-none').first()).toBeVisible()
  })
})
