// Минимальная обёртка над Bot API. Токен в адресе — никогда не печатаем.
export function createTelegram(token, fetchFn = fetch) {
  const call = async (method, body, timeoutMs = 40000) => {
    const res = await fetchFn(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) throw new Error(`Telegram ${method}: HTTP ${res.status} ${data.description || ''}`.trim());
    return data.result;
  };
  return {
    getUpdates: (offset) => call('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] }, 45000),
    // Без parse_mode: текст ответа Claude или вывод команды не должен ломаться от символов < и &
    send: (chatId, text, extra = {}) => call('sendMessage', { chat_id: chatId, text: text.slice(0, 4000), ...extra }),
    answerCallback: (id) => call('answerCallbackQuery', { callback_query_id: id }),
  };
}
