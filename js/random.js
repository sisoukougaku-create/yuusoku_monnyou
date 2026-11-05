// =============================================================
// random.js — 「シード（種）付きの乱数」を作るファイル
// -------------------------------------------------------------
// Math.random() は毎回ちがう値を返すので、同じ文様を
// もう一度作り直すことができません。
// そこで「シード（数字）」を決めると、毎回まったく同じ順番で
// 乱数が出てくる仕組み（mulberry32 という計算方法）を使います。
// 同じシード → 同じ文様 が再現できるようになります。
// =============================================================

// アプリ全体で使う入れ物（名前空間）。NY = Neo Yusoku の略
window.NY = window.NY || {};

NY.createRandom = function (seed) {
  let a = seed >>> 0; // 0以上の整数にそろえる

  // 0以上1未満の小数を1つ返す（mulberry32）
  function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next: next,
    // min 以上 max 未満の小数
    range: function (min, max) {
      return min + next() * (max - min);
    },
    // min 以上 max 以下の整数
    int: function (min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    // 配列の中から1つ選ぶ
    pick: function (list) {
      return list[Math.floor(next() * list.length)];
    },
    // 確率 p で true になる（p=0.3 なら 30%）
    chance: function (p) {
      return next() < p;
    },
  };
};

// 新しいシードをランダムに作る
NY.newSeed = function () {
  return Math.floor(Math.random() * 1000000000);
};
