#!/usr/bin/env python3
"""Naikkan versi rilis & pasang cache-busting (?v=) di semua impor modul, CSS, dan service worker.
Pakai:  python3 bump.py 4.2.3     (tanpa argumen = pakai versi di sw.js)"""
import re, sys, glob, pathlib
root = pathlib.Path(__file__).parent
sw = (root / 'sw.js').read_text()
cur = re.search(r"neko-bank-it-v([\d.]+)", sw).group(1)
ver = sys.argv[1] if len(sys.argv) > 1 else cur
sw = re.sub(r"neko-bank-it-v[\d.]+", f"neko-bank-it-v{ver}", sw)
(root / 'sw.js').write_text(sw)
for f in glob.glob(str(root / 'js' / '*.js')):
    p = pathlib.Path(f); s = p.read_text()
    s2 = re.sub(r"(from\s+'\./[\w.-]+\.js)(\?v=[\w.]+)?'", rf"\1?v={ver}'", s)
    s2 = re.sub(r"(import\s+'\./[\w.-]+\.js)(\?v=[\w.]+)?'", rf"\1?v={ver}'", s2)
    if s2 != s: p.write_text(s2)
h = (root / 'index.html').read_text()
h = re.sub(r'src="js/main\.js(\?v=[\w.]+)?"', f'src="js/main.js?v={ver}"', h)
h = re.sub(r'href="css/style\.css(\?v=[\w.]+)?"', f'href="css/style.css?v={ver}"', h)
(root / 'index.html').write_text(h)
print('versi', ver)
