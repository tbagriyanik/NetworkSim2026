import { stripInlineComment, splitOutsideQuotesAndParens } from './pcPythonRunnerHelpers';

export type Statement =
  | { type: 'line'; text: string }
  | { type: 'if'; branches: { condition: string | null; body: Statement[] }[] }
  | { type: 'while'; condition: string; body: Statement[]; elseBody?: Statement[] }
  | { type: 'for'; varName: string; iterableExpr: string; body: Statement[]; elseBody?: Statement[] }
  | { type: 'def'; funcName: string; paramNames: string[]; paramDefaults: Record<string, string>; body: Statement[]; decorators?: string[] }
  | { type: 'class'; className: string; baseClasses: string[]; body: Statement[]; decorators?: string[] }
  | { type: 'yield'; expr: string; isYieldFrom?: boolean }
  | {
    type: 'try';
    body: Statement[];
    exceptBranches: { errorType: string | null; varName: string | null; body: Statement[] }[];
    elseBody?: Statement[];
    finallyBody?: Statement[];
  }
  | { type: 'with'; contextExpr: string; varName: string | null; body: Statement[] };

export interface ParsedLine {
  indent: number;
  text: string;
}

export function parseProgramLines(rawLines: string[]): ParsedLine[] {
  const parsedLines: ParsedLine[] = [];
  let continuationDepth = 0;
  let tripleQuoteChar: string | null = null;
  let accumulatedTripleLines: string[] = [];
  let tripleIndent = 0;

  for (const l of rawLines) {
    if (tripleQuoteChar !== null) {
      accumulatedTripleLines.push(l);
      if (l.includes(tripleQuoteChar)) {
        const fullBlock = accumulatedTripleLines.join('\n');
        parsedLines.push({ indent: tripleIndent, text: fullBlock.trim() });
        tripleQuoteChar = null;
        accumulatedTripleLines = [];
      }
      continue;
    }

    const stripped = stripInlineComment(l);
    if (!stripped.trim() || stripped.trim().startsWith('#')) continue;
    const indentMatch = stripped.match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0].replace(/\t/g, '    ').length : 0;
    const text = stripped.trim();

    const countDouble = (text.match(/"""/g) || []).length;
    const countSingle = (text.match(/'''/g) || []).length;
    if (countDouble % 2 === 1) {
      tripleQuoteChar = '"""';
      tripleIndent = indent;
      accumulatedTripleLines = [l];
      continue;
    } else if (countSingle % 2 === 1) {
      tripleQuoteChar = "'''";
      tripleIndent = indent;
      accumulatedTripleLines = [l];
      continue;
    }

    if (continuationDepth > 0 && parsedLines.length > 0) {
      parsedLines[parsedLines.length - 1].text += ` ${text}`;
    } else {
      const subStmts = splitOutsideQuotesAndParens(text, ';').map(s => s.trim()).filter(Boolean);
      for (const sub of subStmts) {
        parsedLines.push({ indent, text: sub });
      }
    }

    let inQuote = '';
    for (const ch of text) {
      if (inQuote) {
        if (ch === inQuote) inQuote = '';
      } else if (ch === '"' || ch === "'") {
        inQuote = ch;
      } else if ('([{'.includes(ch)) continuationDepth++;
      else if (')]}'.includes(ch)) continuationDepth = Math.max(0, continuationDepth - 1);
    }
  }

  if (tripleQuoteChar !== null && accumulatedTripleLines.length > 0) {
    parsedLines.push({ indent: tripleIndent, text: accumulatedTripleLines.join('\n').trim() });
  }

  return parsedLines;
}

