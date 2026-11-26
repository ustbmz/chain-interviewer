// utils/md.js —— 题库答案的轻量 markdown 清洗
// 答案源文件是 markdown（`code`、**加粗**、[链接](url)），
// 小程序里用纯文本渲染，这里把标记剥掉、保留换行。
function mdLite(s) {
  if (!s) return '';
  return String(s)
    .replace(/```[a-zA-Z]*\n/g, '')
    .replace(/```/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
}

module.exports = { mdLite };
