#!/usr/bin/env python3
"""アイコン生成（標準ライブラリのみ）。濃紺背景＋アンバーの雲＋チェックマーク。
使い方: python3 scripts/make_icons.py  → icons/ に PNG を出力"""
import math, os, struct, zlib

BG = (29, 36, 48)        # #1D2430
BG2 = (44, 54, 71)
CLOUD = (242, 163, 94)   # #F2A35E
CHECK = (29, 36, 48)

def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)

def in_cloud(x, y):
    # 単位座標(0..1)。円の和＋中央の矩形（下端は両端の円で丸める）
    y -= 0.045
    for cx, cy, r in ((0.31, 0.54, 0.11), (0.50, 0.43, 0.17), (0.69, 0.54, 0.11), (0.66, 0.46, 0.10), (0.36, 0.47, 0.10)):
        if math.hypot(x - cx, y - cy) <= r:
            return True
    return 0.31 <= x <= 0.69 and 0.43 <= y <= 0.65

def in_check(x, y):
    w = 0.033
    y -= 0.045
    return (seg_dist(x, y, 0.40, 0.535, 0.48, 0.615) <= w or
            seg_dist(x, y, 0.48, 0.615, 0.62, 0.45) <= w)

def render(size, ss=3):
    rows = []
    for j in range(size):
        row = bytearray()
        for i in range(size):
            acc = [0, 0, 0]
            for sj in range(ss):
                for si in range(ss):
                    x = (i + (si + .5) / ss) / size
                    y = (j + (sj + .5) / ss) / size
                    t = (x + y) / 2
                    c = tuple(BG[k] + (BG2[k] - BG[k]) * t for k in range(3))
                    if in_cloud(x, y):
                        c = CHECK if in_check(x, y) else CLOUD
                    for k in range(3):
                        acc[k] += c[k]
            row += bytes(int(a / (ss * ss)) for a in acc)
        rows.append(bytes(row))
    return rows

def png(path, size):
    raw = b''.join(b'\0' + r for r in render(size))
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
    open(path, 'wb').write(data)

os.makedirs('icons', exist_ok=True)
for name, s in (('icon-512.png', 512), ('icon-192.png', 192), ('apple-touch-icon.png', 180), ('favicon-32.png', 32)):
    png('icons/' + name, s)
    print(name)
