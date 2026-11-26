const { categories, questions } = require('../../data/questions.js');
const store = require('../../utils/store.js');
const { mdLite } = require('../../utils/md.js');
const feedback = require('../../utils/feedback.js');

// 题号（按题库顺序，与文档编号一致）
const NO = {};
questions.forEach((q, i) => { NO[q.id] = i + 1; });

const CAT_CHIPS = [{ id: 'all', name: '全部', count: questions.length }]
  .concat(categories.map(c => ({ id: c.id, name: c.name, count: c.count })));

Page({
  data: {
    cats: CAT_CHIPS,
    activeCat: 'all',
    list: [],      // 当前筛选下的题目序列
    curIdx: 0,     // 当前显示第几题
    cur: null,     // 当前题（渲染用）
    anim: '',      // 切题方向动画：next | prev | ''
    stats: { total: 0, known: 0, review: 0, todo: 0, pct: 0 },
    scrollTop: 0,
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    // 从模拟面试回来时进度可能已变化
    this.refresh(true);
  },

  buildList() {
    const map = store.getProgress();
    const { activeCat } = this.data;
    return questions
      .filter(q => activeCat === 'all' || q.cat === activeCat)
      .map(q => ({
        id: q.id,
        no: NO[q.id],
        q: q.q,
        a: mdLite(q.a),
        levelName: store.LEVELS[q.level],
        catName: q.catName,
        color: store.CAT_COLORS[q.cat] || '#57606a',
        state: store.stateOf(map, q.id),
      }));
  },

  refresh(keepIdx = false) {
    const list = this.buildList();
    // 保留位置时按 id 对齐；否则回到第一题
    let idx = 0;
    if (keepIdx && this.data.cur) {
      const hit = list.findIndex(item => item.id === this.data.cur.id);
      if (hit >= 0) idx = hit;
    }
    this.setData({
      list,
      curIdx: idx,
      cur: list[idx] || null,
      stats: store.statsOf(questions, store.getProgress()),
    });
  },

  show(idx) {
    const { list, curIdx } = this.data;
    if (idx < 0 || idx >= list.length) return;
    const cur = { ...list[idx] };
    // 按方向滑入：去更大的题号=从右滑入，反之从左
    const anim = idx > curIdx ? 'next' : 'prev';
    // 切题后回到页面顶部（0 / 0.01 交替，保证 scroll-top 每次都生效）
    const top = this.data.scrollTop === 0 ? 0.01 : 0;
    this.setData({ curIdx: idx, cur, scrollTop: top, anim });
    // 动画播完清掉标记，后续原地更新（如标记掌握）不会重播动画
    if (this._animTimer) clearTimeout(this._animTimer);
    this._animTimer = setTimeout(() => this.setData({ anim: '' }), 260);
  },

  onCat(e) {
    feedback.tap();
    this.setData({ activeCat: e.currentTarget.dataset.id });
    this.refresh();
  },

  onQuiz() {
    feedback.tap();
    wx.navigateTo({ url: '/pages/quiz/quiz' });
  },

  onMark(e) {
    feedback.tap();
    const { id, st } = e.currentTarget.dataset;
    store.setState(id, st === 'none' ? '' : st);
    // 更新当前题状态 + 顶部总进度统计
    const map = store.getProgress();
    const list = this.buildList();
    const idx = this.data.curIdx;
    this.setData({
      cur: list[idx],
      list,
      stats: store.statsOf(questions, map),
    });
  },

  // 左右滑动切题：右划=上一步，左划=下一步（只在题目卡区域内生效，
  // 最后一题左划不跳「我的」——跳页是显式按钮行为，避免误触）
  onTouchStart(e) {
    const t = e.touches[0];
    this._touch = { x: t.clientX, y: t.clientY };
  },

  onTouchEnd(e) {
    if (!this._touch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this._touch.x;
    const dy = t.clientY - this._touch.y;
    this._touch = null;
    // 水平位移够大、且明显大于垂直位移才算滑动
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const { curIdx, list } = this.data;
    if (dx < 0 && curIdx < list.length - 1) {
      feedback.tap();
      this.show(curIdx + 1);
    } else if (dx > 0 && curIdx > 0) {
      feedback.tap();
      this.show(curIdx - 1);
    }
  },

  onPrev() {
    if (this.data.curIdx === 0) return;
    feedback.tap();
    if (this.data.curIdx > 0) this.show(this.data.curIdx - 1);
  },

  onNext() {
    feedback.tap();
    if (this.data.curIdx < this.data.list.length - 1) {
      this.show(this.data.curIdx + 1);
    } else {
      // 刷完当前分类的最后一题 → 去我的页看总进度
      wx.navigateTo({ url: '/pages/me/me' });
    }
  },
})
