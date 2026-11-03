# -*- coding: utf-8 -*-
"""
兼容重定向脚本：转发至统一构建管线 scripts/build-fonts.py。
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
cmd = [sys.executable, '-I', str(ROOT / 'scripts' / 'build-fonts.py')] + sys.argv[1:]
sys.exit(subprocess.call(cmd))
