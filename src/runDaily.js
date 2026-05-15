import { runDailyUpdate } from './dailyUpdate.js';

const result = await runDailyUpdate();
console.log(JSON.stringify({ ok: true, date: result.date, topicCount: result.topics.length }, null, 2));
