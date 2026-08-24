'use client';

import { useMemo, useRef, useState } from 'react';

interface PythonCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isDark: boolean;
  placeholder?: string;
}

const PYTHON_WORDS = [
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
  'del', 'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'None', 'not', 'or', 'pass', 'raise',
  'return', 'True', 'try', 'while', 'with', 'yield',
  'print', 'len', 'range', 'str', 'int', 'float', 'bool', 'list', 'dict',
  'set', 'tuple', 'enumerate', 'zip', 'open', 'input', 'sum', 'min', 'max',
  'abs', 'round', 'sorted', 'reversed', 'type', 'isinstance',
  'math', 'random', 'json', 'datetime', 'os', 'sys',
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}

function highlightPython(code: string): string {
  const token = /(#.*$|(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b\d+(?:\.\d+)?\b|\b(?:True|False|None)\b|\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|not|or|pass|raise|return|try|while|with|yield)\b|\b(?:print|len|range|str|int|float|bool|list|dict|set|tuple|enumerate|zip|open|input|sum|min|max|abs|round|sorted|reversed|type|isinstance)\b)/gm;
  let output = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = token.exec(code))) {
    output += escapeHtml(code.slice(lastIndex, match.index));
    const text = escapeHtml(match[0]);
    const kind = match[0].startsWith('#') ? 'comment' : match[0][0] === '"' || match[0][0] === "'" ? 'string' : /^\d/.test(match[0]) ? 'number' : /^(True|False|None)$/.test(match[0]) ? 'constant' : /^(print|len|range|str|int|float|bool|list|dict|set|tuple|enumerate|zip|open|input|sum|min|max|abs|round|sorted|reversed|type|isinstance)$/.test(match[0]) ? 'builtin' : 'keyword';
    const color = kind === 'keyword' ? '#c084fc' : kind === 'builtin' ? '#67e8f9' : kind === 'string' ? '#86efac' : kind === 'number' ? '#fbbf24' : kind === 'constant' ? '#fb7185' : '#94a3b8';
    output += `<span class="py-${kind}" style="color:${color}${kind === 'comment' ? ';font-style:italic' : ''}">${text}</span>`;
    lastIndex = match.index + match[0].length;
  }
  return output + escapeHtml(code.slice(lastIndex)) + (code.endsWith('\n') ? ' ' : '');
}

export function PythonCodeEditor({ value, onChange, onKeyDown, isDark, placeholder }: PythonCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const highlighted = useMemo(() => highlightPython(value), [value]);
  const suggestions = currentWord.length > 0
    ? PYTHON_WORDS.filter((word) => word.startsWith(currentWord) && word !== currentWord).slice(0, 8)
    : [];

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
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Keep editor navigation/completion shortcuts away from the canvas/global shortcuts.
    if (event.key === 'Tab' || (event.ctrlKey && event.code === 'Space') || (event.metaKey && event.code === 'Space')) {
      event.stopPropagation();
    }
    if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
      event.preventDefault();
      setSuggestionsOpen(true);
      setSuggestionIndex(0);
      return;
    }
    if (suggestionsOpen && suggestions.length > 0) {
      if (event.key === 'ArrowDown') { event.preventDefault(); setSuggestionIndex((i) => (i + 1) % suggestions.length); return; }
      if (event.key === 'ArrowUp') { event.preventDefault(); setSuggestionIndex((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (event.key === 'Tab' || event.key === 'Enter') { event.preventDefault(); complete(suggestions[suggestionIndex]); return; }
      if (event.key === 'Escape') { event.preventDefault(); setSuggestionsOpen(false); return; }
    }
    onKeyDown?.(event);
  };

  return <div data-code-editor="true" className={`relative flex-1 min-h-0 overflow-hidden ${isDark ? 'bg-secondary-950' : 'bg-white'}`}>
    <pre aria-hidden="true" className={`pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed sm:text-sm ${isDark ? 'text-secondary-200' : 'text-secondary-900'} py-highlight`} dangerouslySetInnerHTML={{ __html: highlighted }} />
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => { onChange(event.target.value); updateCompletionContext(event.target, event.target.value); setSuggestionsOpen(true); setSuggestionIndex(0); }}
      onClick={(event) => updateCompletionContext(event.currentTarget, event.currentTarget.value)}
      onKeyUp={(event) => updateCompletionContext(event.currentTarget, event.currentTarget.value)}
      onKeyDown={handleKeyDown}
      onScroll={(event) => { const target = event.currentTarget; const layer = target.previousElementSibling as HTMLElement | null; if (layer) { layer.scrollTop = target.scrollTop; layer.scrollLeft = target.scrollLeft; } }}
      placeholder={placeholder}
      spellCheck={false}
      className={`relative z-10 h-full w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed caret-primary-400 outline-none sm:text-sm ${isDark ? 'text-transparent placeholder:text-secondary-600 selection:bg-primary-800/50' : 'text-transparent placeholder:text-secondary-400 selection:bg-primary-200/60'}`}
      autoFocus
    />
    {suggestionsOpen && suggestions.length > 0 && <div className={`absolute left-4 top-12 z-20 min-w-44 overflow-hidden rounded-md border shadow-xl ${isDark ? 'border-secondary-700 bg-secondary-900' : 'border-secondary-300 bg-white'}`}>
      {suggestions.map((suggestion, index) => <button key={suggestion} type="button" onMouseDown={(event) => { event.preventDefault(); complete(suggestion); }} className={`block w-full px-3 py-1.5 text-left font-mono text-xs ${index === suggestionIndex ? (isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800') : (isDark ? 'text-secondary-200 hover:bg-secondary-800' : 'text-secondary-700 hover:bg-secondary-100')}`}>{suggestion}</button>)}
    </div>}
  </div>;
}
