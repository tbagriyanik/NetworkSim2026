import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFs,
  saveFs,
  resolvePath,
  isDir,
  listDir,
  makeDir,
  removeDir,
  readFile,
  writeFile,
  deleteFile,
} from '@/components/network/pc-panel/pcFileSystem';
import { executePythonScript } from '@/components/network/pc-panel/pcPythonRunner';

const mockStorage: Record<string, string> = {};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    removeItem: (key: string) => { delete mockStorage[key]; },
    length: 0,
    key: () => null,
  };
}

describe('pcFileSystem & pcPythonRunner tests', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined' && localStorage.clear) {
      localStorage.clear();
    }
  });

  it('should resolve relative and absolute paths correctly', () => {
    expect(resolvePath('C:\\', 'test')).toBe('C:\\test');
    expect(resolvePath('C:\\folder', '..')).toBe('C:\\');
    expect(resolvePath('C:\\folder', '.')).toBe('C:\\folder');
    expect(resolvePath('C:\\folder', 'C:\\other')).toBe('C:\\other');
  });

  it('should create and list directories in FS', () => {
    const fs = loadFs('pc-1');
    expect(listDir(fs, 'C:\\')).toEqual([]);

    makeDir(fs, 'C:\\myfolder');
    expect(listDir(fs, 'C:\\')).toContain('myfolder');
    expect(isDir(fs, 'C:\\myfolder')).toBe(true);

    removeDir(fs, 'C:\\myfolder');
    expect(listDir(fs, 'C:\\')).not.toContain('myfolder');
    expect(isDir(fs, 'C:\\myfolder')).toBe(false);
  });

  it('should write, read, and delete files in FS', () => {
    const fs = loadFs('pc-1');
    writeFile(fs, 'C:\\kod.py', 'print("Hello from PC")');
    saveFs('pc-1', fs);

    const loaded = loadFs('pc-1');
    expect(readFile(loaded, 'C:\\kod.py')).toBe('print("Hello from PC")');

    deleteFile(loaded, 'C:\\kod.py');
    expect(readFile(loaded, 'C:\\kod.py')).toBeNull();
  });

  it('should execute simple python scripts', () => {
    const script = `
# Test python script
a = 10
b = 20
print("Sum is:", a + b)
for i in range(3):
    print("Item:", i)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('Sum is: 30');
    expect(res.output).toContain('Item: 0');
    expect(res.output).toContain('Item: 1');
    expect(res.output).toContain('Item: 2');
    expect(res.error).toBeUndefined();
  });

  it('should support string .format(...) method', () => {
    const script = `
num1 = 5
num2 = 10
sum = num1 + num2
print('The sum of {0} and {1} is {2}'.format(num1, num2, sum))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The sum of 5 and 10 is 15');
    expect(res.error).toBeUndefined();
  });

  it('should support space-separated format arguments', () => {
    const script = `
num1 = 5
sum = 11.3
print('The sum of {0} and {1} is {2}'.format(num1 6.3 sum))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The sum of 5 and 6.3 is 11.3');
    expect(res.error).toBeUndefined();
  });

  it('should support input() and float() calculation script', () => {
    const script = `
# Store input numbers
num1 = input('Enter first number: ')
num2 = input('Enter second number: ')

# Add two numbers
sum = float(num1) + float(num2)

# Display the sum
print('The sum of {0} and {1} is {2}'.format(num1, num2, sum))
`;
    const res = executePythonScript(script, ['12.5', '7.5']);
    expect(res.output).toContain('Enter first number: ');
    expect(res.output).toContain('Enter second number: ');
    expect(res.output).toContain('The sum of 12.5 and 7.5 is 20');
    expect(res.error).toBeUndefined();
  });

  it('should support type checking and type conversions (type, int, float, str, bool, len)', () => {
    const script = `
x = 10
y = "hello"
z = 3.14
b = True
print(type(x))
print(type(y))
print(int("25"))
print(str(100))
print(bool(1))
print(bool(0))
print(len("test"))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain("<class 'int'>");
    expect(res.output).toContain("<class 'str'>");
    expect(res.output).toContain("25");
    expect(res.output).toContain("100");
    expect(res.output).toContain("True");
    expect(res.output).toContain("False");
    expect(res.output).toContain("4");
    expect(res.error).toBeUndefined();
  });

  it('should support math helpers (abs, round, sum, range)', () => {
    const script = `
print(abs(-15))
print(round(3.14159, 2))
print(sum([1, 2, 3, 4]))
for i in range(1, 4):
    print("Range item:", i)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain("15");
    expect(res.output).toContain("3.14");
    expect(res.output).toContain("10");
    expect(res.output).toContain("Range item: 1");
    expect(res.output).toContain("Range item: 3");
    expect(res.error).toBeUndefined();
  });

  it('should support conditionals, while loops, break and continue', () => {
    const script = `
x = 7
if x > 10:
    print("Greater than 10")
elif x == 7:
    print("Is 7")
else:
    print("Other")

i = 0
while i < 10:
    i = i + 1
    if i == 2:
        continue
    if i == 4:
        break
    print("While:", i)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain("Is 7");
    expect(res.output).toContain("While: 1");
    expect(res.output).not.toContain("While: 2");
    expect(res.output).toContain("While: 3");
    expect(res.output).not.toContain("While: 4");
    expect(res.error).toBeUndefined();
  });

  it('should support list methods (.append, .remove, .pop, .sort, .reverse)', () => {
    const script = `
lst = [5, 2, 8]
lst.append(1)
print("After append:", lst)
lst.sort()
print("After sort:", lst)
lst.reverse()
print("After reverse:", lst)
lst.remove(5)
print("After remove:", lst)
popped = lst.pop()
print("Popped:", popped)
print("Final lst:", lst)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain("After append: [5, 2, 8, 1]");
    expect(res.output).toContain("After sort: [1, 2, 5, 8]");
    expect(res.output).toContain("After reverse: [8, 5, 2, 1]");
    expect(res.output).toContain("After remove: [8, 2, 1]");
    expect(res.output).toContain("Popped: 1");
    expect(res.output).toContain("Final lst: [8, 2]");
    expect(res.error).toBeUndefined();
  });

  it('should support user snippet with inline comments, list formatting, sum, type, while break continue', () => {
    const script = `
# Veri tipleri & Matematik
lst = [5, 2, 8]
lst.append(1)
lst.sort()
print("Sıralı liste:", lst) # [1, 2, 5, 8]
print("Toplam:", sum(lst)) # 16
print("Tip:", type(lst))   # <class 'list'>

# Döngü & Break / Continue
i = 0
while i < 10:
    i = i + 1
    if i == 2:
        continue
    if i == 5:
        break
    print("Sayaç:", i)
`;
    const res = executePythonScript(script);
    const expected = [
      "Sıralı liste: [1, 2, 5, 8]",
      "Toplam: 16",
      "<class 'list'>",
      "Sayaç: 1",
      "Sayaç: 3",
      "Sayaç: 4"
    ];
    for (const exp of expected) {
      expect(res.output).toContain(exp);
    }
    expect(res.output).not.toContain("Sayaç: 2");
    expect(res.output).not.toContain("Sayaç: 5");
    expect(res.error).toBeUndefined();
  });

  it('should support exponentiation (**) and % printf string formatting without NaN', () => {
    const script = `
# Python Program to calculate the square root
num = 8
num_sqrt = num ** 0.5
print('The square root of %0.3f is %0.3f' % (num, num_sqrt))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The square root of 8.000 is 2.828');
    expect(res.output).not.toContain('NaN');
    expect(res.error).toBeUndefined();
  });

  it('should calculate area of triangle correctly without resulting in 0', () => {
    const script = `
# Python Program to find the area of triangle
a = 5
b = 6
c = 7

s = (a + b + c) / 2
area = (s*(s-a)*(s-b)*(s-c)) ** 0.5
print('The area of the triangle is %0.2f' %area)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The area of the triangle is 14.70');
    expect(res.output).not.toContain('0.00');
    expect(res.error).toBeUndefined();
  });

  it('should support tuple unpacking and multiple variable swapping (x, y = y, x)', () => {
    const script = `
x = 5
y = 10

x, y = y, x
print("x =", x)
print("y =", y)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain("x = 10");
    expect(res.output).toContain("y = 5");
    expect(res.error).toBeUndefined();
  });

  it('should support module imports (random, math, os, sys, time, datetime)', () => {
    const script = `
import random
import math
from math import sqrt, pi

r = random.randint(0, 9)
print("Random num:", r)
print("Square root 16:", sqrt(16))
print("Math pi:", round(pi, 2))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain("Square root 16: 4");
    expect(res.output).toContain("Math pi: 3.14");
    expect(res.output).toMatch(/Random num: [0-9]/);
    expect(res.error).toBeUndefined();
  });

  it('should solve quadratic equation ax^2 + bx + c = 0 with cmath module', () => {
    const script = `
import cmath

a = 1
b = 5
c = 6

d = (b**2) - (4*a*c)
sol1 = (-b-cmath.sqrt(d))/(2*a)
sol2 = (-b+cmath.sqrt(d))/(2*a)

print('The solution are {0} and {1}'.format(sol1,sol2))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The solution are (-3+0j) and (-2+0j)');
    expect(res.error).toBeUndefined();
  });
});




