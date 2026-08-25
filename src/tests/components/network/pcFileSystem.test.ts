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
  copyFile,
  moveNode,
  renameNode,
} from '@/components/network/pc-panel/pcFileSystem';
import { executePythonScript, executePythonScriptAsync } from '@/components/network/pc-panel/pcPythonRunner';

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
    expect(listDir(fs, 'C:\\')).toEqual(['autoexec.bat', 'config.sys', 'boot.ini', 'www', 'upload', 'mail', 'code']);

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

  it('should execute powers of 2 script with lambda and map', () => {
    const script = `
terms = 10
result = list(map(lambda x: 2 ** x, range(terms)))
print("The total terms are:",terms)
for i in range(terms):
   print("2 raised to power",i,"is",result[i])
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The total terms are: 10');
    expect(res.output).toContain('2 raised to power 9 is 512');
    expect(res.error).toBeUndefined();
  });

  it('should correctly filter list elements using lambda and modulo operator', () => {
    const script = `
my_list = [12, 65, 54, 39, 102, 339, 221,]
result = list(filter(lambda x: (x % 13 == 0), my_list))
print("Numbers divisible by 13 are", result)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('Numbers divisible by 13 are [65, 39, 221]');
    expect(res.error).toBeUndefined();
  });

  it('should support bin(), oct(), and hex() conversions', () => {
    const script = `
dec = 344
print("The decimal value of", dec, "is:")
print(bin(dec), "in binary.")
print(oct(dec), "in octal.")
print(hex(dec), "in hexadecimal.")
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('0b101011000 in binary.');
    expect(res.output).toContain('0o530 in octal.');
    expect(res.output).toContain('0x158 in hexadecimal.');
    expect(res.error).toBeUndefined();
  });

  it('should support ord() for character ASCII value calculation', () => {
    const script = `
c = 'p'
print("The ASCII value of '" + c + "' is", ord(c))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain("The ASCII value of 'p' is 112");
    expect(res.error).toBeUndefined();
  });

  it('should calculate factors of a number inside a user-defined function', () => {
    const script = `
def print_factors(x):
   print("The factors of",x,"are:")
   for i in range(1, x + 1):
       if x % i == 0:
           print(i)

num = 320
print_factors(num)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The factors of 320 are:');
    expect(res.output).toContain('1');
    expect(res.output).toContain('320');
    expect(res.output).toContain('16');
    expect(res.error).toBeUndefined();
  });

  it('should stream print outputs inside functions when running executePythonScriptAsync', async () => {
    const script = `
def print_factors(x):
   print("The factors of",x,"are:")
   for i in range(1, x + 1):
       if x % i == 0:
           print(i)

num = 320
print_factors(num)
`;
    const streamed: string[] = [];
    const res = await executePythonScriptAsync(script, [], (chunk: string) => streamed.push(chunk));
    expect(streamed.join('\n')).toContain('The factors of 320 are:');
    expect(streamed.join('\n')).toContain('320');
    expect(streamed.join('\n')).toContain('16');
    expect(res.output).toContain('The factors of 320 are:');
  });

  it('should support try...except blocks and avoid running except on valid input', () => {
    const script = `
try:
    num1 = float(input("Enter first number: "))
    num2 = float(input("Enter second number: "))
    print("Result:", num1 + num2)
except:
    print("Invalid input. Please enter a number.")
`;
    const res = executePythonScript(script, ['10', '20']);
    expect(res.output).toContain('Result: 30');
    expect(res.output).not.toContain('Invalid input');
    expect(res.error).toBeUndefined();
  });

  it('should execute full calculator script correctly with except ValueError', () => {
    const script = `
def add(x, y):
    return x + y

while True:
    choice = input("Enter choice(1/2/3/4): ")
    if choice in ('1', '2', '3', '4'):
        try:
            num1 = float(input("Enter first number: "))
            num2 = float(input("Enter second number: "))
        except ValueError:
            print("Invalid input. Please enter a number.")
            continue

        if choice == '1':
            print(num1, "+", num2, "=", add(num1, num2))

        next_calc = input("Let's do next calculation? (yes/no): ")
        if next_calc == "no":
            break
`;
    // Test 1: Valid numbers 10 and 20
    const res1 = executePythonScript(script, ['1', '10', '20', 'no']);
    expect(res1.output).toContain('10 + 20 = 30');
    expect(res1.output).not.toContain('Invalid input');

    // Test 2: Invalid number 'abc' then valid number
    const res2 = executePythonScript(script, ['1', 'abc', '1', '10', '20', 'no']);
    expect(res2.output).toContain('Invalid input. Please enter a number.');
    expect(res2.output).toContain('10 + 20 = 30');
  });

  it('should support itertools.product, random.shuffle, and chained indexing deck[i][0]', () => {
    const script = `
import itertools, random
deck = list(itertools.product(range(1,14),['Spade','Heart','Diamond','Club']))
random.shuffle(deck)
print("You got:")
for i in range(5):
   print(deck[i][0], "of", deck[i][1])
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('You got:');
    expect(res.output).not.toContain('None of None');
    expect(res.output).toMatch(/\d+ of (Spade|Heart|Diamond|Club)/);
    expect(res.error).toBeUndefined();
  });

  it('should support calendar module and calendar.month(yy, mm)', () => {
    const script = `
import calendar
yy = 2014
mm = 11
print(calendar.month(yy, mm))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('November 2014');
    expect(res.output).toContain('Mo Tu We Th Fr Sa Su');
    expect(res.output).toContain('30');
    expect(res.error).toBeUndefined();
  });

  it('should support recursive Fibonacci sequence with return(expr) and nterms = 10', () => {
    const script = `
def recur_fibo(n):
   if n <= 1:
       return n
   else:
       return(recur_fibo(n-1) + recur_fibo(n-2))

nterms = 10

if nterms <= 0:
   print("Plese enter a positive integer")
else:
   print("Fibonacci sequence:")
   for i in range(nterms):
       print(recur_fibo(i))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('Fibonacci sequence:');
    expect(res.output).toContain('0');
    expect(res.output).toContain('1');
    expect(res.output).toContain('34');
    expect(res.error).toBeUndefined();
  });

  it('should support recursive convertToBinary script with print(n % 2, end="")', () => {
    const script = `
# Function to print binary number using recursion
def convertToBinary(n):
   if n > 1:
       convertToBinary(n//2)
   print(n % 2,end = '')

# decimal number
dec = 34

convertToBinary(dec)
print()
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('100010');
    expect(res.error).toBeUndefined();
  });

  it('should support 2D matrix addition with result[i][j] = X[i][j] + Y[i][j]', () => {
    const script = `
X = [[12,7,3],
    [4 ,5,6],
    [7 ,8,9]]

Y = [[5,8,1],
    [6,7,3],
    [4,5,9]]

result = [[0,0,0],
         [0,0,0],
         [0,0,0]]


for i in range(len(X)):
   for j in range(len(X[0])):
       result[i][j] = X[i][j] + Y[i][j]

for r in result:
   print(r)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('[17, 15, 4]');
    expect(res.output).toContain('[10, 12, 9]');
    expect(res.output).toContain('[11, 13, 18]');
    expect(res.error).toBeUndefined();
  });

  it('should support 3D nested loop matrix multiplication with result[i][j] += X[i][k] * Y[k][j]', () => {
    const script = `
X = [[12,7,3],
    [4 ,5,6],
    [7 ,8,9]]

Y = [[5,8,1,2],
    [6,7,3,0],
    [4,5,9,1]]

result = [[0,0,0,0],
         [0,0,0,0],
         [0,0,0,0]]


for i in range(len(X)):
   for j in range(len(Y[0])):
       for k in range(len(Y)):
           result[i][j] += X[i][k] * Y[k][j]

for r in result:
   print(r)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('[114, 160, 60, 27]');
    expect(res.output).toContain('[74, 97, 73, 14]');
    expect(res.output).toContain('[119, 157, 112, 23]');
    expect(res.error).toBeUndefined();
  });

  it('should support palindrome check with casefold() and reversed()', () => {
    const script = `
my_str = 'asdasdasdasdasddddddddddd'
my_str = my_str.casefold()
rev_str = reversed(my_str)

if list(my_str) == list(rev_str):
   print("The string is a palindrome.")
else:
   print("The string is not a palindrome.")
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The string is not a palindrome.');
    expect(res.error).toBeUndefined();
  });

  it('should support set operations (| & - ^) and trailing semicolons', () => {
    const script = `
E = {0, 2, 4, 6, 8};
N = {1, 2, 3, 4, 5};

print("Union of E and N is", E | N)
print("Intersection of E and N is", E & N)
print("Difference of E and N is", E - N)
print("Symmetric difference of E and N is", E ^ N)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('Union of E and N is {0, 1, 2, 3, 4, 5, 6, 8}');
    expect(res.output).toContain('Intersection of E and N is {2, 4}');
    expect(res.output).toContain('Difference of E and N is {0, 6, 8}');
    expect(res.output).toContain('Symmetric difference of E and N is {0, 1, 3, 5, 6, 8}');
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

  it('should correctly support for-else loop construct for prime numbers calculation', () => {
    const script = `
lower = 10
upper = 20

for num in range(lower, upper + 1):
   if num > 1:
       for i in range(2, num):
           if (num % i) == 0:
               break
       else:
           print(num)
`;
    const res = executePythonScript(script);
    expect(res.output.trim().split('\n')).toEqual(['11', '13', '17', '19']);
    expect(res.error).toBeUndefined();
  });

  it('should correctly evaluate Armstrong number script using //= floor division assignment', () => {
    const script = `
num = int(input("Enter a number: "))
sum = 0
temp = num

while temp > 0:
   digit = temp % 10
   sum += digit ** 3
   temp //= 10

if num == sum:
   print(num, "is an Armstrong number")
else:
   print(num, "is not an Armstrong number")
`;
    const res = executePythonScript(script, ['407']);
    expect(res.output).toContain('407 is an Armstrong number');
    expect(res.error).toBeUndefined();
  });

  it('should correctly evaluate list(map(lambda x: 2 ** x, range(terms))) and indexing', () => {
    const script = `
terms = 10
result = list(map(lambda x: 2 ** x, range(terms)))

print("The total terms are:", terms)
for i in range(terms):
   print("2 raised to power", i, "is", result[i])
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('The total terms are: 10');
    expect(res.output).toContain('2 raised to power 0 is 1');
    expect(res.output).toContain('2 raised to power 3 is 8');
    expect(res.output).toContain('2 raised to power 9 is 512');
    expect(res.error).toBeUndefined();
  });

  it('should correctly evaluate list(set(list_1)) deduplication', () => {
    const script = `
list_1 = [1, 2, 1, 4, 6]
print(list(set(list_1)))
`;
    const res = executePythonScript(script);
    expect(res.output.trim()).toBe('[1, 2, 4, 6]');
    expect(res.error).toBeUndefined();
  });

  it('should correctly iterate over characters in a string in a for loop', () => {
    const script = `
count = 0
my_string = "Programiz"
my_char = "r"

for i in my_string:
    if i == my_char:
        count += 1

print(count)
`;
    const res = executePythonScript(script);
    expect(res.output.trim()).toBe('2');
    expect(res.error).toBeUndefined();
  });

  it('should correctly evaluate def function, divmod, and print end=\\r in countdown script', () => {
    const script = `
import time

def countdown(time_sec):
    while time_sec:
        mins, secs = divmod(time_sec, 60)
        timeformat = '{:02d}:{:02d}'.format(mins, secs)
        print(timeformat, end='\\r')
        time.sleep(1)
        time_sec -= 1

    print("stop")

countdown(5)
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('stop');
    expect(res.error).toBeUndefined();
  });

  it('should support recursive function with default parameters (permutation)', () => {
    const script = `
def get_permutation(string, i=0, result=None):
    if result is None:
        result = []
    if i == len(string):
        result.append("".join(string))
        return
    for j in range(i, len(string)):
        words = [c for c in string]
        words[i], words[j] = words[j], words[i]
        get_permutation(words, i + 1, result)
    return result

print(get_permutation('yup'))
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('yup');
    expect(res.output).toContain('ypu');
    expect(res.output).toContain('uyp');
    expect(res.output).toContain('upy');
    expect(res.output).toContain('pyu');
    expect(res.output).toContain('puy');
    expect(res.error).toBeUndefined();
  });

  it('should support string methods, sorted on strings, and for-loop tuple unpacking (anagram)', () => {
    const script = `
def is_anagram(str1, str2):
    a = str1.lower()
    b = str2.lower()
    if len(a) != len(b):
        return False
    sa = "".join(sorted(a))
    sb = "".join(sorted(b))
    return sa == sb

pairs = [("race", "care"), ("hello", "world")]
for x, y in pairs:
    if is_anagram(x, y):
        print(x.lower(), "and", y.lower(), "are anagram.")
    else:
        print(x.lower(), "and", y.lower(), "are not anagram.")
`;
    const res = executePythonScript(script);
    expect(res.output).toContain('race and care are anagram.');
    expect(res.output).toContain('hello and world are not anagram.');
    expect(res.output.trim().split('\n')).toHaveLength(2);
    expect(res.error).toBeUndefined();
  });

  it('should copy, move, and rename files/directories correctly', () => {
    const fs = loadFs('pc-test-fs');
    writeFile(fs, 'C:\\autoexec.bat', '@echo off\necho Test Boot');
    
    // Test copyFile
    const copied = copyFile(fs, 'C:\\autoexec.bat', 'C:\\autoexec.bak');
    expect(copied).toBe(true);
    expect(readFile(fs, 'C:\\autoexec.bak')).toBe('@echo off\necho Test Boot');

    // Test copyFile into directory
    const copyDir = copyFile(fs, 'C:\\autoexec.bat', 'C:\\code');
    expect(copyDir).toBe(true);
    expect(readFile(fs, 'C:\\code\\autoexec.bat')).toBe('@echo off\necho Test Boot');

    // Test moveNode
    const moved = moveNode(fs, 'C:\\autoexec.bak', 'C:\\code\\autoexec.ren');
    expect(moved).toBe(true);
    expect(readFile(fs, 'C:\\autoexec.bak')).toBeNull();
    expect(readFile(fs, 'C:\\code\\autoexec.ren')).toBe('@echo off\necho Test Boot');

    // Test renameNode
    const renamed = renameNode(fs, 'C:\\code\\autoexec.ren', 'boot.old');
    expect(renamed.success).toBe(true);
    expect(readFile(fs, 'C:\\code\\autoexec.ren')).toBeNull();
    expect(readFile(fs, 'C:\\code\\boot.old')).toBe('@echo off\necho Test Boot');
  });
});
