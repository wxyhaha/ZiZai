# -*- coding: utf-8 -*-
"""
生成随站点分发的字体资源。

## 输出一份「子集」+ 一份「完整」

每款字体会产出两类文件：

1. **内容子集**（`*.woff2`，大小随字体与文章字符变化；本轮约 203–566 kB）
   字符集 = 站内全部已收录古文 + 字体说明 + 界面文案（本轮 1,047 个字符）。
   这是默认加载的文件，覆盖站内所有内容，首屏与阅读页都不缺字。

2. **完整字体**（`*-full.woff2`，1.5–8 MB）
   只含 GB2312 常用字 + 中文标点 + 拉丁（约 6900 字）。
   **不在页面里自动加载** —— 只有当用户题写的文字出现子集缺字时，
   才按需拉取一次，之后该字体下的任意常用汉字都能显示。

   为什么不上全量 CJK（2 万字以上）：单个文件会到 8–25 MB，
   而 GB2312 已经覆盖日常书写的 99% 以上。见 docs/decisions.md ADR-013。

## 为什么不用 unicode-range 分片

Google Fonts 把 Noto Serif SC 切成 101 个 unicode-range 分片，全部声明
约 190 kB CSS。实测首屏 CSS 从 13 kB 涨到 556 kB，不可接受。
详见 docs/decisions.md ADR-004。

## 可变字体必须处理字重

思源宋体是可变字体，**默认轴值是 200（ExtraLight）**。不做处理的话，
浏览器会以 200 渲染，标题细得立不住。

## 还会生成

- `src/styles/fonts/{brand,reading-fonts}.scss`：@font-face 声明
- `src/data/font-coverage.json`：每款字体的**覆盖范围**，供运行时缺字检测用
- `scripts/font-subset-report.json`：本次生成的体积与缺字报告

## 维护

新增古文、字体条目或界面文案后必须重跑本脚本，否则内容子集会缺字。
用法：`npm run fonts:build`（或 `python -I scripts/build-font-subsets.py <源目录>`）
只更新阅读内容子集时可加 `--content-only`，保留现有完整字体文件不重建。

源目录需包含（允许放在子目录里）：
    Huiwen.ttf
    LXGWWenKai-Regular.ttf
    ZhuqueFangsong-Regular.ttf
    NotoSerifSC[wght].ttf
"""

import glob
import json
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

# Windows 控制台默认 GBK，输出中文与符号会抛 UnicodeEncodeError
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 站点里所有会以自托管字体渲染的字符来源（阅读相关）。
#
# 用 glob 而不是手写清单：新增组件或文案时会自动纳入字符集，
# 不会因为「忘了把新文件加进来」而在页面上出现缺字。
SOURCE_GLOBS = [
    'src/views/*.vue',
    'src/components/**/*.vue',
    'src/data/*.ts',
    # 落字的字池、界面里的中文常量都在 composable 里
    'src/composables/*.ts',
]

# 首屏展示层：品牌子集的字符来源。
#
# 只收「首屏会渲染」的东西：App 外壳、首页、404、页头、关于弹层、落字字池。
# 刻意排除 src/components/studio/** —— 那些组件只在赏字路由下渲染，
# 用的是随路由加载的阅读字体，不该撑大首屏的品牌子集。
BRAND_GLOBS = [
    'src/App.vue',
    'src/views/HomeView.vue',
    'src/views/NotFoundView.vue',
    'src/components/SiteHeader.vue',
    'src/components/shell/*.vue',
    'src/components/home/*.vue',
    # 这一条不能少：首页落下来的那批汉字定义在 composable 里
    'src/composables/useFallingGlyphs.ts',
]

# 兜底字符：中文标点、常用拉丁、数字、箭头、印章符号
EXTRA = (
    '，。、；：？！「」『』（）《》〈〉—…·「」　〇“”‘’【】'
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    '.,;:!?()-–—()[]/\\·→×○'
)

# 品牌展示字体必须额外覆盖的字符：页脚分隔、印章、箭头、拉丁与数字
BRAND_EXTRA = '字在印择阅古观式入山·→四〇 ZiZai0123456789'

CHAR_RE = re.compile(r'[⺀-鿿豈-﫿＀-￯　-〿·]')

