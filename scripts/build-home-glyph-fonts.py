# -*- coding: utf-8 -*-
"""Build light homepage Han-font subsets from the original fonts' real cmaps.

This is deliberately independent from build-font-subsets.py. It does not
change the existing reading fonts, their coverage data, or the complete-font
conversion policy.
"""

import json
import random
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / 'scripts' / 'font-sources'
ASSET_DIR = ROOT / 'src' / 'assets' / 'fonts' / 'home'
POOL_PATH = ROOT / 'src' / 'data' / 'home-glyph-pools.json'
CSS_PATH = ROOT / 'src' / 'styles' / 'fonts' / 'home-glyphs.scss'

# Han-script blocks, including the assigned CJK extension and compatibility
# supplement planes. cmap membership remains the authoritative font check.
HAN_RANGES = (
    (0x3400, 0x4DC0),       # Extension A
    (0x4E00, 0xA000),       # Unified Ideographs
    (0xF900, 0xFB00),       # Compatibility Ideographs
    (0x20000, 0x2A6E0),     # Extension B
    (0x2A700, 0x2B740),     # Extension C
    (0x2B740, 0x2B820),     # Extension D
    (0x2B820, 0x2CEB0),     # Extension E
    (0x2CEB0, 0x2EBF0),     # Extension F
    (0x2EBF0, 0x2EE60),     # Extension I
    (0x2F800, 0x2FA20),     # Compatibility Ideographs Supplement
    (0x30000, 0x31350),     # Extension G
    (0x31350, 0x323B0),     # Extension H
    (0x323B0, 0x33480),     # Extension J
)

FONT_SPECS = (
    ('huawen-mingchao', 'ZiZai Falling Huiwen Mincho', 'Huiwen.ttf', 'huiwen-mincho'),
    ('lxgw-wenkai', 'ZiZai Falling LXGW WenKai', 'LXGWWenKai-Regular.ttf', 'lxgw-wenkai'),
    ('zhuque-fangsong', 'ZiZai Falling Zhuque Fangsong', 'ZhuqueFangsong-Regular.ttf', 'zhuque-fangsong'),
    ('noto-serif-sc', 'ZiZai Falling Noto Serif SC', 'NotoSerifSC.ttf', 'noto-serif-sc'),
)

HAN_LIMIT_PER_FONT = 1200
RANDOM_SEED = 20261102


def is_han(codepoint):
    return any(start <= codepoint < end for start, end in HAN_RANGES)


def unicode_ranges(codepoints):
    values = sorted(codepoints)
    if not values:
        return ''
    spans = []
    start = previous = values[0]
    for value in values[1:]:
        if value == previous + 1:
            previous = value
            continue
        spans.append((start, previous))
        start = previous = value
    spans.append((start, previous))
    return ','.join(
        f'U+{start:X}' if start == end else f'U+{start:X}-{end:X}'
        for start, end in spans
    )


def build_subset(source_path, output_path, codepoints):
    options = subset.Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.notdef_outline = True
    options.drop_tables += ['DSIG']
    options.flavor = 'woff2'

    font = subset.load_font(str(source_path), options)
    try:
        glyph_subset = subset.Subsetter(options=options)
        glyph_subset.populate(unicodes=codepoints)
        glyph_subset.subset(font)

        # Keep original variable axes and their values. This script selects
        # characters; it does not pin or otherwise alter a font's weight.
        if 'fvar' in font:
            axes = [
                {'tag': axis.axisTag, 'min': axis.minValue, 'max': axis.maxValue}
                for axis in font['fvar'].axes
            ]
        else:
            axes = []

        output_path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = output_path.with_suffix('.tmp.woff2')
        try:
            subset.save_font(font, str(temporary_path), options)
            temporary_path.replace(output_path)
        finally:
            temporary_path.unlink(missing_ok=True)
        return output_path.stat().st_size, axes
    finally:
        font.close()


