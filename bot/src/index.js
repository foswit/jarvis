import 'dotenv/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTelegram } from './telegram.js';
import { createHandler } from './handler.js';
import { createPending, loadAllowlist } from './pc.js';
import { ask } from './ask.js';
import { run } from './exec.js';

const here = dirname(fileURLToPath(import.meta.url));
const env = process.env;
const must = (k) => { if (!env[k]) { console.error(`Не задано ${k}. Открой .env и впиши (см. README).`); process.exit(1); } return env[k]; };

const token = must('TELEGRAM_BOT_TOKEN');
const ownerChatId = must('TELEGRAM_CHAT_ID');
const dir = resolve(env.JARVIS_DIR || resolve(here, '../..'));
const tg = createTelegram(token);

// Папки, в которых разрешён /code: имя → путь. Меняй под себя.
const code = { enabled: env.ENABLE_CODE === '1', folders: { jarvis: dir } };

const handle = createHandler({
  ownerChatId, dir, tg, run, code,
  pending: createPending(),
  allowlist: await loadAllowlist(resolve(here, '../commands.json')),
  askFn: (q) => ask(q, { dir, apiKey: env.ANTHROPIC_API_KEY, model: env.JARVIS_MODEL }),
});

console.log(`Джарвис слушает. Папка мозга: ${dir}`);
let offset = 0;
for (;;) {
  try {
    for (const u of await tg.getUpdates(offset)) {
      offset = u.update_id + 1;
      await handle(u);
    }
  } catch (e) {
    console.error('Сбой, пробую снова через 5 секунд:', e.message);
    await new Promise((r) => setTimeout(r, 5000));
  }
}
