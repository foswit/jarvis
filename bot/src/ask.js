// /ask: вопрос Claude с контекстом из мозга (правила, цели, задачи).
import { readBrainFile } from './brain.js';

const FILES = ['CLAUDE.md', 'цели.md', 'задачи.md'];

export async function buildContext(dir) {
  const parts = [];
  for (const f of FILES) {
    try { parts.push(`# ${f}\n${await readBrainFile(dir, f)}`); } catch { /* файла может не быть */ }
  }
  return parts.join('\n\n');
}

export async function ask(question, { dir, apiKey, model, clientFactory }) {
  const client = clientFactory ? clientFactory() : new (await import('@anthropic-ai/sdk')).default({ apiKey });
  const context = await buildContext(dir);
  const res = await client.messages.create({
    model: model || 'claude-sonnet-5-5',
    max_tokens: 1000,
    system: `Ты Джарвис, личный помощник Матвея. Отвечай по-русски, коротко и простыми словами. Вот его мозг:\n\n${context}`,
    messages: [{ role: 'user', content: question }],
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim() || 'Пустой ответ.';
}
