const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AnalyticsDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replacements
content = content.replace(/bg-\[\#1a1a1a\]/g, 'bg-slate-50');
content = content.replace(/bg-\[\#212121\]/g, 'bg-white');
content = content.replace(/border-\[\#2c2c2c\]/g, 'border-slate-200');
content = content.replace(/border-\[\#2c2c2c\]\/50/g, 'border-slate-100');
content = content.replace(/text-white/g, 'text-slate-800');
content = content.replace(/text-gray-200/g, 'text-slate-700');
content = content.replace(/text-gray-300/g, 'text-slate-600');
content = content.replace(/text-gray-400/g, 'text-slate-500');
content = content.replace(/text-gray-500/g, 'text-slate-400');
content = content.replace(/bg-\[\#333\]/g, 'bg-slate-100');

// Heatmap colors update for light mode
content = content.replace(/bg-\[\#2a3024\]/g, 'bg-slate-100'); // Empty state
content = content.replace(/bg-\[\#3b8c2a\] text-slate-800/g, 'bg-emerald-600 text-white'); // It was text-white which became text-slate-800
content = content.replace(/bg-\[\#56a836\] text-slate-800/g, 'bg-emerald-500 text-white');
content = content.replace(/bg-\[\#76c953\] text-black/g, 'bg-emerald-400 text-slate-800');
content = content.replace(/bg-\[\#a3e687\] text-black/g, 'bg-emerald-300 text-slate-800');

// Heatmap legend
content = content.replace(/bg-\[\#a3e687\]/g, 'bg-emerald-300');
content = content.replace(/bg-\[\#76c953\]/g, 'bg-emerald-400');
content = content.replace(/bg-\[\#56a836\]/g, 'bg-emerald-500');
content = content.replace(/bg-\[\#3b8c2a\]/g, 'bg-emerald-600');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('AnalyticsDashboard.jsx updated to light theme.');
