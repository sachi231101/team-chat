import React from 'react';
import { CodeBlock } from '../components/CodeBlock';


function renderTokens(text: string): React.ReactNode[] {
  const tokenPattern = /(@[a-zA-Z0-9_.-]+|#[a-zA-Z0-9_.-]+|\/(?:research|meeting|support|workspace|summarize|recap|[a-zA-Z0-9_-]+Agent|[a-zA-Z0-9_-]+)|\[\d+\])/g;
  const parts = text.split(tokenPattern);

  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith('@')) {
      return (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[13.5px] font-semibold bg-violet-500/20 text-violet-300"
        >
          {part}
        </span>
      );
    }

    if (part.startsWith('#')) {
      return (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[13.5px] font-semibold bg-emerald-500/20 text-emerald-300 font-mono"
        >
          {part}
        </span>
      );
    }

    if (part.startsWith('/')) {
      return (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[13.5px] font-bold bg-sky-500/20 text-sky-300 font-mono"
        >
          {part}
        </span>
      );
    }

    const citationMatch = part.match(/^\[(\d+)\]$/);
    if (citationMatch) {
      return (
        <span
          key={i}
          className="inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer transition-colors"
          title={`Citation [${citationMatch[1]}]`}
        >
          [{citationMatch[1]}]
        </span>
      );
    }

    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function renderInline(text: string): React.ReactNode[] {
  const pattern =
    /(`[^`]+`|\*\*[^*]+?\*\*|~~[^~]+?~~|<u>[\s\S]*?<\/u>|\[[^\]]+\]\([^)\s]+\)|_[^_\n]+_)/g;
  const parts = text.split(pattern);
  return parts.map((chunk, i) => {
    if (!chunk) return null;
    if (chunk.startsWith('`') && chunk.endsWith('`') && chunk.length >= 2) {
      return (
        <code
          key={i}
          className="rounded px-1.5 py-0.5 font-mono text-[13px]"
          style={{
            background: 'var(--color-code-bg)',
            color: '#7dd3fc',
            border: '1px solid var(--color-code-border)',
          }}
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }
    if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length >= 4) {
      return (
        <strong key={i} className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {renderInline(chunk.slice(2, -2))}
        </strong>
      );
    }
    if (chunk.startsWith('~~') && chunk.endsWith('~~') && chunk.length >= 4) {
      return (
        <s key={i} className="opacity-80">
          {renderInline(chunk.slice(2, -2))}
        </s>
      );
    }
    if (chunk.startsWith('<u>') && chunk.endsWith('</u>')) {
      return <u key={i}>{renderInline(chunk.slice(3, -4))}</u>;
    }
    const link = chunk.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="underline"
          style={{ color: 'var(--color-accent)' }}
        >
          {link[1]}
        </a>
      );
    }
    if (chunk.startsWith('_') && chunk.endsWith('_') && chunk.length >= 2) {
      return (
        <em key={i} className="italic">
          {renderInline(chunk.slice(1, -1))}
        </em>
      );
    }
    return <React.Fragment key={i}>{renderTokens(chunk)}</React.Fragment>;
  });
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}

function isDividerRow(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

export function renderChatMarkdown(content: string): React.ReactNode {
  if (!content) return null;

  if (content.includes('```')) {
    const parts = content.split('```');
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        const lines = part.replace(/^\n/, '').replace(/\n$/, '').split('\n');
        const maybeLang = lines[0] && !lines[0].includes(' ') ? lines[0] : '';
        const code = maybeLang ? lines.slice(1).join('\n') : lines.join('\n');
        return <CodeBlock key={idx} language={maybeLang} code={code} />;
      }
      return (
        <span key={idx} className="whitespace-pre-wrap">
          {renderBlocks(part)}
        </span>
      );
    });
  }


  return <span className="whitespace-pre-wrap">{renderBlocks(content)}</span>;
}

function renderBlocks(text: string): React.ReactNode {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    if (isTableRow(lines[i])) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const rows = tableLines.filter((l) => !isDividerRow(l)).map((l) =>
        l
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim()),
      );
      nodes.push(
        <table
          key={`t-${i}`}
          className="my-2 w-full border-collapse text-[13.5px]"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <tbody>
            {rows.map((cells, ri) => (
              <tr key={ri}>
                {cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-2 py-1"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    const ul = lines[i].match(/^(\s*)- (.*)$/);
    const ol = lines[i].match(/^(\s*)\d+\. (.*)$/);
    if (ul || ol) {
      const ordered = Boolean(ol);
      const items: { indent: string; body: string }[] = [];
      while (i < lines.length) {
        const match = ordered
          ? lines[i].match(/^(\s*)\d+\. (.*)$/)
          : lines[i].match(/^(\s*)- (.*)$/);
        if (!match) break;
        items.push({ indent: match[1], body: match[2] });
        i += 1;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      nodes.push(
        <ListTag
          key={`l-${i}`}
          className={`my-1 pl-5 text-sm ${ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {items.map((item, idx) => (
            <li key={idx} style={{ marginLeft: Math.min(item.indent.length, 8) * 4 }}>
              {renderInline(item.body)}
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    const line = lines[i];
    nodes.push(
      <React.Fragment key={`p-${i}`}>
        {renderInline(line)}
        {i < lines.length - 1 ? '\n' : null}
      </React.Fragment>,
    );
    i += 1;
  }

  return nodes;
}
