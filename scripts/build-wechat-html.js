#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Lexer, lexer } = require('marked');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'source/_posts/ai-devgroup.md');
const outputPath = path.join(root, 'wechat/ai-devgroup.html');
const sourceUrl = 'https://solome.js.org/blog/ai-devgroup/';

const styles = {
  body: [
    'margin:0',
    'background:#f4f6f8',
    "font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei',Arial,sans-serif",
  ].join(';'),
  article: [
    'box-sizing:border-box',
    'width:100%',
    'max-width:680px',
    'margin:0 auto',
    'padding:28px 18px 48px',
    'background:#ffffff',
    'color:#2f343a',
    "font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei',Arial,sans-serif",
    'font-size:16px',
    'line-height:1.9',
    'letter-spacing:0',
    'word-break:break-word',
  ].join(';'),
  title: [
    'margin:0 0 12px',
    'color:#171a1f',
    'font-size:26px',
    'line-height:1.36',
    'font-weight:700',
    'letter-spacing:0',
  ].join(';'),
  meta: [
    'margin:0 0 28px',
    'color:#8a94a3',
    'font-size:14px',
    'line-height:1.6',
  ].join(';'),
  divider: [
    'height:1px',
    'margin:0 0 28px',
    'background:#edf0f3',
    'line-height:1px',
  ].join(';'),
  paragraph: [
    'margin:0 0 18px',
    'color:#2f343a',
    'font-size:16px',
    'line-height:1.9',
  ].join(';'),
  h2: [
    'margin:44px 0 18px',
    'padding:0 0 0 12px',
    'border-left:4px solid #3d73dd',
    'color:#171a1f',
    'font-size:22px',
    'line-height:1.45',
    'font-weight:700',
    'letter-spacing:0',
  ].join(';'),
  h3: [
    'margin:32px 0 14px',
    'padding:0 0 8px',
    'border-bottom:1px solid #e7ebf0',
    'color:#1f2933',
    'font-size:18px',
    'line-height:1.5',
    'font-weight:700',
    'letter-spacing:0',
  ].join(';'),
  blockquote: [
    'margin:22px 0 28px',
    'padding:16px 18px',
    'border-left:4px solid #5f8fe8',
    'border-radius:0 8px 8px 0',
    'background:#f5f8ff',
    'color:#4c5664',
    'font-size:15px',
    'line-height:1.85',
  ].join(';'),
  quoteParagraph: [
    'margin:0 0 10px',
    'color:#4c5664',
    'font-size:15px',
    'line-height:1.85',
  ].join(';'),
  list: [
    'margin:8px 0 24px',
    'padding-left:1.25em',
    'color:#2f343a',
    'font-size:16px',
    'line-height:1.85',
  ].join(';'),
  listItem: [
    'margin:7px 0',
    'padding-left:2px',
    'color:#2f343a',
    'font-size:16px',
    'line-height:1.85',
  ].join(';'),
  strong: 'font-weight:700;color:#1d2430',
  em: 'font-style:italic;color:#2f343a',
  code: [
    "font-family:Menlo,Consolas,'Liberation Mono',monospace",
    'font-size:14px',
    'line-height:1.6',
    'padding:2px 5px',
    'border-radius:4px',
    'background:#f1f3f5',
    'color:#a83232',
  ].join(';'),
  pre: [
    'box-sizing:border-box',
    'margin:18px 0 26px',
    'padding:14px 16px',
    'border-radius:8px',
    'background:#f6f8fa',
    'color:#1f2933',
    'font-size:14px',
    'line-height:1.75',
    'overflow-x:auto',
  ].join(';'),
  link: 'color:#315fbd;text-decoration:none;border-bottom:1px solid #b9c9ee',
  tableWrap: 'margin:18px 0 30px',
  tableCard: [
    'margin:12px 0',
    'padding:14px 14px 12px',
    'border:1px solid #e4eaf1',
    'border-radius:8px',
    'background:#fbfcfe',
  ].join(';'),
  tableTitle: [
    'margin:0 0 10px',
    'color:#172033',
    'font-size:16px',
    'line-height:1.6',
    'font-weight:700',
  ].join(';'),
  tableCellBox: [
    'margin:9px 0 0',
    'padding:10px 12px',
    'border:1px solid #edf1f5',
    'border-radius:6px',
    'background:#ffffff',
  ].join(';'),
  tableLabel: [
    'display:block',
    'margin:0 0 4px',
    'color:#6b7684',
    'font-size:13px',
    'line-height:1.5',
    'font-weight:700',
  ].join(';'),
  tableText: [
    'display:block',
    'color:#2f343a',
    'font-size:15px',
    'line-height:1.75',
  ].join(';'),
  hr: 'height:1px;margin:30px 0;background:#edf0f3;line-height:1px',
  footer: [
    'margin:42px 0 0',
    'padding:18px 0 0',
    'border-top:1px solid #edf0f3',
    'color:#8a94a3',
    'font-size:13px',
    'line-height:1.7',
  ].join(';'),
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: raw };
  }

  const data = {};
  for (const line of match[1].split('\n')) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!item) continue;
    const key = item[1];
    let value = item[2].trim();
    value = value.replace(/^['"]|['"]$/g, '');
    data[key] = value;
  }

  return { data, body: match[2] };
}

