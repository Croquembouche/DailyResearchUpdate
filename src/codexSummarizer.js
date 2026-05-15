import { spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

function fallbackSummary(topic, papers, reason) {
  const topPapers = papers.slice(0, 5);
  const bullets = topPapers.map((paper) => `- ${paper.title}: ${paper.abstract.slice(0, 220)}${paper.abstract.length > 220 ? '...' : ''}`);
  return {
    title: `${topic.label}: latest arXiv scan`,
    dek: `A local fallback digest from ${papers.length} recent arXiv papers. Codex summarization was unavailable: ${reason}`,
    blogMarkdown: [
      `## ${topic.label}`,
      '',
      `Today\'s scan found ${papers.length} recent arXiv papers related to ${topic.label.toLowerCase()}. The strongest signal comes from the papers below, which are ranked by arXiv submission recency rather than editorial importance.`,
      '',
      ...bullets,
      '',
      'Read this fallback as a triage view. Re-run the update after the Codex CLI is available to get a synthesized 500-word narrative with stronger cross-paper interpretation.'
    ].join('\n'),
    keyTakeaways: topPapers.slice(0, 4).map((paper) => paper.title),
    themes: inferThemes(papers)
  };
}

function inferThemes(papers) {
  const keywords = ['planning', 'perception', 'control', 'simulation', 'safety', 'reconstruction', 'occupancy', 'traffic', 'robustness', 'dataset'];
  const text = papers.map((paper) => `${paper.title} ${paper.abstract}`).join(' ').toLowerCase();
  return keywords.filter((keyword) => text.includes(keyword)).slice(0, 5);
}

function extractJson(output) {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object found in Codex output');
  return JSON.parse(output.slice(start, end + 1));
}

function clip(value = '', maxLength = 900) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function preparePapers(papers) {
  return papers.slice(0, Number(process.env.CODEX_MAX_PAPERS || 5)).map((paper) => ({
    title: paper.title,
    abstract: clip(paper.abstract),
    authors: paper.authors?.slice(0, 6) || [],
    published: paper.published,
    url: paper.url,
    pdfUrl: paper.pdfUrl
  }));
}

async function runCodex(bin, args, timeout) {
  const outputPath = path.join(tmpdir(), `daily-research-update-${randomUUID()}.txt`);
  const fullArgs = [...args, '--output-last-message', outputPath];
  return new Promise((resolve, reject) => {
    const child = spawn(bin, fullArgs, {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {
        child.kill('SIGTERM');
      }
      setTimeout(() => {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      }, 1500).unref();
    }, timeout);

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > 6 * 1024 * 1024) stdout = stdout.slice(-6 * 1024 * 1024);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      if (stderr.length > 6 * 1024 * 1024) stderr = stderr.slice(-6 * 1024 * 1024);
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        rm(outputPath, { force: true }).catch(() => {});
        reject(new Error(`Codex timed out after ${timeout}ms`));
        return;
      }
      if (code !== 0) {
        rm(outputPath, { force: true }).catch(() => {});
        reject(new Error(`Codex exited with code ${code}${signal ? ` signal ${signal}` : ''}: ${stderr.slice(0, 800)}`));
        return;
      }
      readFile(outputPath, 'utf8')
        .then((lastMessage) => {
          rm(outputPath, { force: true }).catch(() => {});
          resolve(lastMessage || `${stdout}\n${stderr}`);
        })
        .catch((error) => {
          rm(outputPath, { force: true }).catch(() => {});
          reject(error);
        });
    });
  });
}

function buildPrompt(topic, papers) {
  return `You are writing a daily research briefing for an autonomous vehicle researcher.\n\nTopic: ${topic.label}\n\nUse only the arXiv papers provided below. Produce a concise blog-style synthesis of about 500 words. Explain what is new, why it matters, and what to watch next. Avoid hype. Mention paper titles naturally when useful.\n\nReturn only valid JSON with this shape:\n{\n  "title": "short briefing title",\n  "dek": "one sentence summary",\n  "blogMarkdown": "markdown blog body around 500 words",\n  "keyTakeaways": ["3-5 concise takeaways"],\n  "themes": ["3-5 short visual theme labels"]\n}\n\nPapers JSON:\n${JSON.stringify(preparePapers(papers), null, 2)}`;
}

export async function summarizeWithCodex(topic, papers) {
  if (!papers.length) {
    return {
      title: `${topic.label}: no new papers found`,
      dek: 'The arXiv scan did not find matching recent papers for this topic.',
      blogMarkdown: `## ${topic.label}\n\nNo matching recent arXiv papers were found for this topic in the configured lookback window.`,
      keyTakeaways: ['No matching recent papers found'],
      themes: ['No new papers']
    };
  }

  const bin = process.env.CODEX_BIN || 'codex';
  const model = process.env.CODEX_MODEL || 'gpt-5.5';
  const timeout = Number(process.env.CODEX_TIMEOUT_MS || 60000);
  const prompt = buildPrompt(topic, papers);
  try {
    const output = await runCodex(bin, ['exec', '-m', model, '--sandbox', 'read-only', prompt], timeout);
    const parsed = extractJson(output);
    return {
      title: parsed.title || `${topic.label}: daily briefing`,
      dek: parsed.dek || '',
      blogMarkdown: parsed.blogMarkdown || '',
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes : inferThemes(papers)
    };
  } catch (error) {
    return fallbackSummary(topic, papers, error?.message || 'unknown error');
  }
}
