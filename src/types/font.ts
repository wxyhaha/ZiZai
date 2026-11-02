/**
 * 字体数据模型。
 *
 * 设计原则：字体条目只描述「这是什么字体、从哪来、能不能用」，
 * 不包含任何页面状态。赏字页通过 fontId 组合字体 + 文稿 + 版式。
 */

/** 字体的授权核实状态。只有 verified 才允许打包字体文件。 */
export type FontLicenseStatus =
  /** 已核实来源与授权，允许在本项目中分发自托管文件 */
  | 'verified'
  /** 授权允许使用但不确认可否再分发，仅以系统字体或远程引用使用 */
  | 'use-only'
  /** 尚未核实，只能作为「示意」展示，不得分发字体文件 */
  | 'unverified'

/** 字形风格分类，用于图鉴筛选与标签展示 */
export type FontStyleTag =
  | '楷'
  | '宋'
  | '黑'
  | '仿宋'
  | '隶'
  | '行'
  | '书法'
  | '圆'
  | '等线'

export interface FontSourceFile {
  /** 相对站点根目录的字体文件地址 */
  src: string
  format: 'woff2' | 'woff' | 'otf' | 'ttf'
  /** 该文件覆盖的 unicode-range，多子集字体用于按需加载 */
  unicodeRange?: string
}

export interface FontEntry {
  /** 稳定标识，用于状态持久化，发布后不要改动 */
  id: string
  /** 中文展示名 */
  name: string
  /** 英文名 / 拉丁名 */
  latinName?: string
  /**
   * CSS font-family 值（含回退栈）。
   * 自托管字体使用 app 内定义的 family 名，未核实的字体使用系统回退栈。
   */
  family: string
  /** 是否是自托管、已核实授权的真实字体文件 */
  selfHosted: boolean
  licenseStatus: FontLicenseStatus
  /** 授权名称，例如「SIL Open Font License 1.1」 */
  licenseName?: string
  licenseUrl?: string
  /** 原始来源页（字体项目主页或官方仓库） */
  sourceUrl?: string
  author?: string
  /** 一到两句的字体介绍，用于图鉴与字体故事 */
  description: string
  /** 图鉴卡片上的一行短标签，例如「明朝风格 · 端正清雅」 */
  tags: string[]
  styleTag: FontStyleTag
  /** 是否适合长文正文阅读 */
  suitedForBody: boolean
  /** 是否适合大字号标题展示 */
  suitedForDisplay: boolean
  /** 字体文件列表。未核实的字体没有本地文件。 */
  files?: FontSourceFile[]
  /** 图鉴卡片右上角的示例字，通常两个字 */
  sample: string
  /** 核对该字体授权信息的日期（ISO 日期字符串） */
  licenseCheckedAt?: string
  /** 已知影响，例如缺字、仅覆盖简体等 */
  caveats?: string[]
}

export type LayoutMode = 'horizontal' | 'vertical'
