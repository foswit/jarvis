// Работа с «мозгом» — папкой репозитория jarvis на этом компьютере.
import { appendFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export function stamp(now = new Date(), timeZone = 'Europe/Warsaw') {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(now);
  return parts; // «2026-10-04 20:15»
}

// Дописывает запись в входящие.md. Учитель потом разберёт их по папкам.
export async function addToInbox(dir, text, now = new Date()) {
  const line = `\n- ${stamp(now)}: ${text.replace(/\n+/g, ' ')}\n`;
  await appendFile(join(dir, 'входящие.md'), line, 'utf8');
}

export async function readBrainFile(dir, name) {
  return readFile(join(dir, name), 'utf8');
}

// Сохраняет изменения в GitHub, чтобы запись была видна и с телефона, и в других сессиях Claude.
// run — функция запуска команд (в тестах подменяется).
export async function syncBrain(dir, message, run) {
  await run('git', ['add', '-A'], dir);
  const status = await run('git', ['status', '--porcelain'], dir);
  if (!status.trim()) return false;
  await run('git', ['commit', '-m', message], dir);
  await run('git', ['pull', '--rebase', '--autostash'], dir);
  await run('git', ['push'], dir);
  return true;
}
