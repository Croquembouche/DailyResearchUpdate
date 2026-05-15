const state = { topics: [], report: null, activeTopicId: null };
const tabsEl = document.querySelector('#tabs');
const reportEl = document.querySelector('#report');
const statusEl = document.querySelector('#status');
const dateInput = document.querySelector('#dateInput');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function markdownToHtml(markdown = '') {
  return markdown.split(/\n{2,}/).map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('## ')) return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
    if (trimmed.startsWith('### ')) return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
    if (trimmed.startsWith('- ')) {
      const items = trimmed.split('\n').map((line) => `<li>${escapeHtml(line.replace(/^- /, ''))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${escapeHtml(trimmed)}</p>`;
  }).join('');
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function renderTabs() {
  tabsEl.innerHTML = state.topics.map((topic) => `
    <button class="tab ${topic.id === state.activeTopicId ? 'active' : ''}" data-topic="${topic.id}">${escapeHtml(topic.label)}</button>
  `).join('');
}

function renderReport() {
  const topicReport = state.report?.topics?.[state.activeTopicId];
  renderTabs();
  if (!topicReport) {
    const topicCards = state.topics.map((topic) => `
      <button class="topic-card ${topic.id === state.activeTopicId ? 'selected' : ''}" data-topic="${topic.id}">
        <span>${escapeHtml(topic.label)}</span>
        <small>arXiv scan + 500-word Codex briefing</small>
      </button>
    `).join('');
    reportEl.innerHTML = `
      <section class="card empty first-run">
        <p class="eyebrow">First-run dashboard</p>
        <h2>No report generated yet</h2>
        <p class="dek">The service is running and the topic feed is configured. Generate the first briefing now, or leave the server running for the scheduled 6:00 AM Eastern update.</p>
        <div class="setup-grid">
          <div><strong>5</strong><span>research tabs</span></div>
          <div><strong>6:00 AM</strong><span>Eastern schedule</span></div>
          <div><strong>Codex CLI</strong><span>local summarizer</span></div>
        </div>
        <div class="callout">
          <strong>What Run now does:</strong>
          fetches recent arXiv papers, calls <code>codex -m gpt5.5</code> for each topic, writes a daily report, and generates SVG explainers.
        </div>
      </section>
      <aside class="card visual topic-overview">
        <h3>Tracked fields</h3>
        <p>Select a tab to preview the configured research lane.</p>
        <div class="topic-grid">${topicCards}</div>
      </aside>
    `;
    return;
  }

  const papers = topicReport.papers || [];
  reportEl.innerHTML = `
    <section class="card">
      <h2>${escapeHtml(topicReport.summary.title)}</h2>
      <p class="dek">${escapeHtml(topicReport.summary.dek)}</p>
      <div class="blog">${markdownToHtml(topicReport.summary.blogMarkdown)}</div>
    </section>
    <aside class="card visual">
      <button class="visual-expand" type="button" data-expand-image="${escapeHtml(topicReport.image)}" data-expand-title="${escapeHtml(topicReport.topic.label)}">
        <img src="${escapeHtml(topicReport.image)}" alt="Visual explainer for ${escapeHtml(topicReport.topic.label)}">
        <span>Click to expand</span>
      </button>
      <h3>Recent papers</h3>
      <ul class="paper-list">
        ${papers.map((paper) => `
          <li>
            <a href="${escapeHtml(paper.url)}" target="_blank" rel="noreferrer">${escapeHtml(paper.title)}</a>
            <div class="paper-meta">${escapeHtml((paper.authors || []).slice(0, 4).join(', '))} · ${escapeHtml((paper.published || '').slice(0, 10))}</div>
          </li>
        `).join('')}
      </ul>
    </aside>
  `;
}

function closeLightbox() {
  document.querySelector('.lightbox')?.remove();
  document.body.classList.remove('lightbox-open');
}

function openLightbox(src, title) {
  closeLightbox();
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-frame" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)} visual explainer">
      <button class="lightbox-close" type="button" aria-label="Close expanded image">Close</button>
      <img src="${escapeHtml(src)}" alt="Expanded visual explainer for ${escapeHtml(title)}">
    </div>
  `;
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox || event.target.closest('.lightbox-close')) closeLightbox();
  });
  document.body.appendChild(lightbox);
  document.body.classList.add('lightbox-open');
}

async function loadLatest() {
  state.topics = await getJson('/api/topics');
  state.report = await getJson('/api/reports/latest');
  state.activeTopicId = state.activeTopicId || state.topics[0]?.id;
  dateInput.value = state.report.date;
  statusEl.textContent = state.report.generatedAt ? `Loaded report for ${state.report.date}` : 'No generated report found yet.';
  renderReport();
}

async function loadDate() {
  if (!dateInput.value) return;
  state.report = await getJson(`/api/reports/${dateInput.value}`);
  statusEl.textContent = state.report.generatedAt ? `Loaded report for ${state.report.date}` : `No generated report found for ${dateInput.value}.`;
  renderReport();
}

async function runNow() {
  statusEl.textContent = 'Running arXiv scan and Codex summaries. This can take several minutes...';
  await getJson('/api/run-now', { method: 'POST' });
  await loadLatest();
}

tabsEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-topic]');
  if (!button) return;
  state.activeTopicId = button.dataset.topic;
  renderReport();
});
reportEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-expand-image]');
  if (!button) return;
  openLightbox(button.dataset.expandImage, button.dataset.expandTitle);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
});
document.querySelector('#loadButton').addEventListener('click', loadDate);
document.querySelector('#runButton').addEventListener('click', runNow);

loadLatest().catch((error) => {
  statusEl.textContent = `Failed to load: ${error.message}`;
});
