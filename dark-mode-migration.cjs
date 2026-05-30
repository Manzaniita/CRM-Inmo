const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Find all .tsx files recursively
function findTsxFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTsxFiles(fullPath, files);
    } else if (entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const replacements = [
  // Backgrounds
  { from: /\bg-white\b/g, to: 'bg-white dark:bg-slate-900' },
  { from: /\bbg-gray-50\b/g, to: 'bg-slate-50 dark:bg-slate-800/50' },
  { from: /\bbg-gray-100\b/g, to: 'bg-slate-100 dark:bg-slate-800' },
  { from: /\bbg-gray-200\b/g, to: 'bg-slate-200 dark:bg-slate-700' },
  // Borders
  { from: /\bborder-gray-200\b/g, to: 'border-slate-200 dark:border-slate-700' },
  { from: /\bborder-gray-100\b/g, to: 'border-slate-100 dark:border-slate-800' },
  // Text colors
  { from: /\btext-gray-900\b/g, to: 'text-slate-900 dark:text-slate-100' },
  { from: /\btext-gray-800\b/g, to: 'text-slate-800 dark:text-slate-200' },
  { from: /\btext-gray-700\b/g, to: 'text-slate-700 dark:text-slate-300' },
  { from: /\btext-gray-600\b/g, to: 'text-slate-600 dark:text-slate-400' },
  { from: /\btext-gray-500\b/g, to: 'text-slate-500 dark:text-slate-400' },
  { from: /\btext-gray-400\b/g, to: 'text-slate-400 dark:text-slate-500' },
  { from: /\btext-gray-300\b/g, to: 'text-slate-300 dark:text-slate-600' },
  // Hover backgrounds
  { from: /\bhover:bg-gray-50\b/g, to: 'hover:bg-slate-50 dark:hover:bg-slate-800/50' },
  { from: /\bhover:bg-gray-100\b/g, to: 'hover:bg-slate-100 dark:hover:bg-slate-800' },
  { from: /\bhover:bg-gray-200\b/g, to: 'hover:bg-slate-200 dark:hover:bg-slate-700' },
  // Hover text
  { from: /\bhover:text-gray-900\b/g, to: 'hover:text-slate-900 dark:hover:text-slate-100' },
  { from: /\bhover:text-gray-700\b/g, to: 'hover:text-slate-700 dark:hover:text-slate-300' },
  { from: /\bhover:text-gray-600\b/g, to: 'hover:text-slate-600 dark:hover:text-slate-400' },
  { from: /\bhover:text-gray-500\b/g, to: 'hover:text-slate-500 dark:hover:text-slate-400' },
  { from: /\bhover:text-gray-400\b/g, to: 'hover:text-slate-400 dark:hover:text-slate-500' },
  // Focus backgrounds
  { from: /\bfocus:bg-gray-50\b/g, to: 'focus:bg-slate-50 dark:focus:bg-slate-800/50' },
  // Ring
  { from: /\bring-gray-200\b/g, to: 'ring-slate-200 dark:ring-slate-700' },
  // Placeholder
  { from: /\bplaceholder-gray-400\b/g, to: 'placeholder-slate-400 dark:placeholder-slate-500' },
];

const files = findTsxFiles(SRC_DIR);
let totalChanges = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fileChanges = 0;

  // Process line by line for safety
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Skip lines that already contain dark: variants (they're already dark-aware)
    // UNLESS it's a simple text-gray-400 that doesn't have bg/background dark support
    const hasDarkVariant = line.includes('dark:');
    
    let newLine = line;
    for (const { from, to } of replacements) {
      // If line already has dark: support, only replace if the pattern doesn't already have a dark counterpart
      if (hasDarkVariant) {
        // Check if this specific pattern already has a dark: variant nearby
        const patternWithoutDark = to.split(' dark:')[0];
        const darkPattern = to.includes(' dark:') ? to.split(' dark:')[1] : null;
        
        // If the line already contains the dark pattern, skip
        if (darkPattern && line.includes(darkPattern.split(' ')[0])) {
          continue;
        }
        
        // If line has dark: but not for this specific pattern, still apply the replacement
        // but be more careful
      }
      
      const matches = newLine.match(from);
      if (matches) {
        newLine = newLine.replace(from, to);
        fileChanges += matches.length;
      }
    }
    return newLine;
  });

  const newContent = newLines.join('\n');
  if (newContent !== originalContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`[${fileChanges} changes] ${path.relative(__dirname, file)}`);
    totalChanges += fileChanges;
  }
}

console.log(`\nTotal changes: ${totalChanges} across ${files.length} files`);
