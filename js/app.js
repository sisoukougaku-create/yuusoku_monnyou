// =============================================================
// app.js — 画面の操作（ボタン・スライダー）とデザインをつなぐ
// -------------------------------------------------------------
// 考え方はシンプルです。
//   1. 今のデザインを state という変数に1つだけ持つ
//   2. スライダーなどが動いたら state を書き換える
//   3. render() で state から絵を描き直す
// =============================================================

(function () {
  const PREVIEW_SIZE = 800; // プレビューの座標の大きさ

  // 今のデザイン（アプリの「状態」）
  let state = NY.clone(NY.PRESETS[0]);
  // 「組み合わせ」で選べるよう、生成した文様を覚えておく
  let generatedMotif = null;

  // よく使う「id から要素を取る」処理を短く書くための関数
  function $(id) {
    return document.getElementById(id);
  }

  // ---- 描画 --------------------------------------------------
  function render() {
    $('preview').innerHTML = NY.renderDesign(state, PREVIEW_SIZE, 'main');
    $('designName').textContent = state.name || NY.designName(state);
    $('designSeed').textContent = state.seed !== null && state.seed !== undefined ? 'seed: ' + state.seed : '';
  }

  // state の値を、画面のスライダーなどに反映する
  function syncControls() {
    setRange('scale', state.scale);
    setRange('rotation', state.rotation, '°');
    setRange('lineWidth', state.lineWidth);
    $('double').checked = !!state.double;

    const m = state.motif;
    $('motifControls').disabled = !m;
    setRange('motifSize', state.motifSize);
    setRange('motifRotate', state.motifRotate || 0, '°');
    setRange('petalCount', m ? m.n : 4);
    const mainLayer = m && m.layers.find(function (l) { return !l.outline; });
    $('petalShape').value = mainLayer ? mainLayer.shape : 'heart';
    $('petalShape').disabled = !mainLayer;

    $('paletteSelect').value = NY.PALETTES.some(function (p) { return p.name === state.paletteName; })
      ? state.paletteName : '';
    ['bg', 'line', 'motif', 'accent'].forEach(function (key) {
      $('color-' + key).value = state.palette[key];
    });

    // 組み合わせタブ
    $('latticeSelect').value = state.lattice;
    $('motifSelect').value = currentMotifKey();
    $('overlaySelect').value = state.overlay ? state.overlay.lattice : '';
    $('overlayControls').hidden = !state.overlay;
    if (state.overlay) {
      setRange('overlayScale', state.overlay.scale);
      setRange('overlayRotation', state.overlay.rotation, '°');
      setRange('overlayOpacity', state.overlay.opacity);
    }
  }

  // スライダーと、その横の数字表示をまとめて更新
  function setRange(id, value, unit) {
    $(id).value = value;
    const out = $(id + 'Out');
    if (out) out.textContent = value + (unit || '');
  }

  // 今の文様が伝統文様のどれか（名前で判定）
  function currentMotifKey() {
    if (!state.motif) return '';
    const key = Object.keys(NY.MOTIFS).find(function (k) {
      return NY.MOTIFS[k].label === state.motif.label;
    });
    return key || 'generated';
  }

  // 値を変えたら名前もつけ直して再描画
  function update() {
    state.name = NY.designName(state);
    render();
  }

  // ---- 選択肢（<select>）を作る ------------------------------
  function fillSelect(select, items) {
    select.innerHTML = '';
    items.forEach(function (item) {
      const op = document.createElement('option');
      op.value = item[0];
      op.textContent = item[1];
      select.appendChild(op);
    });
  }

  function buildSelects() {
    const lattices = Object.keys(NY.LATTICES).map(function (k) { return [k, NY.LATTICES[k].label]; });
    fillSelect($('latticeSelect'), lattices);
    fillSelect($('overlaySelect'), [['', 'なし']].concat(lattices.filter(function (l) { return l[0] !== 'scatter'; })));
    refreshMotifSelect();
    fillSelect($('petalShape'), Object.keys(NY.PETAL_SHAPES).map(function (k) { return [k, NY.PETAL_SHAPES[k]]; }));
    fillSelect($('paletteSelect'), [['', '（カスタム）']].concat(NY.PALETTES.map(function (p) {
      return [p.name, p.name + '（' + p.season + '）'];
    })));
  }

  function refreshMotifSelect() {
    const items = [['', 'なし']].concat(Object.keys(NY.MOTIFS).map(function (k) { return [k, NY.MOTIFS[k].label]; }));
    if (generatedMotif) items.push(['generated', '生成した文様：' + generatedMotif.label]);
    fillSelect($('motifSelect'), items);
  }

  // ---- プリセット一覧（アレンジタブ） ------------------------
  function buildPresets() {
    const list = $('presetList');
    NY.PRESETS.forEach(function (p, i) {
      const btn = document.createElement('button');
      btn.className = 'preset';
      btn.innerHTML = NY.renderDesign(p, 320, 'preset' + i) + '<span>' + p.name + '</span>';
      btn.addEventListener('click', function () {
        state = NY.clone(p);
        syncControls();
        render();
        $('variations').innerHTML = '';
      });
      list.appendChild(btn);
    });
  }

  // ---- バリエーション ----------------------------------------
  function showVariations(designs) {
    const box = $('variations');
    box.innerHTML = '';
    designs.forEach(function (d, i) {
      const btn = document.createElement('button');
      btn.className = 'variation';
      btn.innerHTML = NY.renderDesign(d, 400, 'var' + i + '-' + Date.now()) + '<span>' + d.name + '</span>';
      btn.addEventListener('click', function () {
        state = NY.clone(d);
        rememberGenerated();
        syncControls();
        render();
      });
      box.appendChild(btn);
    });
  }

  // 新しく生成された文様なら「組み合わせ」で選べるように覚える
  function rememberGenerated() {
    if (state.motif && currentMotifKey() === 'generated') {
      generatedMotif = NY.clone(state.motif);
      refreshMotifSelect();
    }
  }

  function makeMutations() {
    const list = [];
    for (let i = 0; i < 6; i++) {
      list.push(NY.mutateDesign(state, NY.newSeed(), 0.25 + i * 0.1));
    }
    showVariations(list);
  }

  function generate(seed) {
    const bold = parseFloat($('boldness').value);
    state = NY.randomDesign(seed, bold);
    $('seedInput').value = seed;
    rememberGenerated();
    syncControls();
    render();
    // ほかの候補も6つ見せる（シード+1〜+6）
    const list = [];
    for (let i = 1; i <= 6; i++) list.push(NY.randomDesign(seed + i, bold));
    showVariations(list);
  }

  // ---- 保存 --------------------------------------------------
  function download(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function fileBase() {
    return 'neo-yusoku-' + (state.name || 'pattern').replace(/[\\/:*?"<>|\s]/g, '_');
  }

  function saveSVG() {
    const svg = NY.renderDesign(state, PREVIEW_SIZE, 'export');
    download(new Blob([svg], { type: 'image/svg+xml' }), fileBase() + '.svg');
  }

  // SVG を一度画像として読み込み、キャンバスに描いて PNG にする
  function savePNG() {
    const px = 2000;
    const svg = NY.renderDesign(state, PREVIEW_SIZE, 'export', px);
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = px;
      canvas.height = px;
      canvas.getContext('2d').drawImage(img, 0, 0, px, px);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (blob) { download(blob, fileBase() + '.png'); }, 'image/png');
    };
    img.src = url;
  }

  // ---- イベント（操作）を登録 --------------------------------
  function onRange(id, apply, unit) {
    $(id).addEventListener('input', function (e) {
      const v = parseFloat(e.target.value);
      apply(v);
      const out = $(id + 'Out');
      if (out) out.textContent = v + (unit || '');
      update();
    });
  }

  function bindEvents() {
    // タブの切り替え
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        document.querySelectorAll('.tab-body').forEach(function (b) { b.hidden = b.dataset.body !== tab.dataset.tab; });
      });
    });

    // 共通の調整
    onRange('scale', function (v) { state.scale = v; });
    onRange('rotation', function (v) { state.rotation = v; }, '°');
    onRange('lineWidth', function (v) { state.lineWidth = v; });
    $('double').addEventListener('change', function (e) { state.double = e.target.checked; update(); });

    onRange('motifSize', function (v) { state.motifSize = v; });
    onRange('motifRotate', function (v) { state.motifRotate = v; }, '°');
    onRange('petalCount', function (v) { if (state.motif) state.motif.n = v; });
    $('petalShape').addEventListener('change', function (e) {
      if (!state.motif) return;
      const layer = state.motif.layers.find(function (l) { return !l.outline; });
      if (layer) layer.shape = e.target.value;
      update();
    });

    // 配色
    $('paletteSelect').addEventListener('change', function (e) {
      if (!e.target.value) return;
      const p = NY.findPalette(e.target.value);
      state.paletteName = p.name;
      state.palette = NY.clone(p.colors);
      syncControls();
      update();
    });
    ['bg', 'line', 'motif', 'accent'].forEach(function (key) {
      $('color-' + key).addEventListener('input', function (e) {
        state.palette[key] = e.target.value;
        state.paletteName = '';
        $('paletteSelect').value = '';
        update();
      });
    });

    // 組み合わせ
    $('latticeSelect').addEventListener('change', function (e) { state.lattice = e.target.value; update(); });
    $('motifSelect').addEventListener('change', function (e) {
      const v = e.target.value;
      if (v === '') state.motif = null;
      else if (v === 'generated') state.motif = NY.clone(generatedMotif);
      else state.motif = NY.clone(NY.MOTIFS[v]);
      syncControls();
      update();
    });
    $('overlaySelect').addEventListener('change', function (e) {
      const v = e.target.value;
      if (!v) state.overlay = null;
      else if (state.overlay) state.overlay.lattice = v;
      else state.overlay = { lattice: v, scale: 90, rotation: 0, opacity: 0.4 };
      syncControls();
      update();
    });
    onRange('overlayScale', function (v) { if (state.overlay) state.overlay.scale = v; });
    onRange('overlayRotation', function (v) { if (state.overlay) state.overlay.rotation = v; }, '°');
    onRange('overlayOpacity', function (v) { if (state.overlay) state.overlay.opacity = v; });

    // 新規生成
    onRange('boldness', function () {});
    $('generateBtn').addEventListener('click', function () { generate(NY.newSeed()); });
    $('seedGenerateBtn').addEventListener('click', function () {
      const s = parseInt($('seedInput').value, 10);
      generate(isNaN(s) ? NY.newSeed() : s);
    });

    // 保存・派生
    $('saveSvgBtn').addEventListener('click', saveSVG);
    $('savePngBtn').addEventListener('click', savePNG);
    $('variationBtn').addEventListener('click', makeMutations);
  }

  // ---- はじめに1回だけ実行 -----------------------------------
  buildSelects();
  buildPresets();
  bindEvents();
  $('boldnessOut').textContent = $('boldness').value;
  $('seedInput').value = NY.newSeed();
  syncControls();
  render();
})();
