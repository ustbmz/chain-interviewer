// 轻触反馈：所有按钮点击时调用（iOS 分档，Android 统一短震）
function tap(type = 'medium') {
  wx.vibrateShort({ type });
}

module.exports = { tap };
