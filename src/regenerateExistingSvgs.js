import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchArxivPapers } from './arxiv.js';
import { writeTopicSvg } from './svg.js';

const REPORT_DIR = path.resolve('data/reports');

async function main() {
  const files = (await readdir(REPORT_DIR))
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort();

  for (const file of files) {
    const reportPath = path.join(REPORT_DIR, file);
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const date = report.date || file.slice(0, 10);

    for (const topicReport of Object.values(report.topics || {})) {
      const trendPapers = await fetchArxivPapers(topicReport.topic, {
        maxResults: Number(process.env.ARXIV_TREND_MAX_RESULTS || 80),
        lookbackDays: Number(process.env.ARXIV_TREND_LOOKBACK_DAYS || 180)
      });
      topicReport.image = await writeTopicSvg(
        date,
        topicReport.topic,
        topicReport.summary,
        topicReport.papers || [],
        trendPapers
      );
    }

    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`updated ${date}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
