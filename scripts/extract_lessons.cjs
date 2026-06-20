const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/network/guidedMode.ts');
const content = fs.readFileSync(filePath, 'utf8');

// A robust regex to handle escaped single quotes
const stepRegex = /title:\s*\{\s*tr:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?description:\s*\{\s*tr:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?hint:\s*\{\s*tr:\s*'((?:[^'\\]|\\.)*)'/g;

let match;
let lessons = '# 🎓 Rehberli Ders Adımları (Guided Steps)\n\n';
let count = 0;

while ((match = stepRegex.exec(content)) !== null) {
  count++;
  const title = match[1].replace(/\\'/g, "'");
  const description = match[2].replace(/\\'/g, "'");
  const hint = match[3].replace(/\\'/g, "'");

  lessons += `### Adım ${count}: ${title}\n`;
  lessons += `**Açıklama:** ${description}\n\n`;
  lessons += `**İpucu:** ${hint}\n\n`;
  lessons += `---\n\n`;
}

process.stdout.write(lessons);
process.stderr.write(`\n\n> Toplam ${count} rehberli adım çıkarıldı.\n`);
