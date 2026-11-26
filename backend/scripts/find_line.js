const fs = require('fs');
const content = fs.readFileSync('frontend/js/pages/projects.js', 'utf8');
const lines = content.split('\n');

for (let i = 1; i <= lines.length; i++) {
  const code = lines.slice(0, i).join('\n');
  try {
    new Function(code);
  } catch (err) {
    if (err.message.includes("Unexpected token ')'")) {
      console.log(`Unexpected ')' introduced at line ${i}:`);
      console.log(lines[i - 1]);
      break;
    }
  }
}