export function parseBlockAt(
  parsedLines: ParsedLine[],
  index: number,
  minIndent: number
): { statements: Statement[]; nextIndex: number } {
  const statements: Statement[] = [];
  let i = index;

  while (i < parsedLines.length) {
    if (parsedLines[i].indent < minIndent) break;

    const decorators: string[] = [];
    while (i < parsedLines.length && parsedLines[i].indent >= minIndent && parsedLines[i].text.startsWith('@')) {
      decorators.push(parsedLines[i].text.slice(1).trim());
      i++;
    }
    if (i >= parsedLines.length || parsedLines[i].indent < minIndent) break;

    const line = parsedLines[i];

    // Handle class definition
    const classMatch = /^class\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\((.*?)\))?:\s*(.*)$/.exec(line.text);
    if (classMatch) {
      const className = classMatch[1];
      const basesStr = classMatch[2] ? classMatch[2].trim() : '';
      const inlineRest = classMatch[3].trim();
      const baseClasses = basesStr ? splitOutsideQuotesAndParens(basesStr, ',').map(b => b.trim()).filter(Boolean) : [];
      if (inlineRest) {
        statements.push({
          type: 'class',
          className,
          baseClasses,
          body: [{ type: 'line', text: inlineRest }],
          decorators: decorators.length > 0 ? decorators : undefined,
        });
        i++;
      } else {
        const bodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
        statements.push({
          type: 'class',
          className,
          baseClasses,
          body: bodyRes.statements,
          decorators: decorators.length > 0 ? decorators : undefined,
        });
        i = bodyRes.nextIndex;
      }
      continue;
    }

    // Handle yield statement
    const yieldMatch = /^yield(?:\s+from)?(?:\s+(.*))?$/.exec(line.text);
    if (yieldMatch) {
      const isYieldFrom = line.text.startsWith('yield from');
      const expr = yieldMatch[1] ? yieldMatch[1].trim() : 'None';
      statements.push({ type: 'yield', expr, isYieldFrom });
      i++;
      continue;
    }

    // Handle if / elif / else
    const ifMatch = /^if(?:\s+|(?=\())(.+):\s*$/.exec(line.text);
    if (ifMatch) {
      const branches: { condition: string | null; body: Statement[] }[] = [];
      const cond = ifMatch[1];
      const bodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
      branches.push({ condition: cond, body: bodyRes.statements });
      i = bodyRes.nextIndex;

      while (i < parsedLines.length && parsedLines[i].indent === line.indent) {
        const elifMatch = /^elif(?:\s+|(?=\())(.+):\s*$/.exec(parsedLines[i].text);
        const elseMatch = /^else:\s*$/.exec(parsedLines[i].text);

        if (elifMatch) {
          const elifBodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
          branches.push({ condition: elifMatch[1], body: elifBodyRes.statements });
          i = elifBodyRes.nextIndex;
        } else if (elseMatch) {
          const elseBodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
          branches.push({ condition: null, body: elseBodyRes.statements });
          i = elseBodyRes.nextIndex;
          break;
        } else {
          break;
        }
      }
      statements.push({ type: 'if', branches });
      continue;
    }

    // Handle while loop
    const whileMatch = /^while(?:\s+|(?=\())(.+):\s*$/.exec(line.text);
    if (whileMatch) {
      const cond = whileMatch[1];
      const bodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
      let nextI = bodyRes.nextIndex;
      let elseBody: Statement[] | undefined = undefined;

      if (nextI < parsedLines.length && parsedLines[nextI].indent === line.indent) {
        const elseMatch = /^else:\s*$/.exec(parsedLines[nextI].text);
        if (elseMatch) {
          const elseRes = parseBlockAt(parsedLines, nextI + 1, line.indent + 1);
          elseBody = elseRes.statements;
          nextI = elseRes.nextIndex;
        }
      }

      statements.push({ type: 'while', condition: cond, body: bodyRes.statements, elseBody });
      i = nextI;
      continue;
    }

    // Handle for loop
    const forMatch = /^for(?:\s+|(?=\())(.+?)\s+in\s+(.+):\s*$/.exec(line.text);
    if (forMatch) {
      const varName = forMatch[1];
      const iterableExpr = forMatch[2];
      const bodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
      let nextI = bodyRes.nextIndex;
      let elseBody: Statement[] | undefined = undefined;

      if (nextI < parsedLines.length && parsedLines[nextI].indent === line.indent) {
        const elseMatch = /^else:\s*$/.exec(parsedLines[nextI].text);
        if (elseMatch) {
          const elseRes = parseBlockAt(parsedLines, nextI + 1, line.indent + 1);
          elseBody = elseRes.statements;
          nextI = elseRes.nextIndex;
        }
      }

      statements.push({ type: 'for', varName, iterableExpr, body: bodyRes.statements, elseBody });
      i = nextI;
      continue;
    }

    // Handle def function definition
    const defMatch = /^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\):\s*(.*)$/.exec(line.text);
    if (defMatch) {
      const funcName = defMatch[1];
      const paramsStr = defMatch[2].trim();
      const inlineRest = defMatch[3].trim();
      const paramNames: string[] = [];
      const paramDefaults: Record<string, string> = {};
      if (paramsStr) {
        const params = splitOutsideQuotesAndParens(paramsStr, ',');
        for (const p of params) {
          const eqIdx = p.indexOf('=');
          const name = (eqIdx >= 0 ? p.slice(0, eqIdx) : p).trim();
          paramNames.push(name);
          if (eqIdx >= 0) {
            paramDefaults[name] = p.slice(eqIdx + 1).trim();
          }
        }
      }
      if (inlineRest) {
        statements.push({
          type: 'def',
          funcName,
          paramNames,
          paramDefaults,
          body: [{ type: 'line', text: inlineRest }],
          decorators: decorators.length > 0 ? decorators : undefined,
        });
        i++;
      } else {
        const bodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
        statements.push({
          type: 'def',
          funcName,
          paramNames,
          paramDefaults,
          body: bodyRes.statements,
          decorators: decorators.length > 0 ? decorators : undefined,
        });
        i = bodyRes.nextIndex;
      }
      continue;
    }

    // Handle try / except / else / finally
    const tryMatch = /^try:\s*$/.exec(line.text);
    if (tryMatch) {
      const bodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
      const exceptBranches: { errorType: string | null; varName: string | null; body: Statement[] }[] = [];
      let nextI = bodyRes.nextIndex;
      let elseBody: Statement[] | undefined = undefined;
      let finallyBody: Statement[] | undefined = undefined;

      while (nextI < parsedLines.length && parsedLines[nextI].indent === line.indent) {
        const exceptMatch = /^except(?:\s+([a-zA-Z0-9_.]+)(?:\s+as\s+([a-zA-Z0-9_]+))?)?\s*:\s*$/.exec(parsedLines[nextI].text);
        const elseMatch = /^else:\s*$/.exec(parsedLines[nextI].text);
        const finallyMatch = /^finally:\s*$/.exec(parsedLines[nextI].text);

        if (exceptMatch) {
          const exBodyRes = parseBlockAt(parsedLines, nextI + 1, line.indent + 1);
          exceptBranches.push({
            errorType: exceptMatch[1] || null,
            varName: exceptMatch[2] || null,
            body: exBodyRes.statements,
          });
          nextI = exBodyRes.nextIndex;
        } else if (elseMatch) {
          const elseRes = parseBlockAt(parsedLines, nextI + 1, line.indent + 1);
          elseBody = elseRes.statements;
          nextI = elseRes.nextIndex;
        } else if (finallyMatch) {
          const finRes = parseBlockAt(parsedLines, nextI + 1, line.indent + 1);
          finallyBody = finRes.statements;
          nextI = finRes.nextIndex;
        } else {
          break;
        }
      }

      statements.push({ type: 'try', body: bodyRes.statements, exceptBranches, elseBody, finallyBody });
      i = nextI;
      continue;
    }

    // Handle with statement: with <expr> [as <var>]:
    const withMatch = /^with\s+(.+?)(?:\s+as\s+([a-zA-Z0-9_]+))?:\s*$/.exec(line.text);
    if (withMatch) {
      const contextExpr = withMatch[1].trim();
      const varName = withMatch[2] ? withMatch[2].trim() : null;
      const bodyRes = parseBlockAt(parsedLines, i + 1, line.indent + 1);
      statements.push({ type: 'with', contextExpr, varName, body: bodyRes.statements });
      i = bodyRes.nextIndex;
      continue;
    }

    // Simple line statement
    statements.push({ type: 'line', text: line.text });
    i++;
  }

  return { statements, nextIndex: i };
}
