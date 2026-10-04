// Охранник: бот слушает ТОЛЬКО твой чат. Все остальные сообщения молча игнорируются.
// Почему так: любой может найти бота в Telegram и написать ему. Без этой проверки он
// выполнил бы команды чужого человека на твоём компьютере.

export function isOwner(update, ownerChatId) {
  const owner = String(ownerChatId || '').trim();
  if (!owner) return false; // не задан chat id → никого не пускаем
  const chat = update?.message?.chat ?? update?.callback_query?.message?.chat;
  const from = update?.message?.from ?? update?.callback_query?.from;
  // И чат, и отправитель должны совпасть: так бот не сработает, даже если его добавят в группу.
  return chat?.type === 'private' && String(chat.id) === owner && String(from?.id) === owner;
}
