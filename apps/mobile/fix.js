const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      content = content.replace(/Starts:\s*₹/g, '₹');
      content = content.replace(/Starts at:\s*₹/g, '₹');
      content = content.replace(/Starts at\s*₹/g, '₹');
      
      content = content.replace(/\.toLocaleString\('en-IN'\)/g, ".toLocaleString('en-IN', { maximumFractionDigits: 0 })");
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInDir('d:/Zippy/MARCOS/apps/mobile/src/screens');
