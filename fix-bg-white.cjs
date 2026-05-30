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

function hasDarkBgNearby(line, index) {
  // Check if there's already a dark:bg- within 60 chars after the bg-white
  const after = line.substring(index, index + 60);
  return after.includes('dark:bg-');
}

function isModalContainer(line) {
  return (line.includes('rounded-3xl') || line.includes('rounded-2xl')) && 
         (line.includes('shadow-2xl') || line.includes('max-w-') || line.includes('max-h-[90vh]'));
}

function isModalHeader(line) {
  return line.includes('shrink-0') && (line.includes('border-b') || line.includes('sticky top-0'));
}

const files = findTsxFiles(SRC_DIR);
let totalChanges = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fileChanges = 0;

  const lines = content.split('\n');
  const newLines = lines.map(line => {
    let newLine = line;
    let searchIndex = 0;
    
    while (true) {
      const idx = newLine.indexOf('bg-white', searchIndex);
      if (idx === -1) break;
      
      // Skip if already has dark:bg- nearby
      if (hasDarkBgNearby(newLine, idx)) {
        searchIndex = idx + 8;
        continue;
      }
      
      // Skip bg-white/ (with opacity) - those are different
      if (newLine[idx + 8] === '/') {
        searchIndex = idx + 8;
        continue;
      }
      
      // Determine appropriate dark variant
      let darkVariant = 'dark:bg-slate-800';
      if (isModalContainer(newLine)) {
        darkVariant = 'dark:bg-slate-900';
      } else if (isModalHeader(newLine)) {
        darkVariant = 'dark:bg-slate-900';
      }
      
      newLine = newLine.substring(0, idx + 8) + ' ' + darkVariant + newLine.substring(idx + 8);
      fileChanges++;
      searchIndex = idx + 8 + darkVariant.length + 1;
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

console.log(`\nTotal bg-white fixes: ${totalChanges} across ${files.length} files`);
