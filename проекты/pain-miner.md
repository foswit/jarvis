# pain-miner

Агент поиска бизнес-идеи через боли польского рынка. Стартовая ниша: малые транспортные фирмы / spedycja.
Код: репозиторий life-bot, папка `pain-miner/` (ветка `pain-miner-step1`). Результаты приходят в Telegram тем же ботом, что и life-bot.

## Статус
- [x] Шаг 1: каркас, SQLite, collect из `manual/` и Reddit (Reddit не проверен: ждёт ключей)
- [ ] Заявка на Reddit API (reddit.com/prefs/apps, тип script; одобрение может занять дни)
- [ ] Шаги: extract, cluster, dashboard, потом score, outreach, responses, weekly report
- [ ] Другие источники по одному: HN, YouTube, Google Play, Trends, вакансии

## Правила проекта
Только официальные API и публичные данные. Ников не храним, почту и телефоны вырезаем. Ключи только в `.env`. Публикую сам.
