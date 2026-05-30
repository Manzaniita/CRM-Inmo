const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

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

const fixes = [
  // Fix duplicated opacity values
  { from: /dark:bg-slate-800\/50\/50/g, to: 'dark:bg-slate-800/50' },
  { from: /dark:bg-slate-800\/50\/20/g, to: 'dark:bg-slate-800/20' },
  // Fix hover:bg-slate-100 dark:bg-slate-800 -> should be dark:hover
  { from: /hover:bg-slate-100 dark:bg-slate-800(?!\/)/g, to: 'hover:bg-slate-100 dark:hover:bg-slate-800' },
  { from: /hover:bg-slate-100 dark:bg-slate-800 rounded-lg/g, to: 'hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg' },
  { from: /hover:bg-slate-100 dark:bg-slate-800 rounded-full/g, to: 'hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full' },
  // Fix text hover duplicates
  { from: /hover:text-slate-600 dark:text-slate-400 transition-colors/g, to: 'hover:text-slate-600 dark:hover:text-slate-300 transition-colors' },
  { from: /hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:bg-slate-800/g, to: 'hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800' },
  { from: /hover:text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-100 dark:bg-slate-800/g, to: 'hover:text-slate-900 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800' },
  { from: /hover:text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800/g, to: 'hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800' },
  // More specific ones
  { from: /hover:text-slate-700 dark:text-slate-300 transition-colors/g, to: 'hover:text-slate-700 dark:hover:text-slate-300 transition-colors' },
];

const files = findTsxFiles(SRC_DIR);
let totalChanges = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fileChanges = 0;

  for (const { from, to } of fixes) {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      fileChanges += matches.length;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`[${fileChanges} fixes] ${path.relative(__dirname, file)}`);
    totalChanges += fileChanges;
  }
}

console.log(`\nTotal fixes: ${totalChanges} across ${files.length} files`);