function inlineTokens(text) {
  return Lexer.lexInline(text || '', { gfm: true });
}

function renderInline(tokens) {
  return (tokens || []).map((token) => {
    switch (token.type) {
      case 'text':
        return token.tokens ? renderInline(token.tokens) : escapeHtml(token.text);
      case 'escape':
        return escapeHtml(token.text);
      case 'strong':
        return `<strong style="${styles.strong}">${renderInline(token.tokens || inlineTokens(token.text))}</strong>`;
      case 'em':
        return `<em style="${styles.em}">${renderInline(token.tokens || inlineTokens(token.text))}</em>`;
      case 'codespan':
        return `<code style="${styles.code}">${escapeHtml(token.text)}</code>`;
      case 'br':
        return '<br>';
      case 'del':
        return `<del>${renderInline(token.tokens || inlineTokens(token.text))}</del>`;
      case 'link':
        return `<a href="${escapeAttr(token.href)}" style="${styles.link}">${renderInline(token.tokens || inlineTokens(token.text))}</a>`;
      case 'image':
        return `<img src="${escapeAttr(token.href)}" alt="${escapeAttr(token.text || '')}" style="display:block;width:100%;height:auto;margin:18px auto;border-radius:8px;">`;
      case 'html':
        return token.text || token.raw || '';
      default:
        return escapeHtml(token.text || token.raw || '');
    }
  }).join('');
}

function renderParagraph(token, inQuote = false) {
  const style = inQuote ? styles.quoteParagraph : styles.paragraph;
  return `<p style="${style}">${renderInline(token.tokens || inlineTokens(token.text))}</p>`;
}

function renderHeading(token) {
  const content = renderInline(token.tokens || inlineTokens(token.text));
  if (token.depth <= 2) {
    return `<h2 style="${styles.h2}">${content}</h2>`;
  }
  return `<h3 style="${styles.h3}">${content}</h3>`;
}

function renderBlockquote(token) {
  const inner = renderTokens(token.tokens || lexer(token.text, { gfm: true }), { inQuote: true });
  return `<blockquote style="${styles.blockquote}">${inner}</blockquote>`;
}

function renderListItem(item) {
  if (!item.tokens || item.tokens.length === 0) {
    return renderInline(inlineTokens(item.text || ''));
  }

  if (item.tokens.length === 1) {
    const only = item.tokens[0];
    if (only.type === 'text' || only.type === 'paragraph') {
      return renderInline(only.tokens || inlineTokens(only.text || ''));
    }
  }

  return renderTokens(item.tokens);
}

