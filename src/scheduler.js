import cron from 'node-cron';
import { runDailyUpdate } from './dailyUpdate.js';

export function startScheduler(logger = console) {
  const schedule = process.env.CRON_SCHEDULE || '0 6 * * *';
  const timezone = process.env.CRON_TIMEZONE || 'America/New_York';

  const task = cron.schedule(schedule, async () => {
    try {
      logger.info?.(`Starting scheduled arXiv update at ${new Date().toISOString()}`);
      await runDailyUpdate();
      logger.info?.('Scheduled arXiv update finished');
    } catch (error) {
      logger.error?.(error, 'Scheduled arXiv update failed');
    }
  }, { timezone });

  return task;
}