# 每款字体的源文件匹配、输出路径、字重切片
FONT_SPECS = [
    {
        'id': 'huawen-mingchao',
        'family': 'Huiwen Mincho',
        'pattern': 'Huiwen*.ttf',
        'folder': 'huawen-mingchao',
        'subset': 'huawen-mingchao.woff2',
        'full': 'huawen-mingchao-full.woff2',
    },
    {
        'id': 'lxgw-wenkai',
        'family': 'LXGW WenKai',
        'pattern': 'LXGWWenKai-Regular*.ttf',
        'folder': 'lxgw-wenkai',
        'subset': 'lxgw-wenkai.woff2',
        'full': 'lxgw-wenkai-full.woff2',
    },
    {
        'id': 'zhuque-fangsong',
        'family': 'Zhuque Fangsong',
        'pattern': 'ZhuqueFangsong-Regular*.ttf',
        'folder': 'zhuque-fangsong',
        'subset': 'zhuque-fangsong.woff2',
        'full': 'zhuque-fangsong-full.woff2',
    },
    {
        'id': 'noto-serif-sc',
        'family': 'Noto Serif SC',
        'pattern': 'NotoSerifSC*.ttf',
        'folder': 'noto-serif-sc',
        'subset': 'noto-serif-sc.woff2',
        'full': 'noto-serif-sc-full.woff2',
        'extra_weights': [500],
    },
]


def _chars_from(globs, seed, exclude=()):
    chars = set(seed)
    paths = set()
    for pattern in globs:
        paths.update(glob.glob(os.path.join(ROOT, pattern), recursive=True))
    for path in sorted(paths):
        rel = os.path.relpath(path, ROOT).replace('\\', '/')
        if any(rel.startswith(prefix) for prefix in exclude):
            continue
        text = open(path, encoding='utf-8').read()
        # 剥掉注释与样式/脚本块：注释里的中文不会渲染到页面上，
        # 留着只会让子集白白变大。
        text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
        text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
        text = re.sub(r'//[^\n]*', '', text)
        text = re.sub(r'<style.*?</style>', '', text, flags=re.S)
        text = re.sub(r'<script.*?</script>', '', text, flags=re.S)
        chars.update(CHAR_RE.findall(text))
    return {c for c in chars if not c.isspace()}


def collect_content_chars():
    return _chars_from(SOURCE_GLOBS, EXTRA)


def collect_brand_chars():
    return _chars_from(BRAND_GLOBS, EXTRA + BRAND_EXTRA)


def gb2312_chars():
    """GB2312 一二级汉字全集（6763 字）。

    这是「完整字体」的字符范围：够日常书写，又不会让单文件膨胀到 8 MB 以上。
    """
    out = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                out.add(bytes([hi, lo]).decode('gb2312'))
            except Exception:
                continue
    return out


def subset_to(src, out, codepoints, weight=None):
    """裁出子集。

    `weight` 为 None 时保留可变字重轴（用于源是可变字体的情况：
    一个文件同时覆盖 400 与 500，两种字重都是真实字形而非合成加粗）。
    指定 `weight` 时把可变字体钉成静态切片（阅读字体用：体积更小，
    且避免不同浏览器对「可变字体 + 声明单一字重」的渲染差异）。
    """
    opts = subset.Options()
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    opts.drop_tables += ['DSIG']
    opts.flavor = 'woff2'

    font = subset.load_font(src, opts)

    sub = subset.Subsetter(options=opts)
    sub.populate(unicodes=codepoints)
    sub.subset(font)

    # 裁剪之后再处理可变轴：反过来做的话，fontTools 在 subset 阶段会因
    # 重采样后的 gvar 缺少 .notdef 条目而抛 KeyError: '.notdef'。
    if 'fvar' in font:
        if weight is None:
            # 品牌字体：把轴收窄到 400–500，两种字重都按真实字形渲染
            font = instantiateVariableFont(
                font, {'wght': (400, 500)}, inplace=True, updateFontNames=False
            )
        else:
            font = instantiateVariableFont(
                font, {'wght': weight}, inplace=True, updateFontNames=False
            )

    os.makedirs(os.path.dirname(out), exist_ok=True)
    subset.save_font(font, out, opts)
    font.close()
    return os.path.getsize(out)


