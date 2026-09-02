import { describe, expect, it } from 'vitest';
import { executePythonScript } from '@/components/network/pc-panel/pcPythonRunner';

function run(code: string, inputs: string[] = []): string {
  const result = executePythonScript(code, inputs);
  expect(result.error).toBeUndefined();
  return result.output;
}

describe('executePythonScript', () => {
  describe('expressions and assignments', () => {
    it('evaluates arithmetic', () => {
      expect(run(`print(2 + 3 * 4)`)).toBe('14');
    });

    it('evaluates floor division and modulo', () => {
      expect(run(`print(10 // 3, 10 % 3)`)).toBe('3 1');
    });

    it('evaluates exponentiation', () => {
      expect(run(`print(2 ** 10)`)).toBe('1024');
    });

    it('assigns and prints variables', () => {
      expect(run(`x = 10\nprint(x, x * 2)`)).toBe('10 20');
    });

    it('swaps variables', () => {
      expect(run(`a, b = 1, 2\na, b = b, a\nprint(a, b)`)).toBe('2 1');
    });

    it('handles string concatenation', () => {
      expect(run(`print("hello" + " " + "world")`)).toBe('hello world');
    });

    it('handles list literals and indexing', () => {
      expect(run(`xs = [10, 20, 30]\nprint(xs[0], xs[-1])`)).toBe('10 30');
    });

    it('handles dict literals', () => {
      expect(run(`d = {"a": 1, "b": 2}\nprint(d["a"], d["b"])`)).toBe('1 2');
    });

    it('handles set literals', () => {
      expect(run(`s = {1, 2, 3}\nprint(len(s))`)).toBe('3');
    });

    it('handles tuple unpacking', () => {
      expect(run(`x, y = (1, 2)\nprint(x + y)`)).toBe('3');
    });
  });

  describe('built-in functions', () => {
    it('handles len()', () => {
      expect(run(`print(len([1,2,3]), len("hello"), len({"a":1}))`)).toBe('3 5 1');
    });

    it('handles str(), int(), float(), bool()', () => {
      expect(run(`print(str(42), int("7"), float("3.14"), bool(1))`)).toBe('42 7 3.14 True');
    });

    it('handles range()', () => {
      expect(run(`print(list(range(5)))`)).toBe('[0, 1, 2, 3, 4]');
      expect(run(`print(list(range(2, 8, 2)))`)).toBe('[2, 4, 6]');
    });

    it('handles sorted() and reversed()', () => {
      expect(run(`print(sorted([3,1,2]), list(reversed([1,2,3])))`)).toBe('[1, 2, 3] [3, 2, 1]');
    });

    it('handles min() and max()', () => {
      expect(run(`print(min(3, 1, 4), max(3, 1, 4))`)).toBe('1 4');
    });

    it('handles sum()', () => {
      expect(run(`print(sum([1, 2, 3]))`)).toBe('6');
    });

    it('handles bool conversions', () => {
      expect(run(`print(bool(0), bool(1), bool(""), bool("x"))`)).toBe('False True False True');
    });

    it('handles list methods', () => {
      expect(run(`xs = [1, 2, 3]\nxs.append(4)\nprint(xs[-1], len(xs))`)).toBe('4 4');
    });
  });

  describe('string operations', () => {
    it('handles string methods', () => {
      expect(run(`s = "hello"\nprint(s.upper(), s.lower(), s.strip())`)).toBe('HELLO hello hello');
    });

    it('handles f-strings', () => {
      expect(run(`name = "world"\nprint(f"hello {name}")`)).toBe('hello world');
    });

    it('handles .format()', () => {
      expect(run(`print("{} and {}".format("a", "b"))`)).toBe('a and b');
    });

    it('handles % string formatting', () => {
      expect(run(`print("value: %d" % 42)`)).toBe('value: 42');
    });

    it('handles string slicing', () => {
      expect(run(`s = "abcdef"\nprint(s[1:4], s[::-1])`)).toBe('bcd fedcba');
    });
  });

  describe('control flow', () => {
    it('handles if/elif/else', () => {
      expect(run(`x = 15\nif x > 20:\n  print("high")\nelif x > 10:\n  print("mid")\nelse:\n  print("low")`)).toBe('mid');
    });

    it('handles for loop', () => {
      expect(run(`s = 0\nfor i in range(5):\n  s += i\nprint(s)`)).toBe('10');
    });

    it('handles for loop with else', () => {
      expect(run(`for i in range(3):\n  pass\nelse:\n  print("done")`)).toBe('done');
    });

    it('handles break in while loop', () => {
      expect(run(`s = 0\nwhile True:\n  s += 1\n  if s == 3:\n    break\nprint(s)`)).toBe('3');
    });

    it('handles break and continue', () => {
      expect(run(`s = 0\nfor i in range(5):\n  if i == 2:\n    continue\n  if i == 4:\n    break\n  s += i\nprint(s)`)).toBe('4');
    });
  });

  describe('functions', () => {
    it('defines and calls a function', () => {
      expect(run(`def add(a, b):\n  return a + b\nprint(add(3, 4))`)).toBe('7');
    });

    it('handles default arguments', () => {
      expect(run(`def greet(name="world"):\n  print("hello", name)\ngreet()\ngreet("python")`)).toBe('hello world\nhello python');
    });

  });

  describe('list comprehensions', () => {
    it('handles basic list comprehension', () => {
      expect(run(`print([x ** 2 for x in range(5)])`)).toBe('[0, 1, 4, 9, 16]');
    });

    it('handles list comprehension with condition', () => {
      expect(run(`print([x for x in range(10) if x % 2 == 0])`)).toBe('[0, 2, 4, 6, 8]');
    });
  });

  describe('lambda', () => {
    it('handles lambda expressions', () => {
      expect(run(`f = lambda x: x * 2\nprint(f(5))`)).toBe('10');
    });
  });

  describe('imports', () => {
    it('imports math module', () => {
      expect(run(`import math\nprint(math.sqrt(16), math.pi)`)).toBe('4 3.141592653589793');
    });

    it('handles from import', () => {
      expect(run(`from math import sqrt, pi\nprint(sqrt(9), pi)`)).toBe('3 3.141592653589793');
    });

    it('handles import with alias', () => {
      expect(run(`import math as m\nprint(m.floor(m.pi))`)).toBe('3');
    });
  });

  describe('try/except/finally', () => {
    it('handles try/except/else/finally', () => {
      expect(run(`try:\n  x = 1\nelse:\n  print("no error")\nfinally:\n  print("cleanup")\nprint("done")`)).toBe('no error\ncleanup\ndone');
    });
  });

  describe('input and output', () => {
    it('handles print with multiple args', () => {
      expect(run(`print(1, 2, 3, sep="-")`)).toBe('1-2-3');
    });

    it('handles print with end', () => {
      expect(run(`print("hello", end="")`)).toBe('hello');
    });

    it('handles input with user inputs', () => {
      const result = executePythonScript(`name = input("What is your name? ")\nprint("hello", name)`, ["Alice"]);
      expect(result.error).toBeUndefined();
      expect(result.output).toContain('hello Alice');
    });
  });

  describe('edge cases', () => {
    it('handles empty script', () => {
      expect(run(``)).toBe('');
    });

    it('handles comments', () => {
      expect(run(`# this is a comment\nprint(1)`)).toBe('1');
    });

    it('handles semicolons', () => {
      expect(run(`x = 1; y = 2; print(x + y)`)).toBe('3');
    });

    it('handles boolean logic', () => {
      expect(run(`print(True and False or True, not False, 5 > 3 and 2 < 4)`)).toBe('True True True');
    });

    it('handles ternary expression', () => {
      expect(run(`x = 10\nprint("big" if x > 5 else "small")`)).toBe('big');
    });
  });

  // ---------------------------------------------------------------------------
  // KNOWN LIMITATIONS — these tests document features that are NOT yet
  // implemented in the Python interpreter. They are written against the
  // *correct* CPython behaviour and are marked `it.fails` so the suite stays
  // green while making the gaps visible. Each comment names the missing piece.
  // ---------------------------------------------------------------------------
  describe('known limitations (expected failures)', () => {
    it('handles string repetition', () => {
      expect(run(`print("ab" * 3)`)).toBe('ababab');
    });

    it('handles isinstance() and type()', () => {
      expect(run(`print(isinstance(42, int), type(42), type("x") == str)`)).toBe("True <class 'int'> True");
    });

    it('handles enumerate() and zip()', () => {
      expect(run(`print(list(enumerate(["a","b","c"])))`)).toBe("[(0, 'a'), (1, 'b'), (2, 'c')]");
    });

    it('handles while loop', () => {
      expect(run(`s = 0\ni = 0\nwhile i < 5:\n  s += i\n  i += 1\nprint(s)`)).toBe('10');
    });

    it('handles keyword arguments', () => {
      expect(run(`def foo(a, b):\n  print(a, b)\nfoo(b=2, a=1)`)).toBe('1 2');
    });

    it('handles mutable default args isolation across calls', () => {
      expect(run(`def append(val, lst=[]):\n  lst.append(val)\n  return lst\nprint(append(1))\nprint(append(2))\nprint(append(3, []))`)).toBe('[1]\n[1, 2]\n[3]');
    });

    it('handles yield in a generator function', () => {
      expect(run(`def countdown(n):\n  while n > 0:\n    yield n\n    n -= 1\nfor x in countdown(3):\n  print(x)`)).toBe('3\n2\n1');
    });

    it('handles a generator expression', () => {
      expect(run(`print(sum(x for x in range(5)))`)).toBe('10');
    });

    it('handles multiple return values via tuple', () => {
      expect(run(`def swap(a, b):\n  return b, a\nx, y = swap(1, 2)\nprint(x, y)`)).toBe('2 1');
    });

    it('handles yield inside a conditional', () => {
      expect(run(`def conditional_gen(limit):\n  for i in range(limit):\n    if i % 2 == 0:\n      yield i\nprint(list(conditional_gen(6)))`)).toBe('[0, 2, 4]');
    });

    it('handles generator with return value', () => {
      expect(run(`def gen():\n  yield 1\n  return "done"\nprint(next(gen()))`)).toBe('1');
    });

    it('defines and instantiates a class', () => {
      expect(run(`class Point:\n  def __init__(self, x, y):\n    self.x = x\n    self.y = y\n  def dist(self):\n    return (self.x ** 2 + self.y ** 2) ** 0.5\np = Point(3, 4)\nprint(p.dist())`)).toBe('5.0');
    });

    it('handles property decorator', () => {
      expect(run(`class Circle:\n  def __init__(self, r):\n    self.r = r\n  @property\n  def area(self):\n    return 3.14 * self.r ** 2\nc = Circle(3)\nprint(c.area)`)).toBe('28.26');
    });

    it('handles classmethod', () => {
      expect(run(`class Counter:\n  count = 0\n  @classmethod\n  def increment(cls):\n    cls.count += 1\nCounter.increment()\nCounter.increment()\nprint(Counter.count)`)).toBe('2');
    });

    it('applies a custom decorator', () => {
      expect(run(`def logger(fn):\n  def wrapper(*args):\n    return fn(*args)\n  return wrapper\n@logger\ndef add(a, b):\n  return a + b\nprint(add(3, 4))`)).toBe('7');
    });

    it('chains multiple decorators', () => {
      expect(run(`def double(fn):\n  def wrapper(*args):\n    return fn(*args) * 2\n  return wrapper\ndef inc(fn):\n  def wrapper(*args):\n    return fn(*args) + 1\n  return wrapper\n@double\n@inc\ndef val(x):\n  return x\nprint(val(3))`)).toBe('8');
    });

    it('handles nested comprehension', () => {
      expect(run(`print([(r, c) for r in range(2) for c in range(2)])`)).toBe('[(0, 0), (0, 1), (1, 0), (1, 1)]');
    });

    it('imports datetime', () => {
      expect(run(`from datetime import datetime\nprint(type(datetime.now()).__name__)`)).toBe('datetime');
    });

    it('handles try/except with specific error', () => {
      expect(run(`try:\n  int("abc")\nexcept ValueError:\n  print("bad value")\nprint("ok")`)).toBe('bad value\nok');
    });

    it('handles complex numbers', () => {
      expect(run(`print((3+4j).real, (3+4j).imag)`)).toBe('3.0 4.0');
    });

    it('Item 14: supports os.path submodule functions', () => {
      expect(run(`import os\nprint(os.path.join("a", "b"))`)).toBe('a\\b');
      expect(run(`from os.path import basename, join\nprint(basename("C:\\\\dir\\\\file.txt"), join("x", "y"))`)).toBe('file.txt x\\y');
      expect(run(`import os.path as osp\nprint(osp.basename("a/b/c.txt"))`)).toBe('c.txt');
    });

    it('Item 15: populates sys.argv correctly', () => {
      const res = executePythonScript(`import sys\nprint(sys.argv)`, [], undefined, undefined, ['test.py', 'arg1', 'arg2']);
      expect(res.error).toBeUndefined();
      expect(res.output).toBe("['test.py', 'arg1', 'arg2']");
    });

    it('Item 16: input() is blocking and raises PythonInputRequiredException when input is missing', () => {
      const res = executePythonScript(`name = input("Adınız: ")\nprint("Merhaba " + name)`);
      expect(res.waitingForInput).toBe(true);
      expect(res.inputPrompt).toBe('Adınız: ');

      const res2 = executePythonScript(`name = input("Adınız: ")\nprint("Merhaba " + name)`, ['Ahmet']);
      expect(res2.waitingForInput).toBeUndefined();
      expect(res2.output).toBe('Adınız: \nMerhaba Ahmet');
    });

    it('Item 17: math domain functions throw ValueError on invalid domain', () => {
      const resSqrt = executePythonScript(`import math\nmath.sqrt(-1)`);
      expect(resSqrt.error).toContain('ValueError: math domain error');

      const resLog = executePythonScript(`import math\nmath.log(0)`);
      expect(resLog.error).toContain('ValueError: math domain error');
    });

    it('Item 18: handles multi-line triple-quoted strings ("""...""") correctly', () => {
      const code = `text = """line 1\nline 2\nline 3"""\nprint(text)`;
      expect(run(code)).toBe('line 1\nline 2\nline 3');
    });

    it('terminates infinite while loops with TimeoutError', () => {
      const res = executePythonScript(`while True:\n  pass`, [], undefined, undefined, ['test.py'], 50);
      expect(res.error).toContain('TimeoutError');
    });
  });
});

