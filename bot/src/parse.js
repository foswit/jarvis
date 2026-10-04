// Разбирает текст сообщения на команду и остаток.
// «/ask что мне учить?» → { cmd: 'ask', rest: 'что мне учить?' }
// «сегодня учил flex 40 минут» → { cmd: 'note', rest: 'сегодня учил flex 40 минут' }
export function parse(text) {
  const t = String(text ?? '').trim();
  const m = t.match(/^\/([\p{L}\d_]+)(?:@\w+)?\s*([\s\S]*)$/u);
  if (!m) return { cmd: 'note', rest: t };
  return { cmd: m[1].toLowerCase(), rest: m[2].trim() };
}
