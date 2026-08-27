import React, { useState } from 'react';
import { Copy, Check, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { useUiStore } from '../../../stores';

interface CodeBlockProps {
  language?: string;
  code: string;
}

function highlightCode(code: string, language = '', isLight: boolean): React.ReactNode[] {
  const lines = code.split('\n');
  const lang = language.toLowerCase().trim();

  const colors = isLight
    ? {
        comment: '#6b7280',
        string: '#059669',
        keyword: '#7c3aed',
        number: '#d97706',
        type: '#0284c7',
        func: '#2563eb',
        op: '#64748b',
        default: 'var(--color-text-primary)',
      }
    : {
        comment: '#6b7280',
        string: '#34d399',
        keyword: '#c084fc',
        number: '#f59e0b',
        type: '#38bdf8',
        func: '#60a5fa',
        op: '#94a3b8',
        default: '#e2e8f0',
      };

  return lines.map((line, lineIdx) => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const commentMatch =
        lang === 'python' || lang === 'py' || lang === 'yaml' || lang === 'yml' || lang === 'sh' || lang === 'bash'
          ? remaining.match(/^(#.*)$/)
          : lang === 'sql'
            ? remaining.match(/^(--.*)$/)
            : remaining.match(/^(\/\/.*|\/\*.*?\*\/)$/);

      if (commentMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: colors.comment, fontStyle: 'italic' }}>
            {commentMatch[1]}
          </span>,
        );
        break;
      }

      const stringMatch = remaining.match(/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/);
      if (stringMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: colors.string }}>
            {stringMatch[1]}
          </span>,
        );
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }

      const keywordMatch = remaining.match(
        /^(import|export|from|default|const|let|var|function|return|if|else|switch|case|break|for|while|do|async|await|try|catch|finally|throw|class|extends|interface|type|enum|public|private|protected|readonly|new|this|super|typeof|instanceof|null|undefined|true|false|def|elif|lambda|pass|with|as|yield|SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|GROUP|BY|ORDER|HAVING|LIMIT|CREATE|TABLE|DROP|ALTER|AND|OR|NOT|IN|IS|NULL|package|func|struct|impl|mut|fn|pub)\b/,
      );
      if (keywordMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: colors.keyword, fontWeight: 600 }}>
            {keywordMatch[1]}
          </span>,
        );
        remaining = remaining.slice(keywordMatch[1].length);
        continue;
      }

      const numberMatch = remaining.match(/^(\b\d+(\.\d+)?\b)/);
      if (numberMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: colors.number }}>
            {numberMatch[1]}
          </span>,
        );
        remaining = remaining.slice(numberMatch[1].length);
        continue;
      }

      const typeMatch = remaining.match(
        /^(string|number|boolean|any|void|never|unknown|object|Promise|Array|Record|Map|Set|[A-Z][a-zA-Z0-9_]*)\b/,
      );
      if (typeMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: colors.type }}>
            {typeMatch[1]}
          </span>,
        );
        remaining = remaining.slice(typeMatch[1].length);
        continue;
      }

      const funcMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/);
      if (funcMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: colors.func }}>
            {funcMatch[1]}
          </span>,
        );
        remaining = remaining.slice(funcMatch[1].length);
        continue;
      }

      const opMatch = remaining.match(
        /^(=>|===|!==|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|&&|\|\||[{}()[\];,:+\-*/%&|^~<>!=?])/,
      );
      if (opMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: colors.op }}>
            {opMatch[1]}
          </span>,
        );
        remaining = remaining.slice(opMatch[1].length);
        continue;
      }

      tokens.push(
        <span key={keyIdx++} style={{ color: colors.default }}>
          {remaining[0]}
        </span>,
      );
      remaining = remaining.slice(1);
    }

    return (
      <div key={lineIdx} className="table-row leading-5">
        <span
          className="table-cell select-none pr-4 text-right font-mono text-[11px] opacity-40"
          style={{ minWidth: '2.5rem', color: 'var(--color-text-tertiary)' }}
        >
          {lineIdx + 1}
        </span>
        <span className="table-cell whitespace-pre font-mono text-[13px]">
          {tokens.length ? tokens : ' '}
        </span>
      </div>
    );
  });
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code }) => {
  const theme = useUiStore((s) => s.theme);
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanCode = code.replace(/^\n/, '').replace(/\n$/, '');
  const lines = cleanCode.split('\n');
  const isLong = lines.length > 14;
  const displayCode = isLong && !isExpanded ? lines.slice(0, 12).join('\n') : cleanCode;

  const handleCopy = () => {
    void navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizedLang = language.toLowerCase().trim() || 'code';

  return (
    <div
      className="my-3 overflow-hidden rounded-xl border transition-all"
      style={{
        background: isLight ? 'var(--color-elevated)' : 'var(--color-input)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="flex select-none items-center justify-between border-b px-3.5 py-1.5 text-xs"
        style={{
          background: isLight ? 'var(--color-input)' : 'rgba(255,255,255,0.03)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5" style={{ color: 'var(--color-accent)' }} />
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-accent)' }}
          >
            {normalizedLang}
          </span>
          <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-all hover-surface active:scale-95"
          style={{ color: copied ? '#16a34a' : 'var(--color-text-secondary)' }}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span className="font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto p-3" style={{ color: 'var(--color-text-primary)' }}>
        <div className="table w-full">{highlightCode(displayCode, normalizedLang, isLight)}</div>
      </div>

      {isLong && (
        <div
          className="border-t px-3 py-1.5 text-center"
          style={{
            background: isLight ? 'var(--color-input)' : 'rgba(255,255,255,0.02)',
            borderColor: 'var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Show {lines.length - 12} more lines</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
