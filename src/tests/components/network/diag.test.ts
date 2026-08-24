import { describe, it } from 'vitest';
import { executePythonScript } from '@/components/network/pc-panel/pcPythonRunner';

describe('diag anagram', () => {
  it('inspect params/lens inside function', () => {
    const script = `
def is_anagram(str1, str2):
    a = str1.lower()
    b = str2.lower()
    return str(str1) + "#" + str(str2) + "#" + str(a) + "#" + str(b) + "#" + str(len(a)) + "#" + str(len(b))

print(is_anagram("race", "care"))
print(is_anagram("hello", "world"))
`;
    const res = executePythonScript(script);
    console.log('OUTPUT:\n' + res.output);
    console.log('ERROR:', res.error);
  });
});
