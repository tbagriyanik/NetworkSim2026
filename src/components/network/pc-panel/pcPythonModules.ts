import { PyComplex, pythonRange } from './pcPythonRunnerHelpers';

export const PYTHON_MODULES: Record<string, Record<string, unknown>> = {
  random: {
    randint: (a: unknown, b: unknown) => {
      const min = Math.ceil(Number(a || 0));
      const max = Math.floor(Number(b || 0));
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    random: () => Math.random(),
    choice: (seq: unknown) => {
      const arr = Array.isArray(seq) ? seq : [];
      if (arr.length === 0) return null;
      return arr[Math.floor(Math.random() * arr.length)];
    },
    shuffle: (seq: unknown) => {
      if (Array.isArray(seq)) {
        for (let i = seq.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [seq[i], seq[j]] = [seq[j], seq[i]];
        }
      }
      return seq;
    },
    randrange: (start: unknown, stop?: unknown, step?: unknown) => {
      const nums = pythonRange(
        Number(start),
        stop !== undefined ? Number(stop) : (undefined as unknown as number),
        step !== undefined ? Number(step) : 1
      );
      if (nums.length === 0) return 0;
      return nums[Math.floor(Math.random() * nums.length)];
    },
    uniform: (a: unknown, b: unknown) => {
      const min = Number(a || 0);
      const max = Number(b || 0);
      return min + Math.random() * (max - min);
    },
  },
  itertools: {
    product: (...args: unknown[]) => {
      const iterables = args.map(a => (Array.isArray(a) ? a : typeof a === 'string' ? a.split('') : Array.from((a as Iterable<unknown>) || [])));
      if (iterables.length === 0) return [];
      let result: unknown[][] = [[]];
      for (const pool of iterables) {
        const nextResult: unknown[][] = [];
        for (const x of result) {
          for (const y of pool) {
            nextResult.push([...x, y]);
          }
        }
        result = nextResult;
      }
      return result;
    },
    permutations: (iterable: unknown, r?: unknown) => {
      const arr = Array.isArray(iterable) ? iterable : String(iterable || '').split('');
      const n = arr.length;
      const k = r !== undefined ? Number(r) : n;
      if (k > n || k < 0) return [];
      const res: unknown[][] = [];
      const backtrack = (current: unknown[], used: boolean[]) => {
        if (current.length === k) {
          res.push([...current]);
          return;
        }
        for (let i = 0; i < n; i++) {
          if (used[i]) continue;
          used[i] = true;
          current.push(arr[i]);
          backtrack(current, used);
          current.pop();
          used[i] = false;
        }
      };
      backtrack([], Array.from({ length: n }, () => false));
      return res;
    },
    combinations: (iterable: unknown, r: unknown) => {
      const arr = Array.isArray(iterable) ? iterable : String(iterable || '').split('');
      const k = Number(r || 0);
      const n = arr.length;
      if (k > n || k <= 0) return [];
      const res: unknown[][] = [];
      const backtrack = (start: number, current: unknown[]) => {
        if (current.length === k) {
          res.push([...current]);
          return;
        }
        for (let i = start; i < n; i++) {
          current.push(arr[i]);
          backtrack(i + 1, current);
          current.pop();
        }
      };
      backtrack(0, []);
      return res;
    },
    chain: (...args: unknown[]) => {
      const res: unknown[] = [];
      for (const arg of args) {
        if (Array.isArray(arg)) res.push(...arg);
        else if (typeof arg === 'string') res.push(...arg.split(''));
      }
      return res;
    },
    repeat: (elem: unknown, n?: unknown) => {
      const count = n !== undefined ? Number(n) : 100;
      return Array.from({ length: Math.max(0, count) }, () => elem);
    },
  },
  calendar: {
    month: (theyear: unknown, themonth: unknown) => {
      const year = Number(theyear || 2026);
      const month = Number(themonth || 1);
      const monthNames = [
        '', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      if (month < 1 || month > 12) return '';
      const title = `   ${monthNames[month]} ${year}`;
      const header = 'Mo Tu We Th Fr Sa Su';

      const firstDate = new Date(year, month - 1, 1);
      const jsDay = firstDate.getDay();
      const firstWeekday = (jsDay + 6) % 7;
      const numDays = new Date(year, month, 0).getDate();

      const lines: string[] = [title, header];
      let currentLine: string[] = [];

      for (let i = 0; i < firstWeekday; i++) {
        currentLine.push('  ');
      }

      for (let day = 1; day <= numDays; day++) {
        currentLine.push(String(day).padStart(2, ' '));
        if (currentLine.length === 7) {
          lines.push(currentLine.join(' '));
          currentLine = [];
        }
      }
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
      }
      return lines.join('\n');
    },
    isleap: (year: unknown) => {
      const y = Number(year || 0);
      return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
    },
    leapdays: (y1: unknown, y2: unknown) => {
      const start = Number(y1 || 0);
      const end = Number(y2 || 0);
      let count = 0;
      for (let y = start; y < end; y++) {
        if ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) count++;
      }
      return count;
    },
    monthrange: (theyear: unknown, themonth: unknown) => {
      const year = Number(theyear || 2026);
      const month = Number(themonth || 1);
      const firstDate = new Date(year, month - 1, 1);
      const jsDay = firstDate.getDay();
      const firstWeekday = (jsDay + 6) % 7;
      const numDays = new Date(year, month, 0).getDate();
      return [firstWeekday, numDays];
    },
    monthcalendar: (theyear: unknown, themonth: unknown) => {
      const year = Number(theyear || 2026);
      const month = Number(themonth || 1);
      const firstDate = new Date(year, month - 1, 1);
      const jsDay = firstDate.getDay();
      const firstWeekday = (jsDay + 6) % 7;
      const numDays = new Date(year, month, 0).getDate();

      const weeks: number[][] = [];
      let currentWeek: number[] = [];
      for (let i = 0; i < firstWeekday; i++) {
        currentWeek.push(0);
      }
      for (let day = 1; day <= numDays; day++) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
      }
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(0);
        weeks.push(currentWeek);
      }
      return weeks;
    },
  },
  math: {
    pi: Math.PI,
    e: Math.E,
    sqrt: (x: unknown) => Math.sqrt(Number(x || 0)),
    trunc: (x: unknown) => Math.trunc(Number(x || 0)),
    pow: (x: unknown, y: unknown) => Math.pow(Number(x || 0), Number(y || 0)),
    sin: (x: unknown) => Math.sin(Number(x || 0)),
    cos: (x: unknown) => Math.cos(Number(x || 0)),
    tan: (x: unknown) => Math.tan(Number(x || 0)),
    asin: (x: unknown) => Math.asin(Number(x || 0)),
    acos: (x: unknown) => Math.acos(Number(x || 0)),
    atan: (x: unknown) => Math.atan(Number(x || 0)),
    log: (x: unknown, base?: unknown) => {
      const num = Number(x || 0);
      return base !== undefined ? Math.log(num) / Math.log(Number(base)) : Math.log(num);
    },
    log10: (x: unknown) => Math.log10(Number(x || 0)),
    floor: (x: unknown) => Math.floor(Number(x || 0)),
    ceil: (x: unknown) => Math.ceil(Number(x || 0)),
    fabs: (x: unknown) => Math.abs(Number(x || 0)),
    radians: (deg: unknown) => Number(deg || 0) * (Math.PI / 180),
    degrees: (rad: unknown) => Number(rad || 0) * (180 / Math.PI),
  },
  cmath: {
    pi: Math.PI,
    e: Math.E,
    sqrt: (x: unknown) => {
      if (x instanceof PyComplex) {
        const r = x.real;
        const i = x.imag;
        const mod = Math.sqrt(r * r + i * i);
        const real = Math.sqrt((mod + r) / 2);
        const imag = Math.sign(i || 1) * Math.sqrt((mod - r) / 2);
        return new PyComplex(real, imag);
      }
      const num = Number(x || 0);
      if (num >= 0) {
        return new PyComplex(Math.sqrt(num), 0);
      } else {
        return new PyComplex(0, Math.sqrt(-num));
      }
    },
  },
  os: {
    name: 'nt',
    getcwd: () => 'C:\\',
    listdir: () => [],
    mkdir: () => null,
    remove: () => null,
    path: {
      join: (...args: unknown[]) => args.map(String).join('\\'),
      exists: () => true,
      isfile: () => true,
      isdir: () => true,
      basename: (p: unknown) => String(p || '').split(/[\\/]/).pop() || '',
      dirname: (p: unknown) => String(p || '').split(/[\\/]/).slice(0, -1).join('\\') || 'C:\\',
    },
  },
  sys: {
    version: '3.11.0 (simulated)',
    platform: 'win32',
    argv: ['script.py'],
    exit: (code?: unknown) => {
      throw new Error(`sys.exit(${code !== undefined ? code : 0})`);
    },
  },
  time: {
    time: () => Date.now() / 1000,
    sleep: () => null,
    ctime: () => new Date().toUTCString(),
  },
  datetime: {
    now: () => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      hour: new Date().getHours(),
      minute: new Date().getMinutes(),
      second: new Date().getSeconds(),
      strftime: (fmt?: unknown) => String(fmt || '').replace('%Y', String(new Date().getFullYear())).replace('%m', String(new Date().getMonth() + 1).padStart(2, '0')).replace('%d', String(new Date().getDate()).padStart(2, '0')),
    }),
    today: () => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    }),
  },
};
