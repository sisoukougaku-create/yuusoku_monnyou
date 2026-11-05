// =============================================================
// lattices.js — 地紋（じもん）＝ 繰り返しの「骨組み」
// -------------------------------------------------------------
// 有職文様の多くは「骨組み（亀甲・菱・立涌など）」の中に
// 「花の文様（花菱など）」を置く、という二段構えになっています。
// このファイルは、その骨組みの方を担当します。
//
// それぞれの地紋は build(大きさ, オプション) という関数を持ち、
// 次のような「タイル（1枚分の絵）」の情報を返します。
//   w, h    : タイルの幅と高さ（このタイルを敷きつめて模様にする）
//   svg     : タイルに描く線（SVG の文字列）
//   centers : 文様（花）を置く場所のリスト [[x, y], ...]
//   cell    : 文様を置ける空間のおおよその大きさ
// =============================================================

window.NY = window.NY || {};

(function () {
  // 小数点以下2桁に丸める（SVG の文字を短くするため）
  function r2(n) {
    return Math.round(n * 100) / 100;
  }

  // タイルの端で図形が切れないよう、上下左右にもコピーして描く
  function wrap(w, h, points, draw) {
    let out = '';
    points.forEach(function (p) {
      [-w, 0, w].forEach(function (dx) {
        [-h, 0, h].forEach(function (dy) {
          out += draw(p[0] + dx, p[1] + dy);
        });
      });
    });
    return out;
  }

  // 正多角形の頂点を "x,y x,y ..." の形で作る
  function polygon(cx, cy, radius, sides, startDeg) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = ((startDeg + (360 / sides) * i) * Math.PI) / 180;
      pts.push(r2(cx + radius * Math.cos(a)) + ',' + r2(cy + radius * Math.sin(a)));
    }
    return pts.join(' ');
  }

  // ひし形（中心, 横半分, 縦半分）
  function diamond(cx, cy, hw, hh) {
    return [
      r2(cx) + ',' + r2(cy - hh),
      r2(cx + hw) + ',' + r2(cy),
      r2(cx) + ',' + r2(cy + hh),
      r2(cx - hw) + ',' + r2(cy),
    ].join(' ');
  }

  // 線のスタイル（色・太さ）
  function stroke(o) {
    return 'fill="none" stroke="' + o.line + '" stroke-width="' + o.lw +
      '" stroke-linejoin="round" stroke-linecap="round"';
  }

  // 菱と襷は形が似ているので、共通の作り方にする
  function buildHishi(s, o, aspect) {
    const w = s;
    const h = s * aspect;
    const base = [[0, 0], [w / 2, h / 2]];
    const svg = wrap(w, h, base, function (x, y) {
      let g = '<polygon points="' + diamond(x, y, w / 2, h / 2) + '" ' + stroke(o) + '/>';
      if (o.double) {
        g += '<polygon points="' + diamond(x, y, w * 0.4, h * 0.4) + '" ' + stroke(o) + '/>';
      }
      return g;
    });
    return { w: w, h: h, svg: svg, centers: base, cell: w * (o.double ? 0.42 : 0.5) };
  }

  NY.LATTICES = {
    // ---- 散らし：骨組みなし。文様だけを互い違いに並べる（小紋風）
    scatter: {
      label: '散らし（地紋なし）',
      build: function (s) {
        return { w: s, h: s, svg: '', centers: [[0, 0], [s / 2, s / 2]], cell: s * 0.6 };
      },
    },

    // ---- 亀甲：六角形を敷きつめた、長寿を表す文様
    kikko: {
      label: '亀甲',
      build: function (s, o) {
        const r = s / 2;
        const w = 3 * r;
        const h = Math.sqrt(3) * r;
        const base = [[0, 0], [1.5 * r, h / 2]];
        const svg = wrap(w, h, base, function (x, y) {
          let g = '<polygon points="' + polygon(x, y, r, 6, 0) + '" ' + stroke(o) + '/>';
          if (o.double) {
            g += '<polygon points="' + polygon(x, y, r * 0.8, 6, 0) + '" ' + stroke(o) + '/>';
          }
          return g;
        });
        return { w: w, h: h, svg: svg, centers: base, cell: r * (o.double ? 1.25 : 1.5) };
      },
    },

    // ---- 菱：縦長のひし形の格子
    hishi: {
      label: '菱格子',
      build: function (s, o) {
        return buildHishi(s, o, 1.45);
      },
    },

    // ---- 襷：正方形を45度傾けた斜め格子
    tasuki: {
      label: '襷（たすき）',
      build: function (s, o) {
        return buildHishi(s, o, 1);
      },
    },

    // ---- 立涌：ふくらんだり、すぼまったりする波の縦線。湯気の立ちのぼる姿
    tatewaku: {
      label: '立涌（たてわく）',
      build: function (s, o) {
        const w = s;
        const h = s * 1.6;
        const a = w * 0.13; // 波の大きさ
        const steps = 32;
        // offsetX: 二重線用のずらし幅, dir: 波の向き(+1 / -1)
        function waveLine(centerX, dir, offsetX) {
          let d = '';
          for (let i = 0; i <= steps; i++) {
            const y = (h * i) / steps;
            const x = centerX + offsetX + dir * a * Math.cos((2 * Math.PI * y) / h);
            d += (i === 0 ? 'M' : 'L') + r2(x) + ',' + r2(y);
          }
          return '<path d="' + d + '" ' + stroke(o) + '/>';
        }
        const offs = o.double ? [-w * 0.035, w * 0.035] : [0];
        let svg = '';
        offs.forEach(function (off) {
          svg += waveLine(w * 0.25, +1, off);
          svg += waveLine(w * 0.75, -1, off);
        });
        return { w: w, h: h, svg: svg, centers: [[0, 0], [w / 2, h / 2]], cell: w * (o.double ? 0.5 : 0.6) };
      },
    },

    // ---- 七宝：円を4分の1ずつ重ねてつないだ文様。円満・調和
    shippo: {
      label: '七宝',
      build: function (s, o) {
        const r = s / 2;
        const base = [[0, 0], [r, r]];
        const svg = wrap(2 * r, 2 * r, base, function (x, y) {
          let g = '<circle cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r2(r) + '" ' + stroke(o) + '/>';
          if (o.double) {
            g += '<circle cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r2(r * 0.86) + '" ' + stroke(o) + '/>';
          }
          return g;
        });
        return { w: 2 * r, h: 2 * r, svg: svg, centers: base, cell: r * 0.75 };
      },
    },

    // ---- 青海波：扇形の波を重ねた文様。おだやかな海
    seigaiha: {
      label: '青海波',
      build: function (s, o) {
        const r = s / 2;
        const w = 2 * r;
        const h = r;
        const rings = o.double ? 5 : 3;
        let svg = '';
        // 上の段から順に描くと、下の段が上に重なって「波」になる
        for (let k = 0; k <= 6; k++) {
          const y = -r + (k * r) / 2;
          const xs = k % 2 === 0 ? [0, w] : [r];
          xs.forEach(function (x) {
            svg += '<circle cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r2(r) + '" fill="' + o.bg +
              '" stroke="' + o.line + '" stroke-width="' + o.lw + '"/>';
            for (let j = 1; j < rings; j++) {
              svg += '<circle cx="' + r2(x) + '" cy="' + r2(y) + '" r="' + r2(r * (1 - j / rings)) + '" ' + stroke(o) + '/>';
            }
          });
        }
        return { w: w, h: h, svg: svg, centers: [], cell: 0 };
      },
    },

    // ---- 鱗：三角形を互い違いに並べた文様。厄除け
    uroko: {
      label: '鱗（うろこ）',
      build: function (s, o) {
        const w = s;
        const th = s * 0.866; // 正三角形の高さ
        const h = th * 2;
        const tri = function (ax, ay) {
          return '<polygon points="' + r2(ax) + ',' + r2(ay) + ' ' + r2(ax + w / 2) + ',' + r2(ay + th) + ' ' +
            r2(ax - w / 2) + ',' + r2(ay + th) + '" fill="' + o.line + '" stroke="' + o.line +
            '" stroke-width="' + o.lw + '" stroke-linejoin="round"/>';
        };
        const base = [[w / 2, 0], [0, th]];
        const svg = wrap(w, h, base, tri);
        return { w: w, h: h, svg: svg, centers: [[0, th / 3], [w / 2, th + th / 3]], cell: s * 0.35 };
      },
    },
  };
})();
