// =============================================================
// render.js — デザイン（設計データ）を 1枚の SVG 画像にする
// -------------------------------------------------------------
// SVG には <pattern>（パターン）という機能があり、
// 「タイル1枚」を定義すると、自動で敷きつめて塗ってくれます。
// ここでは
//   1. 地紋（骨組み）のタイルを作る
//   2. そのタイルの centers の位置に文様（花）を置く
//   3. <pattern> として登録し、四角形をそのパターンで塗る
// という順番で絵を作ります。
// =============================================================

window.NY = window.NY || {};

(function () {
  function r2(n) {
    return Math.round(n * 100) / 100;
  }

  // パターン1枚分の <pattern> タグを作る
  function patternDef(id, opts) {
    const lattice = NY.LATTICES[opts.lattice] || NY.LATTICES.scatter;
    const tile = lattice.build(opts.scale, {
      line: opts.line,
      lw: opts.lineWidth,
      double: opts.double,
      bg: opts.bg,
    });

    let body = tile.svg;

    // 文様を centers の位置に置く（タイルの端でも切れないように9か所へコピー）
    if (opts.motif && tile.centers.length > 0) {
      const motif = NY.motifSVG(opts.motif, opts.colors);
      const k = (tile.cell * opts.motifSize) / 100; // 半径50 → 実際の大きさ への倍率
      tile.centers.forEach(function (c) {
        [-tile.w, 0, tile.w].forEach(function (dx) {
          [-tile.h, 0, tile.h].forEach(function (dy) {
            body += '<g transform="translate(' + r2(c[0] + dx) + ' ' + r2(c[1] + dy) + ') rotate(' +
              r2(opts.motifRotate || 0) + ') scale(' + r2(k * 1000) / 1000 + ')">' + motif + '</g>';
          });
        });
      });
    }

    return '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="' + r2(tile.w) + '" height="' + r2(tile.h) +
      '" patternTransform="rotate(' + r2(opts.rotation || 0) + ')">' + body + '</pattern>';
  }

  // デザイン全体から <svg> の文字列を作る
  //   design : 設計データ（generator.js の defaultDesign を参照）
  //   size   : 画像の一辺（座標の大きさ）
  //   id     : ページ内で重ならない名前（サムネイルを複数並べるため）
  //   pixel  : 実際に書き出すピクセル数（省略すると size と同じ）
  NY.renderDesign = function (design, size, id, pixel) {
    const c = design.palette;
    const px = pixel || size;
    let defs = patternDef(id + '-main', {
      lattice: design.lattice,
      scale: design.scale,
      rotation: design.rotation,
      lineWidth: design.lineWidth,
      double: design.double,
      line: c.line,
      bg: c.bg,
      colors: c,
      motif: design.motif,
      motifSize: design.motifSize,
      motifRotate: design.motifRotate,
    });

    let layers = '<rect width="' + size + '" height="' + size + '" fill="' + c.bg + '"/>' +
      '<rect width="' + size + '" height="' + size + '" fill="url(#' + id + '-main)"/>';

    // 重ね（オーバーレイ）：もう1つの地紋を差し色で薄く重ねる
    if (design.overlay) {
      const ov = design.overlay;
      defs += patternDef(id + '-over', {
        lattice: ov.lattice,
        scale: ov.scale,
        rotation: ov.rotation,
        lineWidth: design.lineWidth,
        double: false,
        line: c.accent,
        bg: 'none',
        colors: c,
        motif: null,
      });
      layers += '<rect width="' + size + '" height="' + size + '" fill="url(#' + id + '-over)" opacity="' + ov.opacity + '"/>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + px + '" height="' + px + '">' +
      '<defs>' + defs + '</defs>' + layers + '</svg>';
  };
})();
