// =============================================================
// generator.js — 文様を「生み出す」ロジック
// -------------------------------------------------------------
//   ・defaultDesign  : 設計データのひな形
//   ・PRESETS        : 伝統文様のプリセット（アレンジの出発点）
//   ・randomMotif    : 新しい花の文様をランダムに作る
//   ・randomDesign   : 地紋＋文様＋配色をまるごと新規生成
//   ・mutateDesign   : 今のデザインを少しだけ変えた「派生案」を作る
// =============================================================

window.NY = window.NY || {};

(function () {
  function r1(n) {
    return Math.round(n * 10) / 10;
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // 深いコピー（元のデータを書き換えないように複製する）
  NY.clone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  // ---- 設計データのひな形 ------------------------------------
  NY.defaultDesign = function () {
    return {
      name: '亀甲花菱',
      seed: null,
      lattice: 'kikko',     // 地紋の種類（lattices.js のキー）
      double: true,         // 二重線にするか
      scale: 70,            // 地紋の大きさ
      rotation: 0,          // 全体の回転（度）
      lineWidth: 2,         // 線の太さ
      motif: NY.clone(NY.MOTIFS.hanabishi), // 文様の設計図（null なら文様なし）
      motifSize: 0.85,      // 枠に対する文様の大きさ
      motifRotate: 0,       // 文様の回転（度）
      overlay: null,        // 重ねる地紋 { lattice, scale, rotation, opacity }
      paletteName: '紅梅',
      palette: NY.clone(NY.findPalette('紅梅').colors),
    };
  };

  // プリセットを作る補助関数（ひな形に差分を上書き）
  function preset(name, changes) {
    const d = Object.assign(NY.defaultDesign(), changes);
    d.name = name;
    d.palette = NY.clone(NY.findPalette(d.paletteName).colors);
    return d;
  }

  // ---- 伝統文様のプリセット ----------------------------------
  NY.PRESETS = [
    preset('亀甲花菱', { lattice: 'kikko', double: true, motif: NY.clone(NY.MOTIFS.hanabishi), paletteName: '紅梅' }),
    preset('唐花立涌', { lattice: 'tatewaku', double: true, scale: 80, motif: NY.clone(NY.MOTIFS.karahana), motifSize: 0.8, paletteName: '藤' }),
    preset('七宝に七曜', { lattice: 'shippo', double: false, scale: 64, motif: NY.clone(NY.MOTIFS.shichiyo), motifSize: 0.7, paletteName: '縹' }),
    preset('青海波', { lattice: 'seigaiha', double: true, scale: 60, motif: null, paletteName: '縹' }),
    preset('菱に四つ菱', { lattice: 'hishi', double: false, scale: 56, motif: NY.clone(NY.MOTIFS.yotsubishi), motifSize: 0.8, paletteName: '萌黄' }),
    preset('襷花菱', { lattice: 'tasuki', double: true, scale: 70, motif: NY.clone(NY.MOTIFS.hanabishi), motifSize: 0.8, paletteName: '山吹' }),
    preset('鱗', { lattice: 'uroko', double: false, scale: 40, motif: null, paletteName: '檜皮' }),
    preset('桔梗散らし', { lattice: 'scatter', double: false, scale: 80, motif: NY.clone(NY.MOTIFS.kikyo), motifSize: 0.8, paletteName: '桜' }),
  ];

  // ---- 新しい文様の名前を作る --------------------------------
  const NAME_A = ['雅', '月', '雲', '星', '霞', '光', '風', '雪', '綾', '暁', '宵', '響'];
  const NAME_B = ['花', '菱', '華', '輪', '紋', '葵', '環', '蕾'];

  // ---- 新しい花の文様をランダムに作る ------------------------
  NY.randomMotif = function (rng) {
    const n = rng.pick([3, 4, 4, 5, 5, 6, 6, 8, 8, 12]);
    const shapes = Object.keys(NY.PETAL_SHAPES);
    const hasRing = rng.chance(0.25);
    const limit = hasRing ? 42 : 48; // 花びらが届いてよい最大の半径
    const layers = [];

    // 外側の花びら（主役）
    const offset = r1(rng.range(2, 12));
    const len = r1(Math.min(limit - offset, rng.range(26, 44)));
    const room = (2 * Math.PI * (offset + len * 0.5)) / n; // 隣の花びらとの間隔
    const outer = {
      shape: rng.pick(shapes),
      offset: offset,
      len: len,
      wd: r1(clamp(room * rng.range(0.55, 1.1), 6, 44)),
      color: 'motif',
    };

    // 輪郭だけの花びら（後ろに重ねる飾り）
    if (rng.chance(0.35)) {
      layers.push({
        shape: rng.pick(shapes),
        offset: r1(offset * 0.5),
        len: r1(limit - offset * 0.5),
        wd: r1(outer.wd * rng.range(0.6, 1.0)),
        color: rng.pick(['line', 'accent']),
        rot: 180 / n,
        outline: true,
      });
    }
    layers.push(outer);

    // 内側の小さな花びら（差し色）
    if (rng.chance(0.6)) {
      layers.push({
        shape: rng.pick(shapes),
        offset: r1(rng.range(0, 6)),
        len: r1(len * rng.range(0.35, 0.6)),
        wd: r1(outer.wd * rng.range(0.3, 0.6)),
        color: 'accent',
        rot: rng.chance(0.5) ? 180 / n : 0,
      });
    }

    return {
      label: rng.pick(NAME_A) + rng.pick(NAME_B),
      n: n,
      layers: layers,
      center: rng.chance(0.8)
        ? { r: r1(rng.range(3, 9)), color: rng.pick(['accent', 'bg', 'line']), sides: rng.pick([0, 0, n]) }
        : null,
      ring: hasRing ? { r: 47, w: r1(rng.range(2, 4)), color: rng.pick(['line', 'motif']) } : null,
    };
  };

  // ---- 地紋＋文様＋配色をまるごと新規生成 --------------------
  // boldness（大胆さ）: 0〜1。大きいほど回転や重ねが増える
  NY.randomDesign = function (seed, boldness) {
    const rng = NY.createRandom(seed);
    const bold = boldness === undefined ? 0.5 : boldness;
    const keys = Object.keys(NY.LATTICES);
    const lattice = rng.pick(keys);
    const palette = rng.pick(NY.PALETTES);

    let motif = null;
    if (lattice !== 'seigaiha' && (lattice === 'scatter' || rng.chance(0.85))) {
      // 7割は新しい花、3割は伝統の花をベースにアレンジ
      motif = rng.chance(0.7)
        ? NY.randomMotif(rng)
        : NY.clone(NY.MOTIFS[rng.pick(Object.keys(NY.MOTIFS))]);
    }

    const d = {
      name: '',
      seed: seed,
      lattice: lattice,
      double: rng.chance(0.5),
      scale: rng.int(45, 100),
      rotation: rng.chance(bold * 0.6) ? rng.pick([15, 30, 45, 90]) : 0,
      lineWidth: r1(rng.range(1, 3.2)),
      motif: motif,
      motifSize: r1(rng.range(0.65, 1.0)),
      motifRotate: rng.chance(bold * 0.4) ? rng.pick([15, 30, 45]) : 0,
      overlay: null,
      paletteName: palette.name,
      palette: NY.clone(palette.colors),
    };

    // 重ね：大胆さが高いほど出やすい
    if (rng.chance(0.15 + bold * 0.45)) {
      const ovKeys = keys.filter(function (k) { return k !== 'scatter' && k !== lattice; });
      d.overlay = {
        lattice: rng.pick(ovKeys),
        scale: rng.int(30, 140),
        rotation: rng.pick([0, 0, 30, 45, 90]),
        opacity: r1(rng.range(0.25, 0.6)),
      };
    }

    d.name = NY.designName(d);
    return d;
  };

  // ---- 派生案を作る（今のデザインを少しずつ変える） ----------
  // amount: 0〜1。変化の大きさ
  NY.mutateDesign = function (base, seed, amount) {
    const rng = NY.createRandom(seed);
    const d = NY.clone(base);
    const a = amount === undefined ? 0.4 : amount;

    d.scale = Math.round(clamp(d.scale * rng.range(1 - a * 0.4, 1 + a * 0.4), 30, 160));
    d.lineWidth = r1(clamp(d.lineWidth + rng.range(-a, a), 0.5, 5));
    d.motifSize = r1(clamp(d.motifSize + rng.range(-a * 0.3, a * 0.3), 0.4, 1.4));
    if (rng.chance(a * 0.4)) d.double = !d.double;
    if (rng.chance(a * 0.3)) {
      const p = rng.pick(NY.PALETTES);
      d.paletteName = p.name;
      d.palette = NY.clone(p.colors);
    }
    if (rng.chance(a * 0.25)) {
      d.lattice = rng.pick(Object.keys(NY.LATTICES).filter(function (k) { return k !== 'seigaiha'; }));
    }

    if (d.motif && d.motif.layers.length > 0) {
      const m = d.motif;
      if (rng.chance(a * 0.6)) m.n = clamp(m.n + rng.pick([-1, 1, 2]), 3, 12);
      m.layers.forEach(function (layer) {
        if (rng.chance(a * 0.4)) layer.shape = rng.pick(Object.keys(NY.PETAL_SHAPES));
        layer.wd = r1(clamp(layer.wd * rng.range(1 - a * 0.4, 1 + a * 0.4), 4, 46));
        layer.len = r1(clamp(layer.len * rng.range(1 - a * 0.2, 1 + a * 0.15), 8, 48 - layer.offset));
      });
      if (rng.chance(a * 0.3)) m.label = '新' + m.label.replace(/^新/, '');
    } else if (!d.motif && d.lattice !== 'seigaiha' && rng.chance(a * 0.5)) {
      d.motif = NY.randomMotif(rng);
    }

    if (rng.chance(a * 0.3)) {
      d.overlay = d.overlay ? null : {
        lattice: rng.pick(['kikko', 'hishi', 'tatewaku', 'shippo', 'tasuki']),
        scale: rng.int(40, 140),
        rotation: rng.pick([0, 30, 45]),
        opacity: r1(rng.range(0.25, 0.5)),
      };
    }

    d.name = NY.designName(d);
    return d;
  };

  // ---- 名前をつける（例：「亀甲に花菱」「七宝に霞華・重ね立涌」）
  NY.designName = function (d) {
    const lat = NY.LATTICES[d.lattice];
    let name = lat ? lat.label.replace(/（.*?）/, '') : '';
    if (d.lattice === 'scatter') name = '';
    if (d.motif) name = name ? name + 'に' + d.motif.label : d.motif.label + '散らし';
    if (d.overlay && NY.LATTICES[d.overlay.lattice]) {
      name += '・重ね' + NY.LATTICES[d.overlay.lattice].label.replace(/（.*?）/, '');
    }
    return name || '無地';
  };
})();
