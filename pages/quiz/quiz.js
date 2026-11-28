const { questions } = require('../../data/questions.js');
const store = require('../../utils/store.js');
const { mdLite } = require('../../utils/md.js');
const feedback = require('../../utils/feedback.js');

const NO = {};
questions.forEach((q, i) => { NO[q.id] = i + 1; });

const SIZES = [5, 10, 15];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 组一轮题：优先没刷过的，其次待复习，最后才是已掌握的
function pickRound(n) {
  const map = store.getProgress();
  const todo = [];
  const review = [];
  const known = [];
  questions.forEach(q => {
    const st = map[q.id];
    if (st === 'known') known.push(q);
    else if (st === 'review') review.push(q);
    else todo.push(q);
  });
  const pool = shuffle(todo).concat(shuffle(review), shuffle(known)).slice(0, n);
  return pool.map(q => ({
    id: q.id,
    no: NO[q.id],
    q: q.q,
    a: mdLite(q.a),
    catName: q.catName,
    levelName: store.LEVELS[q.level],
    state: store.stateOf(map, q.id),
    showA: false,
  }));
}

Page({
  data: {
    sizes: SIZES,
    size: 10,
    phase: 'idle', // idle | playing | done
    queue: [],
    idx: 0,
    counts: { known: 0, review: 0 },
  },

  onSize(e) {
    this.setData({ size: Number(e.currentTarget.dataset.n) });
  },

  onStart() {
    feedback.tap();
    const queue = pickRound(this.data.size);
    if (!queue.length) {
      wx.showToast({ title: '题库是空的', icon: 'none' });
      return;
    }
    this.setData({ phase: 'playing', queue, idx: 0, counts: { known: 0, review: 0 } });
  },

  onReveal() {
    feedback.tap();
    const idx = this.data.idx;
    this.setData({ [`queue[${idx}].showA`]: true });
  },

  onMark(e) {
    const st = e.currentTarget.dataset.st; // known | review
    const cur = this.data.queue[this.data.idx];
    if (!cur) return;
    // 记住了给个喜庆音效（震动保留）；本来就是已掌握再点则不重播
    if (st === 'known' && cur.state !== 'known') feedback.cheer();
    feedback.tap();
    store.setState(cur.id, st);
    const counts = this.data.counts;
    const next = { known: counts.known + (st === 'known' ? 1 : 0), review: counts.review + (st === 'review' ? 1 : 0) };
    const idx = this.data.idx;
    if (idx + 1 >= this.data.queue.length) {
      this.setData({ phase: 'done', counts: next });
    } else {
      this.setData({ idx: idx + 1, counts: next });
    }
  },

  onRestart() {
    this.onStart();
  },

  onBackHome() {
    // 无 tabBar 后：面试结束直接退回上一页（题库）
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      this.setData({ phase: 'idle' });
    }
  },
})
