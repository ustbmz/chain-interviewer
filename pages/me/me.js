const { categories, questions } = require('../../data/questions.js');
const store = require('../../utils/store.js');
const feedback = require('../../utils/feedback.js');

Page({
  data: {
    stats: { total: 0, known: 0, review: 0, todo: 0, pct: 0 },
    cats: [],
  },

  onShow() {
    this.refresh();
  },

  onBack() {
    feedback.tap();
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.navigateTo({ url: '/pages/bank/bank' });
    }
  },

  refresh() {
    const map = store.getProgress();
    const cats = categories.map(c => {
      const s = store.statsOfCat(questions, map, c.id);
      return {
        id: c.id,
        name: c.name,
        color: store.CAT_COLORS[c.id] || '#57606a',
        known: s.known,
        total: s.total,
        pct: s.pct,
        width: s.pct + '%',
      };
    });
    this.setData({ stats: store.statsOf(questions, map), cats });
  },

  onClear() {
    wx.showModal({
      title: '清空掌握进度',
      content: '所有「已掌握 / 待复习」标记都会被清除，无法恢复。确定要清空吗？',
      confirmText: '清空',
      confirmColor: '#cf222e',
      cancelText: '再想想',
      success: res => {
        if (!res.confirm) return;
        feedback.tap();
        try { wx.removeStorageSync(store.KEY); } catch (e) {}
        this.refresh();
        wx.showToast({ title: '已清空', icon: 'none' });
      },
    });
  },
})
