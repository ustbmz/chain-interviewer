// utils/store.js —— 掌握进度本地存储与统计
const KEY = 'ci_progress_v1';

const LEVELS = ['', '基础', '进阶', '深水'];

// 分类配色（与复习站面试中心一致）
const CAT_COLORS = {
  projects: '#cf222e',
  chain: '#1a7f37',
  ethtx: '#0969da',
  solidity: '#8250df',
  token: '#bf3989',
  security: '#9a6700',
  eng: '#0550ae',
  go: '#0f6e56',
  stake: '#1b7c83',
  univ2: '#e8590c',
  univ3: '#c2255c',
  auction: '#5f3dc4',
  pattern: '#57606a',
  eip: '#0b7285',
  geth: '#24292f',
};

function getProgress() {
  try {
    return wx.getStorageSync(KEY) || {};
  } catch (e) {
    return {};
  }
}

function save(map) {
  try {
    wx.setStorageSync(KEY, map);
  } catch (e) {
    // 存储异常时静默，进度丢了也不影响刷题
  }
}

// state: 'known' | 'review' | ''(清除)
function setState(id, state) {
  const map = getProgress();
  if (state) {
    map[id] = state;
  } else {
    delete map[id];
  }
  save(map);
  return map;
}

function stateOf(map, id) {
  return (map && map[id]) || 'todo';
}

// 整卷统计
function statsOf(questions, map) {
  let known = 0;
  let review = 0;
  questions.forEach(q => {
    const st = stateOf(map, q.id);
    if (st === 'known') known++;
    else if (st === 'review') review++;
  });
  const total = questions.length;
  return { total, known, review, todo: total - known - review, pct: total ? Math.round((known / total) * 100) : 0 };
}

// 单分类统计
function statsOfCat(questions, map, catId) {
  return statsOf(questions.filter(q => q.cat === catId), map);
}

module.exports = {
  KEY,
  LEVELS,
  CAT_COLORS,
  getProgress,
  setState,
  stateOf,
  statsOf,
  statsOfCat,
};