def coverage_ranges(cmap, wanted):
    """把「字体实际覆盖的字符」压成 unicode-range 字符串。

    运行时用它做缺字检测：如果用户输入的字不在这个范围内，
    说明内容子集里没有该字形，需要按需加载完整字体。
    """
    cps = sorted(cp for cp in cmap if chr(cp) in wanted)
    if not cps:
        return ''
    parts = []
    start = prev = cps[0]
    for cp in cps[1:]:
        if cp == prev + 1:
            prev = cp
            continue
        parts.append((start, prev))
        start = prev = cp
    parts.append((start, prev))
    return ','.join(
        'U+%X' % a if a == b else 'U+%X-%X' % (a, b) for a, b in parts
    )


def find(fonts_dir, pattern):
    for cand in glob.glob(os.path.join(fonts_dir, pattern)) or glob.glob(
        os.path.join(fonts_dir, '**', pattern), recursive=True
    ):
        return cand
    return None


def write_css(families, brand_source=''):
    """生成两份 @font-face 样式。

    `families` 形如 [(family_name, folder, subset_file, has_500), ...]
    只包含**实际生成成功**的字体，缺少源文件时不会写出引用不存在文件的规则。

    `brand_source` 是品牌子集的来源字体名，写进注释便于追溯。
    """
    css_dir = os.path.join(ROOT, 'src', 'styles', 'fonts')
    os.makedirs(css_dir, exist_ok=True)

    brand = [
        '/* 由 scripts/build-font-subsets.py 生成，请勿手改。 */',
        '/* 品牌子集：只覆盖首页/页头/页脚/关于弹层的展示文案，随首屏加载。 */',
        '/* 来源字体：%s */' % (brand_source or '未知'),
        '/* 单一字重 400。展示层一律用 400 请求字形，配合 font-synthesis: none */',
        '/* 保证永远不会出现浏览器合成的假粗体。 */',
        '',
    ]
    if os.path.exists(os.path.join(ROOT, 'src', 'assets', 'fonts', 'brand', 'brand-serif.woff2')):
        brand += [
            '@font-face {',
            '  font-family: "ZiZai Brand Serif";',
            '  font-style: normal;',
            '  font-weight: 400;',
            '  font-display: swap;',
            '  src: url("../../assets/fonts/brand/brand-serif.woff2") format("woff2");',
            '}',
            '',
        ]
    open(os.path.join(css_dir, 'brand.scss'), 'w', encoding='utf-8').write('\n'.join(brand))

    reading = [
        '/* 由 scripts/build-font-subsets.py 生成，请勿手改。 */',
        '/* 阅读字体子集：只被 ReadingView 引用，随赏字路由懒加载。 */',
        '/* 完整字体（*-full.woff2）不在这里声明，由 useFontLoading 按需注入。 */',
        '',
    ]
    for family, folder, subset_file, has_500 in families:
        reading += [
            '@font-face {',
            '  font-family: "%s";' % family,
            '  font-style: normal;',
            '  font-weight: 400;',
            '  font-display: swap;',
            '  src: url("../../assets/fonts/%s/%s") format("woff2");' % (folder, subset_file),
            '}',
            '',
        ]
        if has_500:
            reading += [
                '/* 标题用的 500 字重切片，避免浏览器对 400 做合成加粗（会糊） */',
                '@font-face {',
                '  font-family: "%s";' % family,
                '  font-style: normal;',
                '  font-weight: 500;',
                '  font-display: swap;',
                '  src: url("../../assets/fonts/%s/%s") format("woff2");'
                % (folder, subset_file.replace('.woff2', '-500.woff2')),
                '}',
                '',
            ]
    open(os.path.join(css_dir, 'reading-fonts.scss'), 'w', encoding='utf-8').write(
        '\n'.join(reading)
    )
    print('css -> src/styles/fonts/{brand,reading-fonts}.scss')


def write_coverage(coverage):
    """写出运行时缺字检测用的覆盖表。"""
    path = os.path.join(ROOT, 'src', 'data', 'font-coverage.json')
    payload = {'note': '由 scripts/build-font-subsets.py 生成，请勿手改。', 'fonts': coverage}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print('coverage ->', os.path.relpath(path, ROOT))


