import React, { useState } from 'react';
import { Copy, Check, Code2, ChevronDown, ChevronUp } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

// Lightweight syntax highlighter for rich presentation
function highlightCode(code: string, language = ''): React.ReactNode[] {
  const lines = code.split('\n');

  const lang = language.toLowerCase().trim();

  return lines.map((line, lineIdx) => {
    // Basic regex tokenization
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // 1. Comments
      const commentMatch =
        lang === 'python' || lang === 'py' || lang === 'yaml' || lang === 'yml' || lang === 'sh' || lang === 'bash'
          ? remaining.match(/^(#.*)$/)
          : lang === 'sql'
          ? remaining.match(/^(--.*)$/)
          : remaining.match(/^(\/\/.*|\/\*.*?\*\/)$/);

      if (commentMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#6b7280', fontStyle: 'italic' }}>
            {commentMatch[1]}
          </span>,
        );
        break;
      }

      // 2. Strings
      const stringMatch = remaining.match(/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/);
      if (stringMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#34d399' }}>
            {stringMatch[1]}
          </span>,
        );
        remaining = remaining.slice(stringMatch[1].length);
        continue;
      }

      // 3. Keywords
      const keywordMatch = remaining.match(
        /^(import|export|from|default|const|let|var|function|return|if|else|switch|case|break|for|while|do|async|await|try|catch|finally|throw|class|extends|interface|type|enum|public|private|protected|readonly|new|this|super|typeof|instanceof|null|undefined|true|false|def|elif|lambda|pass|with|as|yield|SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|GROUP|BY|ORDER|HAVING|LIMIT|CREATE|TABLE|DROP|ALTER|AND|OR|NOT|IN|IS|NULL|package|func|struct|impl|mut|fn|pub)\b/,
      );
      if (keywordMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#c084fc', fontWeight: 600 }}>
            {keywordMatch[1]}
          </span>,
        );
        remaining = remaining.slice(keywordMatch[1].length);
        continue;
      }

      // 4. Numbers
      const numberMatch = remaining.match(/^(\b\d+(\.\d+)?\b)/);
      if (numberMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#f59e0b' }}>
            {numberMatch[1]}
          </span>,
        );
        remaining = remaining.slice(numberMatch[1].length);
        continue;
      }

      // 5. Types / Built-ins (Capitalized or standard types)
      const typeMatch = remaining.match(/^(string|number|boolean|any|void|never|unknown|object|Promise|Array|Record|Map|Set|[A-Z][a-zA-Z0-9_]*)\b/);
      if (typeMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#38bdf8' }}>
            {typeMatch[1]}
          </span>,
        );
        remaining = remaining.slice(typeMatch[1].length);
        continue;
      }

      // 6. Function calls
      const funcMatch = remaining.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/);
      if (funcMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#60a5fa' }}>
            {funcMatch[1]}
          </span>,
        );
        remaining = remaining.slice(funcMatch[1].length);
        continue;
      }

      // 7. Operators & Punctuation
      const opMatch = remaining.match(/^(=>|===|!==|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|&&|\|\||[{}()[\];,:+\-*/%&|^~<>!=?])/);
      if (opMatch) {
        tokens.push(
          <span key={keyIdx++} style={{ color: '#94a3b8' }}>
            {opMatch[1]}
          </span>,
        );
        remaining = remaining.slice(opMatch[1].length);
        continue;
      }

      // Default single char
      tokens.push(<span key={keyIdx++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return (
      <div key={lineIdx} className="table-row leading-5">
        <span className="table-cell pr-4 text-right select-none font-mono text-[11px] opacity-35" style={{ minWidth: '2.5rem' }}>
          {lineIdx + 1}
        </span>
        <span className="table-cell font-mono text-[13px] whitespace-pre">
          {tokens.length ? tokens : ' '}
        </span>
      </div>
    );
  });
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanCode = code.replace(/^\n/, '').replace(/\n$/, '');
  const lines = cleanCode.split('\n');
  const isLong = lines.length > 14;
  const displayCode = isLong && !isExpanded ? lines.slice(0, 12).join('\n') : cleanCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizedLang = language.toLowerCase().trim() || 'code';

  return (
    <div
      className="my-3 overflow-hidden rounded-xl border shadow-lg transition-all"
      style={{
        background: '#0d1117',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3.5 py-1.5 border-b select-none text-xs"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-sky-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-sky-300">
            {normalizedLang}
          </span>
          <span className="text-[10px] text-stone-500 font-mono">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-all hover:bg-white/10 active:scale-95"
            style={{ color: copied ? '#34d399' : '#94a3b8' }}
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto p-3 text-stone-200">
        <div className="table w-full">
          {highlightCode(displayCode, normalizedLang)}
        </div>
      </div>

      {/* Expand/Collapse footer if long */}
      {isLong && (
        <div
          className="border-t px-3 py-1.5 text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderColor: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors"
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
