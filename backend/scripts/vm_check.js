const fs = require('fs');
const vm = require('vm');
const content = fs.readFileSync('frontend/js/pages/projects.js', 'utf8');

try {
  new vm.Script(content, { filename: 'projects.js' });
  console.log('Script valid!');
} catch (err) {
  console.error(err.stack);
}

