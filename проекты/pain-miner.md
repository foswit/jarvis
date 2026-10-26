# pain-miner

Агент поиска бизнес-идеи через боли польского рынка. Стартовая ниша: малые транспортные фирмы / spedycja.
Код: репозиторий life-bot, папка `pain-miner/` (ветка `pain-miner-step1`). Результаты приходят в Telegram тем же ботом, что и life-bot.

## Статус
- [x] Шаг 1: каркас, SQLite, collect из `manual/`
- [x] Reddit убран: публичный Data API закрывают (новые заявки до 31.10.2026, полностью в марте 2027)
- [x] Источники-плагины: rss (Google News pl + свои ленты), hn, youtube, mastodon. Код проверен на подставных ответах, живьём нет
- [x] Шаг 2: extract (Claude Haiku, нужен ANTHROPIC_API_KEY), проверен с подставным ответом
- [ ] Дальше: cluster, dashboard, потом score, outreach, responses, weekly report
- [ ] Ещё источники: отзывы Google Play, Google Trends, вакансии (Adzuna), Wykop, форумы по RSS

## Правила проекта
Только официальные API и публичные данные. Ников не храним, почту и телефоны вырезаем. Ключи только в `.env`. Публикую сам.
