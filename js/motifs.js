// =============================================================
// motifs.js — 文様（花菱・唐花など）を描くファイル
// -------------------------------------------------------------
// 有職文様の花は「同じ花びらを、中心のまわりにぐるっと回して
// 並べたもの」として表せます（花菱 = ハート形の花びら × 4枚）。
// そこで文様を、次のような「設計図（spec）」で表します。
//
//   {
//     label: '花菱',
//     n: 4,                 // 花びらの枚数（回転の数）
//     layers: [             // 花びらの層（外側→内側の順に重ねる）
//       { shape: 'heart', offset: 6, len: 42, wd: 34, color: 'motif' },
//     ],
//     center: { r: 5, color: 'accent', sides: 0 },  // 中心（0なら円）
//     ring:   { r: 48, w: 3, color: 'line' },       // 外の丸（なくてもOK）
//   }
//
// この設計図の数字を変えるだけで、伝統文様のアレンジや
// まったく新しい文様が作れる、という仕組みです。
// 文様は「半径50」の円の中に収まるように描きます。
// =============================================================

window.NY = window.NY || {};

(function () {
  function r2(n) {
    return Math.round(n * 100) / 100;
  }

  // 花びらの形の一覧（画面の選択肢にも使います）
  NY.PETAL_SHAPES = {
    heart: 'ハート（花菱形）',
    drop: 'しずく',
    leaf: '葉',
    diamond: '菱',
    ellipse: '楕円',
    circle: '円',
  };

  // 花びら1枚の形を SVG の path（線の道すじ）で作る
  // 根元が (0,0)、先端が (0,-len) の上向きの花びら
  function petalPath(shape, len, wd) {
    const L = len;
    const W = wd;
    switch (shape) {
      case 'heart': // 先端がくぼんだ形（花菱の花びら）
        return 'M0,0 C' + r2(W * 0.75) + ',' + r2(-L * 0.3) + ' ' + r2(W * 0.55) + ',' + r2(-L * 1.02) + ' 0,' + r2(-L * 0.8) +
          ' C' + r2(-W * 0.55) + ',' + r2(-L * 1.02) + ' ' + r2(-W * 0.75) + ',' + r2(-L * 0.3) + ' 0,0Z';
      case 'drop': // 先が丸いしずく形（唐花の花びら）
        return 'M0,0 C' + r2(W * 0.9) + ',' + r2(-L * 0.15) + ' ' + r2(W * 0.75) + ',' + r2(-L) + ' 0,' + r2(-L) +
          ' C' + r2(-W * 0.75) + ',' + r2(-L) + ' ' + r2(-W * 0.9) + ',' + r2(-L * 0.15) + ' 0,0Z';
      case 'leaf': // 先がとがった葉の形（桔梗など）
        return 'M0,0 Q' + r2(W) + ',' + r2(-L * 0.5) + ' 0,' + r2(-L) + ' Q' + r2(-W) + ',' + r2(-L * 0.5) + ' 0,0Z';
      case 'diamond': // ひし形
        return 'M0,0 L' + r2(W / 2) + ',' + r2(-L / 2) + ' L0,' + r2(-L) + ' L' + r2(-W / 2) + ',' + r2(-L / 2) + 'Z';
      case 'ellipse': {
        const rx = W / 2;
        const ry = L / 2;
        return 'M' + r2(-rx) + ',' + r2(-ry) + ' a' + r2(rx) + ',' + r2(ry) + ' 0 1 0 ' + r2(2 * rx) + ',0' +
          ' a' + r2(rx) + ',' + r2(ry) + ' 0 1 0 ' + r2(-2 * rx) + ',0Z';
      }
      case 'circle':
      default: {
        const rr = Math.min(W, L) / 2;
        return 'M' + r2(-rr) + ',' + r2(-L / 2) + ' a' + r2(rr) + ',' + r2(rr) + ' 0 1 0 ' + r2(2 * rr) + ',0' +
          ' a' + r2(rr) + ',' + r2(rr) + ' 0 1 0 ' + r2(-2 * rr) + ',0Z';
      }
    }
  }

  // 設計図（spec）と配色（colors）から、文様の SVG を作る
  NY.motifSVG = function (spec, colors) {
    let out = '';
    const n = Math.max(1, spec.n || 1);

    // 外側の丸（「丸に〜」の丸）
    if (spec.ring) {
      out += '<circle r="' + r2(spec.ring.r) + '" fill="none" stroke="' + colors[spec.ring.color] +
        '" stroke-width="' + r2(spec.ring.w) + '"/>';
    }

    // 花びらの層を順番に描く
    (spec.layers || []).forEach(function (layer) {
      const d = petalPath(layer.shape, layer.len, layer.wd);
      const paint = layer.outline
        ? 'fill="none" stroke="' + colors[layer.color] + '" stroke-width="2.5" stroke-linejoin="round"'
        : 'fill="' + colors[layer.color] + '"';
      for (let k = 0; k < n; k++) {
        const angle = (360 / n) * k + (layer.rot || 0);
        out += '<path transform="rotate(' + r2(angle) + ') translate(0 ' + r2(-layer.offset) + ')" d="' + d + '" ' + paint + '/>';
      }
    });

    // 中心（花の芯）
    if (spec.center) {
      const c = spec.center;
      if (c.sides && c.sides >= 3) {
        const pts = [];
        for (let i = 0; i < c.sides; i++) {
          const a = ((360 / c.sides) * i - 90) * (Math.PI / 180);
          pts.push(r2(c.r * Math.cos(a)) + ',' + r2(c.r * Math.sin(a)));
        }
        out += '<polygon points="' + pts.join(' ') + '" fill="' + colors[c.color] + '"/>';
      } else {
        out += '<circle r="' + r2(c.r) + '" fill="' + colors[c.color] + '"/>';
      }
    }
    return out;
  };

  // ---- 伝統的な文様の設計図 --------------------------------
  NY.MOTIFS = {
    hanabishi: {
      label: '花菱',
      n: 4,
      layers: [{ shape: 'heart', offset: 5, len: 43, wd: 34, color: 'motif' }],
      center: { r: 5, color: 'accent', sides: 0 },
    },
    karahana: {
      label: '唐花',
      n: 4,
      layers: [
        { shape: 'drop', offset: 6, len: 42, wd: 34, color: 'motif' },
        { shape: 'drop', offset: 4, len: 26, wd: 18, color: 'accent', rot: 45 },
      ],
      center: { r: 8, color: 'motif', sides: 0 },
    },
    shichiyo: {
      label: '七曜',
      n: 6,
      layers: [{ shape: 'circle', offset: 19, len: 30, wd: 30, color: 'motif' }],
      center: { r: 16, color: 'motif', sides: 0 },
    },
    yotsubishi: {
      label: '四つ菱',
      n: 4,
      layers: [{ shape: 'diamond', offset: 4, len: 42, wd: 36, color: 'motif' }],
      center: null,
    },
    kikyo: {
      label: '桔梗',
      n: 5,
      layers: [
        { shape: 'leaf', offset: 3, len: 45, wd: 30, color: 'motif' },
        { shape: 'leaf', offset: 6, len: 22, wd: 6, color: 'accent' },
      ],
      center: { r: 5, color: 'accent', sides: 0 },
    },
    arare: {
      label: '霰（点）',
      n: 1,
      layers: [],
      center: { r: 22, color: 'motif', sides: 0 },
    },
  };
})();
