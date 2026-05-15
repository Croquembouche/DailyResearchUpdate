import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { TOPICS } from './topics.js';
import { readDailyReport } from './storage.js';
import { runDailyUpdate } from './dailyUpdate.js';
import { startScheduler } from './scheduler.js';

const app = Fastify({ logger: true });
const publicDir = path.resolve('public');

app.register(fastifyStatic, { root: publicDir, prefix: '/' });

app.get('/api/topics', async () => TOPICS);

app.get('/api/reports/latest', async () => readDailyReport());

app.get('/api/reports/:date', async (request) => readDailyReport(request.params.date));

app.post('/api/run-now', async () => {
  const result = await runDailyUpdate();
  return { ok: true, date: result.date, topicCount: result.topics.length };
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

startScheduler(app.log);
await app.listen({ port, host });
