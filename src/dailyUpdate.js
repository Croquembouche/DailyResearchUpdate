import { TOPICS } from './topics.js';
import { fetchArxivPapers } from './arxiv.js';
import { summarizeWithCodex } from './codexSummarizer.js';
import { dateKey, paperKey, readPreviouslyReportedPaperKeys, saveTopicReport } from './storage.js';
import { writeTopicSvg } from './svg.js';

export async function runDailyUpdate(options = {}) {
  const date = options.date || dateKey(new Date());
  const previouslyReported = await readPreviouslyReportedPaperKeys(date);
  const results = [];

  for (const topic of TOPICS) {
    const trendPapers = await fetchArxivPapers(topic, {
      ...options,
      maxResults: Number(process.env.ARXIV_TREND_MAX_RESULTS || 80),
      lookbackDays: Number(process.env.ARXIV_TREND_LOOKBACK_DAYS || 180)
    });
    const papers = (await fetchArxivPapers(topic, options))
      .filter((paper) => !previouslyReported.has(paperKey(paper.id || paper.url)));
    const summary = await summarizeWithCodex(topic, papers);
    const image = await writeTopicSvg(date, topic, summary, papers, trendPapers);
    const topicReport = {
      topic,
      date,
      generatedAt: new Date().toISOString(),
      summary,
      image,
      papers
    };
    await saveTopicReport(date, topicReport);
    results.push(topicReport);
  }

  return { date, topics: results };
}
