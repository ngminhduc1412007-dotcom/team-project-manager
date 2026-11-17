const fs = require('fs');
const content = fs.readFileSync('frontend/js/pages/projects.js', 'utf8');

try {
  new Function(content);
  console.log('Valid JavaScript syntax!');
} catch (err) {
  console.error('Syntax error:', err.message);
  console.error(err.stack);
}