def main():
    if HAN_LIMIT_PER_FONT < 800 or HAN_LIMIT_PER_FONT > 1500:
        raise ValueError('Homepage sample size must be between 800 and 1500 Han characters per font.')

    manifest_fonts = {}
    summary = []

    for font_id, family, source_name, output_name in FONT_SPECS:
        source_path = SOURCE_DIR / source_name
        if not source_path.is_file():
            raise FileNotFoundError(
                f'Missing {source_path.relative_to(ROOT)}. See scripts/FONTS-README.md.'
            )

        original = TTFont(str(source_path), lazy=True)
        try:
            cmap = original.getBestCmap()
            han_codepoints = sorted(cp for cp in cmap if is_han(cp))
            variable_axes = [
                {'tag': axis.axisTag, 'min': axis.minValue, 'max': axis.maxValue}
                for axis in original['fvar'].axes
            ] if 'fvar' in original else []
        finally:
            original.close()

        if not han_codepoints:
            raise ValueError(f'{source_name} has no CJK Han characters in its actual cmap.')

        rng = random.Random(f'{RANDOM_SEED}:{font_id}')
        chosen = sorted(rng.sample(han_codepoints, min(HAN_LIMIT_PER_FONT, len(han_codepoints))))
        output_path = ASSET_DIR / f'falling-{output_name}.woff2'
        size, subset_axes = build_subset(source_path, output_path, chosen)

        # Make the output a verifiable artifact: every sampled scalar must be
        # present in the generated font's real cmap.
        subset_font = TTFont(str(output_path), lazy=True)
        try:
            subset_cmap = subset_font.getBestCmap()
            missing = [cp for cp in chosen if cp not in subset_cmap]
            if missing:
                raise ValueError(f'{output_path.name} is missing selected codepoints: {missing[:8]!r}')
        finally:
            subset_font.close()

        if subset_axes != variable_axes:
            raise ValueError(f'Variable font axes changed while building {source_name}.')

        chars = ''.join(chr(cp) for cp in chosen)
        variable_weight = next((axis for axis in variable_axes if axis['tag'] == 'wght'), None)
        css_weight = (
            f"{variable_weight['min']:g} {variable_weight['max']:g}"
            if variable_weight else '400'
        )
        manifest_fonts[font_id] = {
            'family': family,
            'file': f'falling-{output_name}.woff2',
            'chars': chars,
            'hanCount': len(chosen),
            'sourceHanCount': len(han_codepoints),
            'sourceCmapCount': len(cmap),
            'unicodeRange': unicode_ranges(chosen),
            'sizeBytes': size,
            'cssWeight': css_weight,
            'variationAxes': variable_axes,
        }
        summary.append((font_id, len(han_codepoints), len(chosen), size, variable_axes))

    unique_chars = set().union(*(set(entry['chars']) for entry in manifest_fonts.values()))
    payload = {
        'note': 'Homepage-only random Han pools sampled from each original source cmap. These are subsets, not complete fonts.',
        'requestedHanPerFont': HAN_LIMIT_PER_FONT,
        'uniqueHanCount': len(unique_chars),
        'totalFontCharacterMappings': sum(entry['hanCount'] for entry in manifest_fonts.values()),
        'fonts': manifest_fonts,
    }

    CSS_PATH.parent.mkdir(parents=True, exist_ok=True)
    css_lines = [
        '/* Generated by scripts/build-home-glyph-fonts.py; homepage subsets, not complete fonts. */',
        '/* Each WOFF2 preserves original outlines and variable axes for its selected cmap. */',
        '',
    ]
    for entry in manifest_fonts.values():
        css_lines.extend([
            '@font-face {',
            f"  font-family: '{entry['family']}';",
            '  font-style: normal;',
            f"  font-weight: {entry['cssWeight']};",
            '  font-display: swap;',
            f"  src: url('../../assets/fonts/home/{entry['file']}') format('woff2');",
            f"  unicode-range: {entry['unicodeRange']};",
            '}',
            '',
        ])

    pool_tmp = POOL_PATH.with_suffix('.tmp.json')
    css_tmp = CSS_PATH.with_suffix('.tmp.scss')
    try:
        pool_tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        css_tmp.write_text('\n'.join(css_lines), encoding='utf-8')
        pool_tmp.replace(POOL_PATH)
        css_tmp.replace(CSS_PATH)
    finally:
        pool_tmp.unlink(missing_ok=True)
        css_tmp.unlink(missing_ok=True)

    print(f'Unique Han characters across homepage pools: {len(unique_chars)}')
    for font_id, source_count, selected_count, size, axes in summary:
        axis_text = ', '.join(axis['tag'] for axis in axes) or 'static weight'
        print(
            f'{font_id:18} source Han {source_count:5} / selected {selected_count:4} '
            f'/ WOFF2 {size / 1024:7.1f} kB / {axis_text}'
        )
    print(f'Manifest -> {POOL_PATH.relative_to(ROOT)}')
    print(f'CSS -> {CSS_PATH.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
