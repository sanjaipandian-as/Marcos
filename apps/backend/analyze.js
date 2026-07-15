const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

console.log("File | Function | DB Round Trips | In-Memory | Unbounded");
console.log("---|---|---|---|---");

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // A crude parser for exported functions AND class static methods
  const regex = /(?:export\s+const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|req,\s*res.*?)\s*=>\s*\{|static\s+async\s+(\w+)\s*\([^)]*\)\s*\{)([\s\S]*?)(?=\n\s*(?:static\s+async|export\s+const|private\s+static|}$))/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const fnName = match[1] || match[2];
    const fnBody = match[3];
    if (!fnName) continue;
    
    // Check for N+1 queries (await inside loop)
    // Matches Promise.all( ... .map( ... await prisma... ))
    const hasMapPromise = /Promise\.all\s*\([^)]*\.map\s*\([\s\S]*?await\s+prisma\./.test(fnBody);
    // Matches for (...) { ... await prisma... }
    const hasForLoopAwait = /for\s*\([^)]*\)\s*\{[\s\S]*?await\s+prisma\./.test(fnBody) || /for\s+await/.test(fnBody);
    
    let dbComplexity = 'O(1)';
    if (hasMapPromise || hasForLoopAwait) dbComplexity = 'O(N)';
    
    // Check nested loops
    if (hasMapPromise && hasForLoopAwait) dbComplexity = 'O(N^2)';
    
    // Check for unbounded findMany
    const hasFindMany = /prisma\.\w+\.findMany\s*\(\s*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})?\)/.test(fnBody);
    const hasTake = /take\s*:/.test(fnBody); 
    const isUnbounded = hasFindMany && !hasTake;
    
    // In memory loops
    const hasLoops = /\.map\(|\.filter\(|\.reduce\(|\.forEach\(|for\s*\(/.test(fnBody);
    const inMemory = hasLoops ? 'O(N)' : 'O(1)';
    
    console.log(`${file} | ${fnName} | ${dbComplexity} | ${inMemory} | ${isUnbounded ? 'Yes' : 'No'}`);
  }
});