function renderList(token) {
  const tag = token.ordered ? 'ol' : 'ul';
  const start = token.ordered && token.start ? ` start="${escapeAttr(token.start)}"` : '';
  const items = token.items.map((item) => `<li style="${styles.listItem}">${renderListItem(item)}</li>`).join('');
  return `<${tag}${start} style="${styles.list}">${items}</${tag}>`;
}

function renderTable(token) {
  const header = token.tokens.header.map(renderInline);
  const rows = token.tokens.cells;

  if (header.length === 3) {
    const cards = rows.map((row) => {
      const title = renderInline(row[0]);
      const first = renderInline(row[1]);
      const second = renderInline(row[2]);
      return [
        `<section style="${styles.tableCard}">`,
        `<section style="${styles.tableTitle}">${title}</section>`,
        `<section style="${styles.tableCellBox}"><span style="${styles.tableLabel}">${header[1]}</span><span style="${styles.tableText}">${first}</span></section>`,
        `<section style="${styles.tableCellBox}"><span style="${styles.tableLabel}">${header[2]}</span><span style="${styles.tableText}">${second}</span></section>`,
        '</section>',
      ].join('');
    }).join('');

    return `<section style="${styles.tableWrap}">${cards}</section>`;
  }

  const tableHeader = header.map((cell) => `<th style="padding:10px;border:1px solid #e4eaf1;background:#f5f8ff;color:#172033;font-size:14px;line-height:1.6;text-align:left;">${cell}</th>`).join('');
  const body = rows.map((row) => {
    const cells = row.map((cell) => `<td style="padding:10px;border:1px solid #e4eaf1;color:#2f343a;font-size:14px;line-height:1.7;vertical-align:top;">${renderInline(cell)}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `<section style="margin:18px 0 30px;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">${tableHeader ? `<thead><tr>${tableHeader}</tr></thead>` : ''}<tbody>${body}</tbody></table></section>`;
}

function renderCode(token) {
  return `<pre style="${styles.pre}"><code>${escapeHtml(token.text || '')}</code></pre>`;
}

function renderTokens(tokens, options = {}) {
  return (tokens || []).map((token) => {
    switch (token.type) {
      case 'space':
        return '';
      case 'paragraph':
        return renderParagraph(token, options.inQuote);
      case 'heading':
        return renderHeading(token);
      case 'blockquote':
        return renderBlockquote(token);
      case 'list':
        return renderList(token);
      case 'table':
        return renderTable(token);
      case 'code':
        return renderCode(token);
      case 'hr':
        return `<section style="${styles.hr}"></section>`;
      case 'text':
        return `<p style="${options.inQuote ? styles.quoteParagraph : styles.paragraph}">${renderInline(token.tokens || inlineTokens(token.text))}</p>`;
      case 'html':
        return token.raw || token.text || '';
      default:
        return '';
    }
  }).join('\n');
}

function buildDocument() {
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const { data, body } = parseFrontMatter(raw);
  const title = data.title || 'Untitled';
  const date = data.date ? data.date.slice(0, 10) : '';
  const category = data.categories || '';
  const meta = [category, date].filter(Boolean).join(' · ');
  const tokens = lexer(body, { gfm: true });
  const content = renderTokens(tokens);

  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta name="source" content="${escapeAttr(sourceUrl)}">`,
    `<title>${escapeHtml(title)}</title>`,
    '</head>',
    `<body style="${styles.body}">`,
    `<section style="${styles.article}">`,
    `<h1 style="${styles.title}">${escapeHtml(title)}</h1>`,
    meta ? `<p style="${styles.meta}">${escapeHtml(meta)}</p>` : '',
    `<section style="${styles.divider}"></section>`,
    content,
    `<section style="${styles.footer}">原文：${escapeHtml(sourceUrl)}</section>`,
    '</section>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buildDocument(), 'utf8');
console.log(`Wrote ${path.relative(root, outputPath)}`);
