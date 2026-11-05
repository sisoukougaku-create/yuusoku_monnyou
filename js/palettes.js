// =============================================================
// palettes.js — 配色（襲の色目 風）のリスト
// -------------------------------------------------------------
// 平安装束の「襲（かさね）の色目」をヒントにした配色です。
// 1つの配色は 4色 でできています。
//   bg     : 地の色（背景）
//   line   : 地紋の線の色
//   motif  : 文様（花菱など）の色
//   accent : 差し色（花の芯など）
// =============================================================

window.NY = window.NY || {};

NY.PALETTES = [
  { name: '桜',     season: '春', colors: { bg: '#fbf4f3', line: '#d9a3ae', motif: '#b5536f', accent: '#f0cdd4' } },
  { name: '紅梅',   season: '春', colors: { bg: '#f6e2e5', line: '#c8475e', motif: '#8e1f3a', accent: '#f3b6c0' } },
  { name: '山吹',   season: '春', colors: { bg: '#fbf1d6', line: '#e1a12a', motif: '#a3620f', accent: '#f6d77b' } },
  { name: '萌黄',   season: '春', colors: { bg: '#f2f3df', line: '#8aa34a', motif: '#55752a', accent: '#d4e09a' } },
  { name: '藤',     season: '夏', colors: { bg: '#eeeaf4', line: '#9b86be', motif: '#5e4a8a', accent: '#d9cdef' } },
  { name: '菖蒲',   season: '夏', colors: { bg: '#e8eee6', line: '#5d7f4d', motif: '#6a3e8c', accent: '#c7b5dd' } },
  { name: '縹',     season: '夏', colors: { bg: '#e6eef3', line: '#2e6e95', motif: '#1b3f5c', accent: '#a9cbe0' } },
  { name: '紅葉',   season: '秋', colors: { bg: '#f7e6d5', line: '#c4532d', motif: '#7e2a18', accent: '#eeb24f' } },
  { name: '檜皮',   season: '秋', colors: { bg: '#eadbcb', line: '#8b4a33', motif: '#5c2c1c', accent: '#c99a6b' } },
  { name: '雪の下', season: '冬', colors: { bg: '#ffffff', line: '#c9c3c0', motif: '#b54a5f', accent: '#e8bcc4' } },
  { name: '二藍',   season: '雑', colors: { bg: '#2c2947', line: '#8a73b4', motif: '#d7c9ec', accent: '#e6a5b9' } },
  { name: '墨金',   season: 'Neo', colors: { bg: '#1c1b19', line: '#b8954a', motif: '#e3c77a', accent: '#8f2d2d' } },
  { name: '月白藍', season: 'Neo', colors: { bg: '#0f2233', line: '#3f7ea6', motif: '#e9eef2', accent: '#d9b44a' } },
  { name: '蛍光桜', season: 'Neo', colors: { bg: '#141018', line: '#ff5fa2', motif: '#7df9ff', accent: '#fff36b' } },
];

// 名前から配色を探す
NY.findPalette = function (name) {
  return NY.PALETTES.find(function (p) { return p.name === name; }) || NY.PALETTES[0];
};
