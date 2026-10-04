// Команды на компьютере. Два режима, оба только после кнопки «Да»:
//  /pc <имя>   — команда из белого списка commands.json
//  /code <папка> <задача> — Claude Code (claude -p) в папке из белого списка; по умолчанию выключено
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function loadAllowlist(file) {
  const raw = JSON.parse(await readFile(file, 'utf8'));
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_')));
}

// Превращает «/pc статус» в готовое действие или причину отказа.
export function planPc(name, allowlist, baseDir) {
  if (!name) return { error: `Что запустить? Доступно: ${Object.keys(allowlist).join(', ') || 'ничего'}` };
  const item = allowlist[name];
  if (!item) return { error: `«${name}» нет в белом списке. Доступно: ${Object.keys(allowlist).join(', ')}` };
  return {
    title: `${item.cmd} ${item.args.join(' ')}`,
    cmd: item.cmd, args: item.args, cwd: resolve(baseDir, item.cwd || '.'),
  };
}

// «/code box12-site сделай кнопку синей» → claude -p в папке box12-site.
export function planCode(rest, { enabled, folders }) {
  if (!enabled) return { error: '/code выключен. Чтобы включить, поставь ENABLE_CODE=1 в .env (читай предупреждение в README).' };
  const [folder, ...task] = rest.split(/\s+/);
  const prompt = task.join(' ').trim();
  if (!folder || !prompt) return { error: 'Формат: /code <папка> <задача>. Папки: ' + Object.keys(folders).join(', ') };
  if (!folders[folder]) return { error: `Папки «${folder}» нет в списке. Доступно: ${Object.keys(folders).join(', ')}` };
  return {
    title: `Claude Code в «${folder}»: ${prompt}`,
    cmd: 'claude', args: ['-p', prompt], cwd: folders[folder], timeoutMs: 600000,
  };
}

// Ждущие подтверждения действия. Живут 2 минуты, потом забываются.
export function createPending(ttlMs = 120000, now = () => Date.now()) {
  const map = new Map();
  return {
    add(action) {
      const id = Math.random().toString(36).slice(2, 10);
      map.set(id, { action, expires: now() + ttlMs });
      return id;
    },
    take(id) {
      const item = map.get(id);
      map.delete(id);
      return item && item.expires > now() ? item.action : null;
    },
  };
}
