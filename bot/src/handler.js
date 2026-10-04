// Мозг бота: получает обновление Telegram, решает, что делать. Без сети внутри — всё приходит через deps.
import { isOwner } from './guard.js';
import { parse } from './parse.js';
import { addToInbox, readBrainFile, syncBrain } from './brain.js';
import { planPc, planCode } from './pc.js';

export const HELP = `Я Джарвис. Что умею:
• просто напиши текст — запишу во входящие
• /сегодня — твои задачи
• /ask вопрос — спросить Claude (он знает твои цели)
• /pc имя — команда на компьютере из белого списка
• /code папка задача — Claude Code на компьютере (если включено)
Всё опасное идёт только после кнопки «Да».`;

export function createHandler(deps) {
  const { ownerChatId, dir, tg, run, pending, askFn, allowlist, code, now = () => new Date() } = deps;

  async function confirm(chatId, plan) {
    const id = pending.add(plan);
    await tg.send(chatId, `Выполнить?\n${plan.title}`, {
      reply_markup: { inline_keyboard: [[{ text: 'Да', callback_data: `y:${id}` }, { text: 'Нет', callback_data: `n:${id}` }]] },
    });
  }

  return async function handle(update) {
    if (!isOwner(update, ownerChatId)) return; // чужим не отвечаем вообще
    const chatId = ownerChatId;

    if (update.callback_query) {
      const q = update.callback_query;
      await tg.answerCallback(q.id);
      const [answer, id] = String(q.data).split(':');
      const plan = pending.take(id);
      if (!plan) return tg.send(chatId, 'Время вышло или уже выполнено. Отправь команду заново.');
      if (answer !== 'y') return tg.send(chatId, 'Отменено.');
      try {
        const out = await run(plan.cmd, plan.args, plan.cwd, { timeoutMs: plan.timeoutMs });
        return tg.send(chatId, out.trim() || 'Готово, вывода нет.');
      } catch (e) {
        return tg.send(chatId, `Ошибка: ${e.message}`);
      }
    }

    const { cmd, rest } = parse(update.message?.text);
    try {
      switch (cmd) {
        case 'start': case 'help': case 'помощь':
          return tg.send(chatId, HELP);
        case 'note':
          if (!rest) return;
          await addToInbox(dir, rest, now());
          await syncBrain(dir, 'Запись из Telegram', run).catch(() => {});
          return tg.send(chatId, 'Записал во входящие.');
        case 'сегодня': case 'today':
          return tg.send(chatId, (await readBrainFile(dir, 'задачи.md')).trim() || 'Задач нет.');
        case 'ask':
          if (!rest) return tg.send(chatId, 'Напиши вопрос после /ask');
          return tg.send(chatId, await askFn(rest));
        case 'pc': {
          const plan = planPc(rest, allowlist, dir);
          return plan.error ? tg.send(chatId, plan.error) : confirm(chatId, plan);
        }
        case 'code': {
          const plan = planCode(rest, code);
          return plan.error ? tg.send(chatId, plan.error) : confirm(chatId, plan);
        }
        default:
          return tg.send(chatId, `Не знаю команду /${cmd}. Напиши /help`);
      }
    } catch (e) {
      return tg.send(chatId, `Не получилось: ${e.message}`);
    }
  };
}
