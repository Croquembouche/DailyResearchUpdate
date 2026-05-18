import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchArxivPapers } from './arxiv.js';
import { summarizeWithCodex } from './codexSummarizer.js';
import { paperKey } from './storage.js';
import { writeTopicSvg } from './svg.js';

const REPORT_DIR = path.resolve('data/reports');

async function trendPapersFor(topic) {
  return fetchArxivPapers(topic, {
    maxResults: Number(process.env.ARXIV_TREND_MAX_RESULTS || 80),
    lookbackDays: Number(process.env.ARXIV_TREND_LOOKBACK_DAYS || 180)
  });
}

async function main() {
  const files = (await readdir(REPORT_DIR))
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort();
  const seenBeforeDate = new Set();
  let removedTotal = 0;

  for (const file of files) {
    const reportPath = path.join(REPORT_DIR, file);
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const date = report.date || file.slice(0, 10);
    const seenThisDate = new Set();
    let changed = false;
    let removedForDate = 0;

    for (const topicReport of Object.values(report.topics || {})) {
      const originalPapers = topicReport.papers || [];
      const uniquePapers = [];

      for (const paper of originalPapers) {
        const key = paperKey(paper.id || paper.url);
        if (!key) {
          uniquePapers.push(paper);
          continue;
        }
        if (seenBeforeDate.has(key)) {
          removedForDate += 1;
          changed = true;
          continue;
        }
        seenThisDate.add(key);
        uniquePapers.push(paper);
      }

      if (uniquePapers.length !== originalPapers.length) {
        topicReport.papers = uniquePapers;
        topicReport.summary = await summarizeWithCodex(topicReport.topic, uniquePapers);
        const trendPapers = await trendPapersFor(topicReport.topic);
        topicReport.image = await writeTopicSvg(
          date,
          topicReport.topic,
          topicReport.summary,
          uniquePapers,
          trendPapers
        );
      }
    }

    if (changed) {
      report.deduplicatedAt = new Date().toISOString();
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    }

    for (const key of seenThisDate) seenBeforeDate.add(key);
    removedTotal += removedForDate;
    console.log(`${date}: removed ${removedForDate} duplicate paper${removedForDate === 1 ? '' : 's'}`);
  }

  console.log(`removed ${removedTotal} duplicate paper${removedTotal === 1 ? '' : 's'} total`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
