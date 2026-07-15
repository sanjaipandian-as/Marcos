const fs = require('fs');
const parser = require('@babel/parser');
const file = fs.readFileSync('apps/mobile/src/screens/shop/ProductsCatalogScreen.js', 'utf8');

try {
  parser.parse(file, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('No syntax errors found!');
} catch (e) {
  console.error(`Syntax Error at line ${e.loc.line}, column ${e.loc.column}: ${e.message}`);
}
