import { TOPICS } from './topics.js';
import { fetchArxivPapers } from './arxiv.js';
import { summarizeWithCodex } from './codexSummarizer.js';
import { dateKey, saveTopicReport } from './storage.js';
import { writeTopicSvg } from './svg.js';

export async function runDailyUpdate(options = {}) {
  const date = options.date || dateKey(new Date());
  const results = [];

  for (const topic of TOPICS) {
    const papers = await fetchArxivPapers(topic, options);
    const summary = await summarizeWithCodex(topic, papers);
    const image = await writeTopicSvg(date, topic, summary, papers);
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
