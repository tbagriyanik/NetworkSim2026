'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';

interface PythonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isDark: boolean;
  placeholder?: string;
}

const CODE_WORDS = [
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
  'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'None', 'not', 'or', 'pass', 'raise',
  'return', 'True', 'try', 'while', 'with', 'yield',
  'print', 'len', 'range', 'str', 'int', 'float', 'bool', 'list', 'dict',
  'set', 'tuple', 'enumerate', 'zip', 'open', 'input', 'sum', 'min', 'max',
  'abs', 'round', 'sorted', 'reversed', 'type', 'isinstance',
  'math', 'random', 'json', 'datetime', 'os', 'sys',
  'function', 'const', 'let', 'var', 'console', 'log', 'return', 'echo',
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char
  ));
}

function highlightCode(code: string): string {
  const token = /(#.*$|\/\/.*$|(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b\d+(?:\.\d+)?\b|\b(?:True|False|None|true|false|null|undefined)\b|\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|not|or|pass|raise|return|try|while|with|yield|function|const|let|var)\b|\b(?:print|len|range|str|int|float|bool|list|dict|set|tuple|enumerate|zip|open|input|sum|min|max|abs|round|sorted|reversed|type|isinstance|console|log|echo)\b)/gm;

  let output = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = token.exec(code))) {
    output += escapeHtml(code.slice(lastIndex, match.index));
    const text = escapeHtml(match[0]);
    const raw = match[0];

    let kind = 'keyword';
    if (raw.startsWith('#') || raw.startsWith('//')) {
      kind = 'comment';
    } else if (raw.startsWith('"') || raw.startsWith("'") || raw.startsWith('`')) {
      kind = 'string';
    } else if (/^\d/.test(raw)) {
      kind = 'number';
    } else if (/^(True|False|None|true|false|null|undefined)$/.test(raw)) {
      kind = 'constant';
    } else if (/^(print|len|range|str|int|float|bool|list|dict|set|tuple|enumerate|zip|open|input|sum|min|max|abs|round|sorted|reversed|type|isinstance|console|log|echo)$/.test(raw)) {
      kind = 'builtin';
    }

    const color =
      kind === 'keyword'
        ? '#c084fc'
        : kind === 'builtin'
        ? '#38bdf8'
        : kind === 'string'
        ? '#4ade80'
        : kind === 'number'
        ? '#fbbf24'
        : kind === 'constant'
        ? '#fb7185'
        : '#94a3b8';

    output += `<span style="color:${color}${kind === 'comment' ? ';font-style:italic;opacity:0.8' : ''}">${text}</span>`;
    lastIndex = match.index + raw.length;
  }

  return output + escapeHtml(code.slice(lastIndex)) + (code.endsWith('\n') ? ' ' : '');
}

export function PythonCodeEditor({ value, onChange, onKeyDown, isDark, placeholder }: PythonCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [caretPos, setCaretPos] = useState({ top: 36, left: 16 });

  const highlighted = useMemo(() => highlightCode(value), [value]);

  const suggestions = useMemo(() => {
    if (!currentWord) return [];
    return CODE_WORDS.filter((word) => word.startsWith(currentWord) && word !== currentWord).slice(0, 8);
  }, [currentWord]);

  const updateCaretPosition = (textarea: HTMLTextAreaElement) => {
    const selStart = textarea.selectionStart;
    const textBefore = textarea.value.slice(0, selStart);
    const lines = textBefore.split('\n');
    const lineIndex = lines.length - 1;
    const colIndex = lines[lineIndex].length;

    const lineHeight = 20;
    const charWidth = 8.2;

    const top = Math.min(Math.max(16, textarea.clientHeight - 100), lineIndex * lineHeight + 36 - textarea.scrollTop);
    const left = Math.min(Math.max(16, textarea.clientWidth - 180), colIndex * charWidth + 16 - textarea.scrollLeft);

    setCaretPos({ top, left });
  };

  const complete = (word: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const prefix = value.slice(0, start).replace(/[A-Za-z_]\w*$/, '');
    const next = prefix + word + value.slice(start);
    onChange(next);
    setSuggestionsOpen(false);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = prefix.length + word.length;
    });
  };

  const updateCompletionContext = (textarea: HTMLTextAreaElement, nextValue: string) => {
    const word = nextValue.slice(0, textarea.selectionStart).match(/[A-Za-z_]\w*$/)?.[0] || '';
    setCurrentWord(word);
    updateCaretPosition(textarea);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  useEffect(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [value]);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' || (event.ctrlKey && event.code === 'Space') || (event.metaKey && event.code === 'Space')) {
      event.stopPropagation();
    }
    if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
      event.preventDefault();
      setSuggestionsOpen(true);
      setSuggestionIndex(0);
      if (textareaRef.current) {
        updateCaretPosition(textareaRef.current);
      }
      return;
    }
    if (suggestionsOpen && suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSuggestionIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSuggestionIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Tab' || event.key === 'Enter') {
        event.preventDefault();
        complete(suggestions[suggestionIndex]);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setSuggestionsOpen(false);
        return;
      }
    }
    onKeyDown?.(event);
  };

  return (
    <div data-code-editor="true" className={`relative flex-1 min-h-0 overflow-hidden ${isDark ? 'bg-secondary-950 text-secondary-100' : 'bg-white text-secondary-900'}`}>
      <pre
        ref={preRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed sm:text-sm ${
          isDark ? 'text-secondary-200' : 'text-secondary-900'
        }`}
        style={{ tabSize: 4 }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          updateCompletionContext(event.target, event.target.value);
          setSuggestionsOpen(true);
          setSuggestionIndex(0);
        }}
        onClick={(event) => updateCompletionContext(event.currentTarget, event.currentTarget.value)}
        onKeyUp={(event) => updateCompletionContext(event.currentTarget, event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        style={{ tabSize: 4 }}
        className={`relative z-10 h-full w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed caret-primary-400 outline-none sm:text-sm ${
          isDark
            ? 'text-transparent placeholder:text-secondary-600 selection:bg-primary-800/50'
            : 'text-transparent placeholder:text-secondary-400 selection:bg-primary-200/60'
        }`}
        autoFocus
      />
      {suggestionsOpen && suggestions.length > 0 && (
        <div
          className={`absolute z-30 min-w-44 overflow-hidden rounded-lg border shadow-2xl transition-all ${
            isDark ? 'border-secondary-700 bg-secondary-900/95 backdrop-blur-md' : 'border-secondary-300 bg-white/95 backdrop-blur-md'
          }`}
          style={{ top: `${caretPos.top}px`, left: `${caretPos.left}px` }}
        >
          <div className={`px-2 py-1 text-[10px] font-sans font-semibold border-b ${isDark ? 'border-secondary-800 text-secondary-400' : 'border-secondary-200 text-secondary-500'}`}>
            Oto Tamamlama (Tab / Enter)
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                complete(suggestion);
              }}
              className={`block w-full px-3 py-1.5 text-left font-mono text-xs transition-colors ${
                index === suggestionIndex
                  ? isDark
                    ? 'bg-primary-900/80 text-primary-200 font-bold'
                    : 'bg-primary-100 text-primary-800 font-bold'
                  : isDark
                  ? 'text-secondary-200 hover:bg-secondary-800'
                  : 'text-secondary-700 hover:bg-secondary-100'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
