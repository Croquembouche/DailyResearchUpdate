import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function escapeXml(value = '') {
  return String(value).replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[char]));
}

function truncate(value, length) {
  return value.length > length ? `${value.slice(0, length - 1)}...` : value;
}

function monthKey(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 7);
}

function recentMonthLabels(count = 6) {
  const now = new Date();
  const labels = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    labels.push(date.toISOString().slice(0, 7));
  }
  return labels;
}

function inferDirectionThemes(papers) {
  const themeMap = [
    ['Closed-loop planning', ['closed-loop', 'planning', 'planner', 'trajectory', 'control']],
    ['Generative simulation', ['simulation', 'sim-to-real', 'synthetic', 'world model', 'video generation']],
    ['3D world models', ['3d', 'reconstruction', 'gaussian', 'nerf', 'occupancy', 'slam']],
    ['Safety validation', ['safety', 'verification', 'validation', 'risk', 'adversarial', 'robustness']],
    ['Fleet operations', ['traffic', 'transportation', 'routing', 'fleet', 'mobility']],
    ['Data logging', ['storage', 'event data', 'recorder', 'logging', 'crash data', 'black box']],
    ['Foundation models', ['vision-language', 'vla', 'foundation model', 'multimodal', 'language']],
    ['Sensor efficiency', ['lidar', 'camera', 'radar', 'event', 'edge', 'memristor']]
  ];

  const counts = new Map(themeMap.map(([label]) => [label, 0]));
  for (const paper of papers) {
    const text = `${paper.title} ${paper.abstract}`.toLowerCase();
    for (const [label, keywords] of themeMap) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        counts.set(label, counts.get(label) + 1);
      }
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

function buildDirectionData(papers) {
  const months = recentMonthLabels(6);
  const monthCounts = new Map(months.map((month) => [month, 0]));
  for (const paper of papers) {
    const key = monthKey(paper.published);
    if (monthCounts.has(key)) monthCounts.set(key, monthCounts.get(key) + 1);
  }
  const counts = months.map((month) => monthCounts.get(month));
  const themes = inferDirectionThemes(papers);
  return { months, counts, themes };
}

export async function writeTopicSvg(date, topic, summary, papers, trendPapers = papers) {
  const dir = path.resolve('public/generated');
  await mkdir(dir, { recursive: true });
  const fileName = `${date}-${topic.id}.svg`;
  const direction = buildDirectionData(trendPapers);
  const maxCount = Math.max(1, ...direction.counts);
  const chartWidth = 720;
  const chartLeft = 120;
  const chartBase = 330;
  const chartHeight = 138;
  const points = direction.counts.map((count, index) => {
    const x = chartLeft + index * (chartWidth / Math.max(1, direction.counts.length - 1));
    const y = chartBase - (count / maxCount) * chartHeight;
    return { x, y, count, month: direction.months[index] };
  });
  const pointPath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const pointNodes = points.map((point) => `
    <circle cx="${point.x}" cy="${point.y}" r="7" fill="#1d5c4d"/>
    <text x="${point.x}" y="${chartBase + 30}" text-anchor="middle" font-size="12" fill="#52635b">${escapeXml(point.month.slice(5))}</text>
    <text x="${point.x}" y="${point.y - 14}" text-anchor="middle" font-size="12" font-weight="700" fill="#17251f">${point.count}</text>
  `).join('\n');
  const themeNodes = direction.themes.map(([theme, count], index) => {
    const y = 395 + index * 34;
    const width = Math.max(80, Math.round((count / Math.max(1, direction.themes[0]?.[1] || 1)) * 230));
    return `<text x="70" y="${y + 15}" font-size="14" fill="#21302b">${escapeXml(truncate(theme, 26))}</text><rect x="270" y="${y}" width="${width}" height="20" rx="10" fill="#c96f43" opacity="${0.95 - index * 0.1}"/><text x="${285 + width}" y="${y + 15}" font-size="12" fill="#52635b">${count}</text>`;
  }).join('\n');
  const takeawayNodes = (summary.keyTakeaways?.length ? summary.keyTakeaways : papers.map((paper) => paper.title)).slice(0, 3).map((takeaway, index) => {
    const y = 147 + index * 28;
    return `<circle cx="708" cy="${y - 5}" r="10" fill="#1d5c4d"/><text x="708" y="${y - 1}" text-anchor="middle" font-size="10" fill="#fff">${index + 1}</text><text x="730" y="${y}" font-size="13" fill="#21302b">${escapeXml(truncate(takeaway, 34))}</text>`;
  }).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560" role="img" aria-label="${escapeXml(topic.label)} visual briefing">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f7efe2"/><stop offset="1" stop-color="#dceee6"/></linearGradient>
  </defs>
  <rect width="960" height="560" rx="28" fill="url(#bg)"/>
  <rect x="42" y="42" width="876" height="476" rx="24" fill="#fffaf2" opacity="0.82"/>
  <text x="70" y="94" font-family="Georgia, serif" font-size="34" font-weight="700" fill="#17251f">${escapeXml(topic.label)}</text>
  <text x="70" y="128" font-size="15" fill="#52635b">Field direction over the past 6 months · ${trendPapers.length} arXiv papers scanned · ${escapeXml(date)}</text>
  <rect x="70" y="160" width="820" height="2" fill="#d8c8ad"/>
  <text x="70" y="194" font-size="17" font-weight="700" fill="#17251f">Paper momentum by month</text>
  <line x1="${chartLeft}" y1="${chartBase}" x2="${chartLeft + chartWidth}" y2="${chartBase}" stroke="#d8c8ad" stroke-width="2"/>
  <line x1="${chartLeft}" y1="${chartBase - chartHeight}" x2="${chartLeft + chartWidth}" y2="${chartBase - chartHeight}" stroke="#d8c8ad" stroke-width="1" opacity="0.6"/>
  <path d="${pointPath}" fill="none" stroke="#c96f43" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  ${pointNodes}
  <rect x="690" y="110" width="185" height="116" rx="20" fill="#e8f4ee"/>
  <text x="712" y="134" font-size="14" font-weight="700" fill="#17251f">Today's signals</text>
  ${takeawayNodes}
  <text x="70" y="380" font-size="17" font-weight="700" fill="#17251f">Dominant six-month directions</text>
  ${themeNodes || '<text x="70" y="420" font-size="14" fill="#52635b">Not enough recent papers to infer a trend.</text>'}
  <text x="70" y="510" font-size="13" fill="#63726a">Trend uses a separate 180-day arXiv scan; daily report still excludes previously reported papers.</text>
</svg>`;
  await writeFile(path.join(dir, fileName), svg);
  return `/generated/${fileName}`;
}
