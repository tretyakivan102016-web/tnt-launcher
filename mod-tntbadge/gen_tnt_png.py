# -*- coding: utf-8 -*-
# Генерирует пиксель-арт динамита TnT 8x8 -> PNG (RGBA), без внешних библиотек.
import zlib, struct, os, sys
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'src/main/resources/assets/tntbadge/textures/font/tnt.png')
# палитра: . пусто, R красный, W белый, K чёрный, F фитиль(тёмно-жёлт)
ART = [
    '........',
    '..KK....',
    '..KW....',
    '.RRRRRR.',
    '.RWRRWR.',
    '.RRRRRR.',
    '.RWRRWR.',
    '.RRRRRR.',
]
PAL = {'.': (0,0,0,0), 'R': (215,58,32,255), 'W': (245,242,235,255), 'K': (24,18,14,255), 'F': (180,140,40,255)}
W = H = 8
raw = b''.join(b'\x00' + b''.join(bytes(PAL[c]) for c in row) for row in ART)
def chunk(t, d):
    c = t + d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 6, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(raw, 9))
png += chunk(b'IEND', b'')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'wb').write(png)
print('PNG written:', out, len(png), 'bytes')
