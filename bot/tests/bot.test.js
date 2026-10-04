import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isOwner } from '../src/guard.js';
import { parse } from '../src/parse.js';
import { createHandler } from '../src/handler.js';
import { createPending, planPc, planCode } from '../src/pc.js';

const OWNER = '111';
const msg = (text, id = 111, type = 'private') => ({ update_id: 1, message: { text, chat: { id, type }, from: { id } } });

async function setup(extra = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'jarvis-'));
  await writeFile(join(dir, 'задачи.md'), '# Задачи\n- [ ] выложить сайт');
  await writeFile(join(dir, 'входящие.md'), '# Входящие\n');
  const sent = []; const ran = [];
  const tg = { send: async (c, t, e) => sent.push({ c, t, e }), answerCallback: async () => {} };
  const run = async (cmd, args, cwd) => { ran.push([cmd, ...args]); return cmd === 'git' && args[0] === 'status' && args[1] === '--porcelain' ? ' M x' : 'вывод'; };
  const handle = createHandler({
    ownerChatId: OWNER, dir, tg, run, pending: createPending(),
    askFn: async (q) => `ответ на: ${q}`,
    allowlist: { статус: { cmd: 'git', args: ['status'], cwd: '.' } },
    code: { enabled: false, folders: { jarvis: dir } }, ...extra,
  });
  return { dir, sent, ran, handle };
}

test('охранник: только владелец в личном чате', () => {
  assert.equal(isOwner(msg('x'), OWNER), true);
  assert.equal(isOwner(msg('x', 222), OWNER), false);
  assert.equal(isOwner(msg('x', 111, 'group'), OWNER), false);
  assert.equal(isOwner(msg('x'), ''), false);
  assert.equal(isOwner({}, OWNER), false);
});

test('parse: команды и обычный текст', () => {
  assert.deepEqual(parse('/ask что учить?'), { cmd: 'ask', rest: 'что учить?' });
  assert.deepEqual(parse('/сегодня'), { cmd: 'сегодня', rest: '' });
  assert.deepEqual(parse('/pc@jarvis_bot статус'), { cmd: 'pc', rest: 'статус' });
  assert.deepEqual(parse('учил flex'), { cmd: 'note', rest: 'учил flex' });
});

test('чужой человек не получает ответа и ничего не запускается', async () => {
  const { handle, sent, ran } = await setup();
  await handle(msg('/pc статус', 999));
  assert.equal(sent.length, 0); assert.equal(ran.length, 0);
});

test('обычный текст попадает во входящие и коммитится', async () => {
  const { handle, sent, ran, dir } = await setup();
  await handle(msg('сегодня учил grid 40 минут'));
  assert.match(await readFile(join(dir, 'входящие.md'), 'utf8'), /сегодня учил grid 40 минут/);
  assert.equal(sent.at(-1).t, 'Записал во входящие.');
  assert.ok(ran.some((c) => c[0] === 'git' && c[1] === 'push'));
});

test('/сегодня показывает задачи, /ask зовёт Claude', async () => {
  const { handle, sent } = await setup();
  await handle(msg('/сегодня'));
  assert.match(sent.at(-1).t, /выложить сайт/);
  await handle(msg('/ask с чего начать?'));
  assert.equal(sent.at(-1).t, 'ответ на: с чего начать?');
});

test('/pc не запускается без «Да»; «Да» запускает; «Нет» отменяет', async () => {
  const { handle, sent, ran } = await setup();
  await handle(msg('/pc статус'));
  assert.equal(ran.length, 0);
  const [yes, no] = sent.at(-1).e.reply_markup.inline_keyboard[0];
  await handle({ update_id: 2, callback_query: { id: 'c', data: no.callback_data, from: { id: 111 }, message: { chat: { id: 111, type: 'private' } } } });
  assert.equal(sent.at(-1).t, 'Отменено.'); assert.equal(ran.length, 0);
  await handle(msg('/pc статус'));
  const [yes2] = sent.at(-1).e.reply_markup.inline_keyboard[0];
  await handle({ update_id: 3, callback_query: { id: 'c', data: yes2.callback_data, from: { id: 111 }, message: { chat: { id: 111, type: 'private' } } } });
  assert.deepEqual(ran, [['git', 'status']]);
  assert.equal(sent.at(-1).t, 'вывод');
});

test('/pc: команды вне белого списка отклоняются', () => {
  const al = { статус: { cmd: 'git', args: ['status'] } };
  assert.match(planPc('rm -rf ~', al, '/x').error, /нет в белом списке/);
  assert.equal(planPc('статус', al, '/x').cmd, 'git');
});

test('/code выключен по умолчанию, папки только из списка', () => {
  assert.match(planCode('jarvis сделай', { enabled: false, folders: {} }).error, /выключен/);
  const on = { enabled: true, folders: { jarvis: '/j' } };
  assert.match(planCode('/etc сделай', on).error, /нет в списке/);
  assert.equal(planCode('jarvis сделай кнопку', on).args[1], 'сделай кнопку');
});

test('кнопка «Да» живёт ограниченное время и срабатывает один раз', () => {
  let t = 0; const p = createPending(1000, () => t);
  const id = p.add({ a: 1 });
  assert.deepEqual(p.take(id), { a: 1 });
  assert.equal(p.take(id), null);
  const id2 = p.add({ a: 2 }); t = 5000;
  assert.equal(p.take(id2), null);
});