def main():
    # 默认目录与 scripts/FONTS-README.md 中约定的位置一致
    default_dir = os.path.join(ROOT, 'scripts', 'font-sources')
    args = [arg for arg in sys.argv[1:] if arg != '--content-only']
    content_only = '--content-only' in sys.argv[1:]
    fonts_dir = args[0] if args else default_dir
    content_chars = collect_content_chars()
    content_cps = {ord(c) for c in content_chars}
    brand_chars = collect_brand_chars()
    brand_cps = {ord(c) for c in brand_chars}
    full_chars = gb2312_chars() | set(EXTRA)
    full_cps = {ord(c) for c in full_chars if not c.isspace()}
    print(
        'content %d chars / brand %d chars / full %d chars'
        % (len(content_cps), len(brand_cps), len(full_cps))
    )

    assets = os.path.join(ROOT, 'src', 'assets', 'fonts')
    report = []
    coverage = {}
    families = []

    # ---- 1. 品牌子集（首屏，用设计稿的主字体：汇文明朝体） ----
    #
    # 首页标题与页头用同一副字形，全站视觉才是连贯的。
    # 汇文明朝体是单一字重，所以展示层一律以 400 请求字形，
    # 并在 global.scss 里关掉 font-synthesis —— 不做假粗体。
    brand_src = find(fonts_dir, 'Huiwen*.ttf') or find(fonts_dir, 'NotoSerifSC*.ttf')
    brand_source_name = '汇文明朝体' if brand_src and 'Huiwen' in brand_src else '思源宋体'
    if brand_src and not content_only:
        brand_cmap = TTFont(brand_src).getBestCmap()
        brand_missing = ''.join(sorted(c for c in brand_chars if ord(c) not in brand_cmap))
        out = os.path.join(assets, 'brand', 'brand-serif.woff2')
        size = subset_to(brand_src, out, brand_cps, weight=None)
        report.append(
            {
                'id': 'brand-serif',
                'source': brand_source_name,
                'kb': round(size / 1024, 1),
                'chars': len(brand_cps),
                'missing': brand_missing,
            }
        )
        print(
            '%-22s %7.1f kB  %d chars  source %s  missing %s'
            % ('brand-serif', size / 1024, len(brand_cps), brand_source_name, brand_missing or '-')
        )
    elif content_only:
        print('SKIP brand-serif (content-only)')
    else:
        print('SKIP brand-serif (no usable serif source found)')

    # ---- 2. 各字体的内容子集 + 完整字体 ----
    for spec in FONT_SPECS:
        src = find(fonts_dir, spec['pattern'])
        if not src:
            print('SKIP %-18s (no file matching %s)' % (spec['id'], spec['pattern']))
            continue

        src_cmap = TTFont(src).getBestCmap()
        # 完整字体覆盖不了的字符要在报告里点名，这决定了题写面板的边界
        full_missing = ''.join(sorted(c for c in full_chars if ord(c) not in src_cmap))
        content_missing = ''.join(sorted(c for c in content_chars if ord(c) not in src_cmap))

        sub_out = os.path.join(assets, spec['folder'], spec['subset'])
        sub_size = subset_to(src, sub_out, content_cps, weight=400)

        full_out = os.path.join(assets, spec['folder'], spec['full'])
        if content_only:
            full_size = os.path.getsize(full_out) if os.path.exists(full_out) else 0
        else:
            full_size = subset_to(src, full_out, full_cps, weight=400)

        extra_weights = spec.get('extra_weights') or []
        for w in extra_weights:
            w_out = os.path.join(
                assets, spec['folder'], spec['subset'].replace('.woff2', '-%d.woff2' % w)
            )
            subset_to(src, w_out, content_cps, weight=w)

        report.append(
            {
                'id': spec['id'],
                'subsetKb': round(sub_size / 1024, 1),
                'fullKb': round(full_size / 1024, 1),
                'contentMissing': content_missing,
                'fullMissing': full_missing,
            }
        )
        coverage[spec['id']] = {
            'subset': coverage_ranges(src_cmap, content_chars),
            'full': coverage_ranges(src_cmap, full_chars),
        }
        families.append(
            (spec.get('family', spec['id']), spec['folder'], spec['subset'], bool(extra_weights))
        )
        print(
            '%-22s subset %6.1f kB  full %7.1f kB  content-missing %d  full-missing %d'
            % (
                spec['id'],
                sub_size / 1024,
                full_size / 1024,
                len(content_missing),
                len(full_missing),
            )
        )
        if content_missing:
            print('   ⚠ 内容缺字: %s' % content_missing)

    write_css(families, brand_source=brand_source_name)
    write_coverage(coverage)

    path = os.path.join(ROOT, 'scripts', 'font-subset-report.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print('report ->', os.path.relpath(path, ROOT))


if __name__ == '__main__':
    main()
