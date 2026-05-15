import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve('data/reports');

export function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function reportPath(date) {
  return path.join(DATA_DIR, `${date}.json`);
}

export async function readDailyReport(date = dateKey()) {
  try {
    return JSON.parse(await readFile(reportPath(date), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { date, generatedAt: null, topics: {} };
    throw error;
  }
}

export async function writeDailyReport(report) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(reportPath(report.date), `${JSON.stringify(report, null, 2)}\n`);
}

export async function saveTopicReport(date, topicReport) {
  const report = await readDailyReport(date);
  report.date = date;
  report.generatedAt = new Date().toISOString();
  report.topics[topicReport.topic.id] = topicReport;
  await writeDailyReport(report);
  return report;
}
