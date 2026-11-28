// 轻触反馈：所有按钮点击时调用（iOS 分档，Android 统一短震）
function tap(type = 'medium') {
  wx.vibrateShort({ type });
}

// 喜庆音效：标记「已掌握」时播放（两颗快速小铃，0.45s）
let cheerCtx = null;
function cheer() {
  if (!cheerCtx) {
    cheerCtx = wx.createInnerAudioContext();
    cheerCtx.src = '/assets/audio/cheer.m4a';
    cheerCtx.volume = 0.3;
  }
  cheerCtx.stop();
  cheerCtx.play();
}

module.exports = { tap, cheer };
