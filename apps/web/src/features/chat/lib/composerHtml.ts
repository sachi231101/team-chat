export function getPlainText(el: HTMLElement): string {
  return (el.innerText || '').replace(/\u00a0/g, ' ').replace(/\n+$/, '');
}

export function getTextBeforeCaret(el: HTMLElement): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
    return getPlainText(el);
  }
  const range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(el);
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return range.toString();
}

function childrenToMarkdown(el: Element): string {
  return Array.from(el.childNodes).map(nodeToMarkdown).join('');
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inner = childrenToMarkdown(el);

  if (tag === 'br') return '\n';
  if (tag === 'strong' || tag === 'b') return `**${inner}**`;
  if (tag === 'em' || tag === 'i') return `_${inner}_`;
  if (tag === 'u') return `<u>${inner}</u>`;
  if (tag === 's' || tag === 'strike' || tag === 'del') return `~~${inner}~~`;
  if (tag === 'a') {
    const href = el.getAttribute('href') || '';
    return `[${inner || href}](${href})`;
  }
  if (tag === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') {
    return `\`${inner}\``;
  }
  if (tag === 'pre') return `\`\`\`\n${el.innerText.replace(/\n+$/, '')}\n\`\`\``;
  if (tag === 'li') {
    const parent = el.parentElement?.tagName.toLowerCase();
    return parent === 'ol' ? `1. ${inner.trim()}\n` : `- ${inner.trim()}\n`;
  }
  if (tag === 'ul' || tag === 'ol') return childrenToMarkdown(el);
  if (tag === 'table') {
    const rows = Array.from(el.querySelectorAll('tr')).map((tr) => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map((c) => c.textContent?.trim() || '');
      return `| ${cells.join(' | ')} |`;
    });
    if (rows.length === 0) return inner;
    const cols = (rows[0].match(/\|/g) || []).length - 1;
    const divider = `| ${Array.from({ length: cols }, () => '---').join(' | ')} |`;
    return `\n${rows[0]}\n${divider}\n${rows.slice(1).join('\n')}\n`;
  }
  if (tag === 'div' || tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3') {
    const suffix = inner.endsWith('\n') ? '' : '\n';
    return `${inner}${suffix}`;
  }
  return inner;
}

export function htmlToMarkdown(html: string): string {
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  return nodeToMarkdown(wrap).replace(/\n{3,}/g, '\n\n').trim();
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const withInline = escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, '<u>$1</u>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const lines = withInline.split('\n');
  const htmlLines = lines.map((line) => {
    if (/^```/.test(line)) return line;
    if (/^\d+\. /.test(line)) return `<div>1. ${line.replace(/^\d+\. /, '')}</div>`;
    if (/^- /.test(line)) return `<div>- ${line.slice(2)}</div>`;
    return line ? `<div>${line}</div>` : '<div><br></div>';
  });
  return htmlLines.join('');
}

export function isEditorEmpty(el: HTMLElement | null): boolean {
  if (!el) return true;
  return !getPlainText(el).trim();
}
