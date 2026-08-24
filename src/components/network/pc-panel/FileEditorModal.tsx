'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Save, Play, FileCode, FilePlus, FolderOpen, Minus, Plus, Scissors, Copy, ClipboardPaste, Trash2, ListChecks, Undo2, Redo2, WrapText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PythonCodeEditor } from './PythonCodeEditor';
import { ResizablePortalWindow } from './ResizablePortalWindow';

interface FileEditorModalProps {
  open: boolean;
  filePath: string;
  initialContent: string;
  language?: string;
  isDark?: boolean;
  onSave: (content: string) => void;
  onRunPython?: (content: string) => void;
  onClose: () => void;
}

export function FileEditorModal({
  open,
  filePath,
  initialContent,
  language = 'tr',
  isDark = true,
  onSave,
  onRunPython,
  onClose,
}: FileEditorModalProps) {
  const [content, setContent] = useState(initialContent);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyReady = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(initialContent);
    setHistory([initialContent]);
    setHistoryIndex(0);
    historyReady.current = true;
  }, [initialContent, open]);

  const updateContent = (next: string) => {
    setContent(next);
    if (!historyReady.current) return;
    setHistory(previous => [...previous.slice(0, historyIndex + 1), next].slice(-100));
    setHistoryIndex(previous => Math.min(previous + 1, 99));
  };

  const undo = () => {
    if (historyIndex === 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    setContent(history[nextIndex]);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    setContent(history[nextIndex]);
  };

  // The editor is rendered in a portal above the PC panel. Consume Escape at
  // the window capture phase so the PC panel's global Escape navigation does
  // not close the panel after closing the editor.
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };

    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>('div[data-code-editor="true"] textarea');
        textarea?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  const fileName = filePath.split(/[\\/]/).pop() || filePath;
  const isPythonFile = fileName.toLowerCase().endsWith('.py');

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  const handleRun = () => {
    onSave(content);
    if (onRunPython) {
      onRunPython(content);
    }
    onClose();
  };

  const handleNewFile = () => updateContent('');
  const handleOpenFile = () => fileInputRef.current?.click();

  const editSelected = async (action: 'cut' | 'copy' | 'paste' | 'delete' | 'selectAll') => {
    const textarea = document.querySelector<HTMLTextAreaElement>('div[data-code-editor="true"] textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (action === 'selectAll') textarea.select();
    if (action === 'delete') updateContent(content.slice(0, start) + content.slice(end));
    if (action === 'copy' || action === 'cut') {
      await navigator.clipboard?.writeText(content.slice(start, end));
      if (action === 'cut') updateContent(content.slice(0, start) + content.slice(end));
    }
    if (action === 'paste') {
      const text = await navigator.clipboard?.readText();
      if (text) updateContent(content.slice(0, start) + text + content.slice(end));
    }
    textarea.focus();
  };

  const lineCount = content.split('\n').length;
  const charCount = content.length;

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Do not let editor shortcuts trigger the main application's keyboard handlers.
    if (e.key === 'Tab' || ((e.ctrlKey || e.metaKey) && e.code === 'Space')) {
      e.stopPropagation();
    }

    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault();
      return;
    }

    // Save & Run shortcut: F5 or Ctrl+Enter or Cmd+Enter
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
      e.preventDefault();
      handleRun();
      return;
    }

    // Save shortcut: Ctrl + S or Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    // Handle Tab key inside editor
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Shift+Tab: Outdent
        const before = content.substring(0, start);
        const selected = content.substring(start, end);
        const after = content.substring(end);

        if (start === end) {
          const lineStart = before.lastIndexOf('\n') + 1;
          const linePrefix = content.substring(lineStart, start);
          const spacesToRemove = linePrefix.match(/ {1,4}$/)?.[0].length || 0;
          if (spacesToRemove > 0) {
            const newContent = content.substring(0, start - spacesToRemove) + content.substring(start);
            setContent(newContent);
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = start - spacesToRemove;
            }, 0);
          }
        } else {
          const unindented = selected.replace(/^ {1,4}/gm, '');
          setContent(before + unindented + after);
          setTimeout(() => {
            textarea.selectionStart = start;
            textarea.selectionEnd = start + unindented.length;
          }, 0);
        }
      } else {
        // Tab: Indent with 4 spaces
        const tabSpaces = '    ';
        if (start === end) {
          const newContent = content.substring(0, start) + tabSpaces + content.substring(end);
          setContent(newContent);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
          }, 0);
        } else {
          const lines = content.substring(start, end).split('\n');
          const indented = lines.map(line => tabSpaces + line).join('\n');
          const newContent = content.substring(0, start) + indented + content.substring(end);
          setContent(newContent);
          setTimeout(() => {
            textarea.selectionStart = start;
            textarea.selectionEnd = start + indented.length;
          }, 0);
        }
      }
      return;
    }

    // Handle Enter key for newline & auto-indentation
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.stopPropagation();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const currentLine = content.substring(lineStart, start);
      const indentMatch = currentLine.match(/^[\t ]*/);
      let currentIndent = indentMatch ? indentMatch[0] : '';

      if (currentLine.trimEnd().endsWith(':')) {
        currentIndent += '    ';
      }

      e.preventDefault();
      const insertText = '\n' + currentIndent;
      const newContent = content.substring(0, start) + insertText + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
      }, 0);
    }
  };

  const headerTitle = (
    <div className="flex items-center gap-2 min-w-0 truncate font-mono text-sm font-semibold tracking-wide">
      <span className="truncate">{fileName}</span>
      {isPythonFile && (
        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-sans shrink-0">
          Python Script
        </span>
      )}
    </div>
  );

  const headerActions = (
    <div className="flex max-w-[min(70vw,680px)] flex-nowrap items-center justify-end gap-0.5 overflow-x-auto">
      <Button size="sm" variant="ghost" title="Yeni" onClick={handleNewFile} className="h-8 w-8 p-0 shrink-0"><FilePlus className="h-3.5 w-3.5" /></Button>
      <Button size="sm" variant="ghost" title="Aç" onClick={handleOpenFile} className="h-8 w-8 p-0 shrink-0"><FolderOpen className="h-3.5 w-3.5" /></Button>
      <Button size="sm" variant="outline" title="Kaydet" onClick={handleSave} className="h-8 w-8 p-0 shrink-0"><Save className="h-3.5 w-3.5" /></Button>
      <span className="mx-1 h-6 w-px bg-secondary-600/40 shrink-0" aria-hidden="true" />
      <Button size="sm" variant="ghost" title="Geri al" disabled={historyIndex === 0} onClick={undo} className="h-8 w-8 p-0 shrink-0"><Undo2 className="h-3.5 w-3.5" /></Button>
      <Button size="sm" variant="ghost" title="Yinele" disabled={historyIndex >= history.length - 1} onClick={redo} className="h-8 w-8 p-0 shrink-0"><Redo2 className="h-3.5 w-3.5" /></Button>
      <span className="mx-1 h-6 w-px bg-secondary-600/40 shrink-0" aria-hidden="true" />
      <Button size="sm" variant="ghost" title="Kes" onClick={() => void editSelected('cut')} className="h-8 w-8 p-0 shrink-0"><Scissors className="h-3.5 w-3.5" /></Button>
      <Button size="sm" variant="ghost" title="Kopyala" onClick={() => void editSelected('copy')} className="h-8 w-8 p-0 shrink-0"><Copy className="h-3.5 w-3.5" /></Button>
      <Button size="sm" variant="ghost" title="Yapıştır" onClick={() => void editSelected('paste')} className="h-8 w-8 p-0 shrink-0"><ClipboardPaste className="h-3.5 w-3.5" /></Button>
      <Button size="sm" variant="ghost" title="Sil" onClick={() => void editSelected('delete')} className="h-8 w-8 p-0 shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
      <Button size="sm" variant="ghost" title="Tümünü seç" onClick={() => void editSelected('selectAll')} className="h-8 w-8 p-0 shrink-0"><ListChecks className="h-3.5 w-3.5" /></Button>
      <span className="mx-1 h-6 w-px bg-secondary-600/40 shrink-0" aria-hidden="true" />
      <Button size="sm" variant="ghost" title="Yazı küçült" disabled={fontSize <= 12} onClick={() => setFontSize(size => Math.max(12, size - 1))} className="h-8 w-8 p-0 shrink-0"><Minus className="h-3.5 w-3.5" /></Button>
      <span className="min-w-8 text-center text-xs font-mono shrink-0">{fontSize}</span>
      <Button size="sm" variant="ghost" title="Yazı büyüt" disabled={fontSize >= 20} onClick={() => setFontSize(size => Math.min(20, size + 1))} className="h-8 w-8 p-0 shrink-0"><Plus className="h-3.5 w-3.5" /></Button>
      <span className="mx-1 h-6 w-px bg-secondary-600/40 shrink-0" aria-hidden="true" />
      <Button size="sm" variant={wordWrap ? 'default' : 'ghost'} title="Satır kaydırma" onClick={() => setWordWrap(value => !value)} className="h-8 w-8 p-0 shrink-0"><WrapText className="h-3.5 w-3.5" /></Button>
      {isPythonFile && (
        <Button
          size="sm"
          variant="default"
          onClick={handleRun}
          title={language === 'tr' ? "Kaydet ve CMD'de Çalıştır (F5 / Ctrl+Enter)" : "Save & Run in CMD (F5 / Ctrl+Enter)"}
          className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 shadow-sm transition-colors shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {language === 'tr' ? 'Kaydet & Çalıştır' : 'Save & Run'}
        </Button>
      )}
    </div>
  );

  const footerBar = (
    <div
      className={`px-4 py-1.5 flex justify-between items-center text-xs font-mono border-t ${
        isDark
          ? 'border-secondary-800 bg-secondary-900/40 text-secondary-400'
          : 'border-secondary-200 bg-secondary-100/60 text-secondary-600'
      }`}
    >
      <span className="truncate mr-2">Dosya: {filePath}</span>
      <div className="flex gap-4 shrink-0">
        <span>Satır: {lineCount}</span>
        <span>Karakter: {charCount}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );

  return (
    <ResizablePortalWindow
      isOpen={open}
      onClose={onClose}
      title={headerTitle}
      icon={<FileCode className="w-5 h-5 text-primary-500 shrink-0" />}
      isDark={isDark}
      defaultWidth={900}
      defaultHeight={620}
      minWidth={320}
      minHeight={240}
      footerBar={footerBar}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".py,.txt,.json,.js,.ts,.tsx,.html,.css"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void file.text().then(text => {
            setContent(text);
            setHistory([text]);
            setHistoryIndex(0);
          });
          event.target.value = '';
        }}
      />
      <div className={isDark
        ? 'flex min-h-10 flex-wrap items-center gap-0.5 border-b border-secondary-800 bg-secondary-900/80 px-2 py-1'
        : 'flex min-h-10 flex-wrap items-center gap-0.5 border-b border-secondary-200 bg-secondary-100 px-2 py-1'}>
        {headerActions}
      </div>
      <div data-code-editor="true" className="flex-1 relative flex flex-col font-mono text-sm overflow-hidden">
        <PythonCodeEditor
          value={content}
          onChange={updateContent}
          onKeyDown={handleTextareaKeyDown}
          fontSize={fontSize}
          wordWrap={wordWrap}
          isDark={isDark}
          placeholder={
            isPythonFile
              ? '# Python kodunuzu buraya yazın...\nprint("Merhaba Dunya!")'
              : '# Metin veya kod yazın...'
          }
        />
      </div>
    </ResizablePortalWindow>
  );
}
