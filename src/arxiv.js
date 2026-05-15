import { XMLParser } from 'fast-xml-parser';

const API_URL = 'https://export.arxiv.org/api/query';
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function cleanText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function normalizeEntry(entry) {
  const authors = asArray(entry.author).map((author) => cleanText(author.name)).filter(Boolean);
  const links = asArray(entry.link);
  const pdf = links.find((link) => link.title === 'pdf')?.href;
  const html = links.find((link) => link.rel === 'alternate')?.href || entry.id;
  return {
    id: cleanText(entry.id),
    title: cleanText(entry.title),
    abstract: cleanText(entry.summary),
    authors,
    published: entry.published,
    updated: entry.updated,
    categories: asArray(entry.category).map((category) => category.term).filter(Boolean),
    url: html,
    pdfUrl: pdf
  };
}

export async function fetchArxivPapers(topic, options = {}) {
  const maxResults = Number(options.maxResults || process.env.ARXIV_MAX_RESULTS || 12);
  const lookbackDays = Number(options.lookbackDays || process.env.ARXIV_LOOKBACK_DAYS || 3);
  const params = new URLSearchParams({
    search_query: topic.query,
    start: '0',
    max_results: String(Math.max(maxResults * 2, maxResults)),
    sortBy: 'submittedDate',
    sortOrder: 'descending'
  });

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    headers: { 'User-Agent': 'DailyResearchUpdate/0.1 (local research digest)' }
  });
  if (!response.ok) throw new Error(`arXiv request failed: ${response.status} ${response.statusText}`);

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const entries = asArray(parsed.feed?.entry).map(normalizeEntry);
  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;
  const recent = entries.filter((paper) => new Date(paper.published).getTime() >= cutoff);
  return (recent.length ? recent : entries).slice(0, maxResults);
}
