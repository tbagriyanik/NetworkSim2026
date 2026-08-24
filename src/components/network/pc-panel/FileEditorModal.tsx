'use client';

import React, { useState, useEffect } from 'react';
import { Save, Play, FileCode } from 'lucide-react';
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

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, open]);

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
    <>
      {isPythonFile && (
        <Button
          size="sm"
          variant="default"
          onClick={handleRun}
          className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {language === 'tr' ? 'Kaydet & Çalıştır' : 'Save & Run'}
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={handleSave}
        className={`h-8 gap-1.5 text-xs px-3 ${
          isDark
            ? 'border-secondary-700 hover:bg-secondary-800 text-secondary-200'
            : 'border-secondary-300 hover:bg-secondary-100'
        }`}
      >
        <Save className="w-3.5 h-3.5" />
        {language === 'tr' ? 'Kaydet' : 'Save'}
      </Button>
    </>
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
      headerActions={headerActions}
      footerBar={footerBar}
    >
      <div data-code-editor="true" className="flex-1 relative flex flex-col font-mono text-sm overflow-hidden">
        {isPythonFile ? (
          <PythonCodeEditor
            value={content}
            onChange={setContent}
            onKeyDown={handleTextareaKeyDown}
            isDark={isDark}
            placeholder={'# Python kodunuzu buraya yazın...\nprint("Merhaba Dunya!")'}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            className={`flex-1 w-full h-full p-4 resize-none outline-none font-mono text-xs sm:text-sm leading-relaxed ${
              isDark
                ? 'bg-secondary-950 text-emerald-400 placeholder:text-secondary-600 selection:bg-primary-800'
                : 'bg-white text-secondary-900 placeholder:text-secondary-400 selection:bg-primary-200'
            }`}
            spellCheck={false}
            autoFocus
          />
        )}
      </div>
    </ResizablePortalWindow>
  );
}
