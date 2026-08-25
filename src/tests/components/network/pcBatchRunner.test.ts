import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDefaultFs,
  writeFile,
  makeDir,
} from '../../../components/network/pc-panel/pcFileSystem';
import {
  resolveBatchFilePath,
  substituteBatchVariables,
  executeBatchScript,
} from '../../../components/network/pc-panel/pcBatchRunner';

describe('pcBatchRunner Module', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('resolveBatchFilePath', () => {
    it('should resolve batch file by exact filename in current directory', () => {
      const fs = createDefaultFs();
      writeFile(fs, 'C:\\test.bat', '@echo off\necho hello');
      const resolved = resolveBatchFilePath(fs, 'C:\\', 'test.bat');
      expect(resolved).toBe('C:\\test.bat');
    });

    it('should resolve batch file without extension', () => {
      const fs = createDefaultFs();
      writeFile(fs, 'C:\\setup.bat', 'echo setup');
      const resolved = resolveBatchFilePath(fs, 'C:\\', 'setup');
      expect(resolved).toBe('C:\\setup.bat');
    });

    it('should resolve batch file in C:\\CODE folder', () => {
      const fs = createDefaultFs();
      makeDir(fs, 'C:\\CODE');
      writeFile(fs, 'C:\\CODE\\tool.bat', 'echo tool');
      const resolved = resolveBatchFilePath(fs, 'C:\\', 'tool');
      expect(resolved).toBe('C:\\CODE\\tool.bat');
    });

    it('should return null if file does not exist', () => {
      const fs = createDefaultFs();
      const resolved = resolveBatchFilePath(fs, 'C:\\', 'nonexistent');
      expect(resolved).toBeNull();
    });
  });

  describe('substituteBatchVariables', () => {
    it('should substitute positional arguments %0..%9 and %*', () => {
      const line = 'echo Script %0 arg1=%1 arg2=%2 all=%*';
      const result = substituteBatchVariables(line, {}, ['first', 'second'], 'C:\\run.bat');
      expect(result).toBe('echo Script run.bat arg1=first arg2=second all=first second');
    });

    it('should substitute environment variables %VAR%', () => {
      const env = { TARGET_IP: '192.168.1.100', MODE: 'TEST' };
      const line = 'ping %TARGET_IP% -mode %MODE% %MISSING%';
      const result = substituteBatchVariables(line, env, [], 'test.bat');
      expect(result).toBe('ping 192.168.1.100 -mode TEST ');
    });
  });

  describe('executeBatchScript', () => {
    it('should execute batch lines sequentially and handle @echo off and variables', async () => {
      const fs = createDefaultFs();
      const outputs: string[] = [];
      const executedCommands: string[] = [];

      const script = `@echo off
rem This is a comment
set HOST=10.0.0.1
echo Host is %HOST%
ping %HOST%
`;

      await executeBatchScript({
        fs,
        scriptPath: 'C:\\test.bat',
        content: script,
        runSingleCommand: (cmd) => {
          executedCommands.push(cmd);
        },
        emitOutput: (_type, content) => {
          outputs.push(content);
        },
      });

      expect(outputs).toContain('Host is 10.0.0.1');
      expect(executedCommands).toContain('ping 10.0.0.1');
    });

    it('should handle goto labels in batch script', async () => {
      const fs = createDefaultFs();
      const outputs: string[] = [];

      const script = `@echo off
goto SKIP
echo This line should be skipped
:SKIP
echo Jumped to label
`;

      await executeBatchScript({
        fs,
        scriptPath: 'C:\\goto.bat',
        content: script,
        runSingleCommand: () => {},
        emitOutput: (_type, content) => {
          outputs.push(content);
        },
      });

      expect(outputs).not.toContain('This line should be skipped');
      expect(outputs).toContain('Jumped to label');
    });

    it('should handle call for nested batch scripts', async () => {
      const fs = createDefaultFs();
      writeFile(fs, 'C:\\child.bat', '@echo off\necho Child output arg=%1');
      const outputs: string[] = [];

      const parentScript = `@echo off
echo Parent start
call child.bat hello
echo Parent end
`;

      await executeBatchScript({
        fs,
        scriptPath: 'C:\\parent.bat',
        content: parentScript,
        runSingleCommand: () => {},
        emitOutput: (_type, content) => {
          outputs.push(content);
        },
      });

      expect(outputs).toEqual([
        'Parent start',
        'Child output arg=hello',
        'Parent end',
      ]);
    });
  });
});
