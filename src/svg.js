import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function escapeXml(value = '') {
  return String(value).replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));
}

function truncate(value, length) {
  return value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

export async function writeTopicSvg(date, topic, summary, papers) {
  const dir = path.resolve('public/generated');
  await mkdir(dir, { recursive: true });
  const fileName = `${date}-${topic.id}.svg`;
  const themes = (summary.themes?.length ? summary.themes : ['Papers', 'Methods', 'Impact']).slice(0, 5);
  const takeaways = (summary.keyTakeaways?.length ? summary.keyTakeaways : papers.map((paper) => paper.title)).slice(0, 4);
  const themeNodes = themes.map((theme, index) => {
    const x = 70 + index * 168;
    const y = 205 + (index % 2) * 46;
    return `<rect x="${x}" y="${y}" width="135" height="34" rx="17" fill="#e8f4ee"/><text x="${x + 67}" y="${y + 22}" text-anchor="middle" font-size="13" fill="#20493a">${escapeXml(truncate(theme, 18))}</text>`;
  }).join('\n');
  const takeawayNodes = takeaways.map((takeaway, index) => {
    const y = 335 + index * 44;
    return `<circle cx="78" cy="${y - 5}" r="12" fill="#1d5c4d"/><text x="78" y="${y}" text-anchor="middle" font-size="12" fill="#fff">${index + 1}</text><text x="105" y="${y}" font-size="15" fill="#21302b">${escapeXml(truncate(takeaway, 86))}</text>`;
  }).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560" role="img" aria-label="${escapeXml(topic.label)} visual briefing">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f7efe2"/><stop offset="1" stop-color="#dceee6"/></linearGradient>
  </defs>
  <rect width="960" height="560" rx="28" fill="url(#bg)"/>
  <rect x="42" y="42" width="876" height="476" rx="24" fill="#fffaf2" opacity="0.82"/>
  <text x="70" y="94" font-family="Georgia, serif" font-size="34" font-weight="700" fill="#17251f">${escapeXml(topic.label)}</text>
  <text x="70" y="128" font-size="15" fill="#52635b">Daily arXiv briefing for ${escapeXml(date)} · ${papers.length} recent papers scanned</text>
  <rect x="70" y="160" width="820" height="2" fill="#d8c8ad"/>
  <text x="70" y="192" font-size="17" font-weight="700" fill="#17251f">Main research signals</text>
  ${themeNodes}
  <path d="M120 285 C260 252, 360 318, 488 286 S720 250, 845 292" fill="none" stroke="#c96f43" stroke-width="5" stroke-linecap="round" opacity="0.78"/>
  <text x="70" y="312" font-size="17" font-weight="700" fill="#17251f">What to remember</text>
  ${takeawayNodes}
  <text x="70" y="500" font-size="13" fill="#63726a">Generated locally from arXiv metadata and the configured Codex summarizer.</text>
</svg>`;
  await writeFile(path.join(dir, fileName), svg);
  return `/generated/${fileName}`;
}
