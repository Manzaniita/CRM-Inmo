const fs = require('fs');

const files = [
  'src/components/GlobalSearch.tsx',
  'src/components/EntityRelationsDrawer.tsx',
  'src/pages/Sales.tsx',
  'src/pages/Tasks.tsx',
  'src/pages/Agenda.tsx',
  'src/pages/Clients.tsx',
  'src/pages/Rentals.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Documents.tsx',
  'src/pages/ReferredColleagues.tsx',
  'src/pages/Reservometro.tsx',
  'src/pages/Reports.tsx',
  'src/pages/Properties.tsx',
];

function getStorePath(filePath) {
  const parts = filePath.split('/');
  const idx = parts.indexOf('src');
  const depth = parts.length - idx - 2;
  return '../'.repeat(depth) + 'hooks/useClients';
}

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log('SKIP:', file);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');
  const storePath = getStorePath(file);

  let needsClients = false;
  let needsAddClient = false;
  let needsUpdateClient = false;

  // Find all destructuring occurrences (multiline supported)
  const regex = /const\s*\{([\s\S]*?)\}\s*=\s*useAppContext\(\);/g;
  let match;
  const replacements = [];

  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const inner = match[1];
    const items = inner.split(',').map(s => s.trim()).filter(Boolean);

    const hasClients = items.includes('clients');
    const hasAddClient = items.includes('addClient');
    const hasUpdateClient = items.includes('updateClient');

    if (hasClients) needsClients = true;
    if (hasAddClient) needsAddClient = true;
    if (hasUpdateClient) needsUpdateClient = true;

    const remaining = items.filter(i => i !== 'clients' && i !== 'addClient' && i !== 'updateClient');

    let replacement = '';
    if (remaining.length > 0) {
      replacement = `const { ${remaining.join(', ')} } = useAppContext();`;
    } else {
      replacement = '';
    }

    replacements.push({ fullMatch, replacement, hasClients, hasAddClient, hasUpdateClient });
  }

  if (!needsClients && !needsAddClient && !needsUpdateClient) {
    console.log('SKIP (no clients needed):', file);
    return;
  }

  // Add import if needed
  if (!content.includes('useClients')) {
    const importLine = `import { useClients } from '${storePath}';`;
    const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?/g;
    const allImports = [...content.matchAll(importRegex)];
    if (allImports.length) {
      const lastImport = allImports[allImports.length - 1];
      const insertPos = lastImport.index + lastImport[0].length;
      content = content.slice(0, insertPos) + '\n' + importLine + content.slice(insertPos);
    }
  }

  // Build declaration
  const declItems = [];
  if (needsClients) declItems.push('clients');
  if (needsAddClient) declItems.push('addClient');
  if (needsUpdateClient) declItems.push('updateClient');
  let declaration = `const { ${declItems.join(', ')} } = useClients();`;

  // Apply replacements in reverse order
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    const idx = content.lastIndexOf(r.fullMatch);
    if (idx === -1) continue;
    const before = content.slice(0, idx);
    const after = content.slice(idx + r.fullMatch.length);
    let insert = r.replacement;
    if (insert) insert += '\n  ';
    else insert = '  ';
    insert += declaration;
    content = before + insert + after;
  }

  // Remove orphaned useAppContext import
  if (!content.includes('useAppContext')) {
    content = content.replace(/import\s+\{\s*useAppContext\s*\}\s+from\s+['"]\.\.\/context\/AppContext['"];?\n?/g, '');
  }

  content = content.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(file, content);
  console.log('OK:', file);
});
