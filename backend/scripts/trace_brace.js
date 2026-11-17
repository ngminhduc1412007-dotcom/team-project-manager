const fs = require('fs');
const content = fs.readFileSync('frontend/js/pages/projects.js', 'utf8');

// Tokenize characters tracking line numbers
let stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let inLineComment = false;

const lines = content.split('\n');
for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  for (let colIdx = 0; colIdx < line.length; colIdx++) {
    const ch = line[colIdx];
    const next = colIdx + 1 < line.length ? line[colIdx + 1] : '';

    if (inLineComment) {
      continue;
    }
    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        colIdx++;
      }
      continue;
    }
    if (inString) {
      if (ch === '\\') {
        colIdx++; // skip escaped char
      } else if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      continue;
    }
    if (ch === '/' && next === '*') {
      inComment = true;
      colIdx++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '{') {
      stack.push({ char: '{', line: lineIdx + 1, col: colIdx + 1, text: line.trim() });
    } else if (ch === '}') {
      if (stack.length === 0) {
        console.log(`Extra } at line ${lineIdx + 1}`);
      } else {
        stack.pop();
      }
    }
  }
  inLineComment = false;
}

console.log(`Remaining unclosed { count: ${stack.length}`);
for (const s of stack) {
  console.log(`Unclosed { from line ${s.line}: ${s.text}`);
}

