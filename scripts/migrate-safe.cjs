const fs = require('fs');

const files = [
  'src/components/DocumentModal.tsx',
  'src/components/EntityRelationsDrawer.tsx',
  'src/components/RentalModal.tsx',
  'src/components/SaleModal.tsx',
  'src/pages/Agenda.tsx',
  'src/pages/Buyers.tsx',
  'src/pages/Clients.tsx',
  'src/pages/Configuration.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/LoginPage.tsx',
  'src/pages/WaitingRoom.tsx',
  'src/pages/Tasks.tsx',
  'src/pages/Sales.tsx',
  'src/pages/ResetPassword.tsx',
  'src/pages/Reservometro.tsx',
  'src/pages/Rentals.tsx',
  'src/pages/ReferredColleagues.tsx',
  'src/pages/Properties.tsx',
  'src/pages/Marketplace.tsx',
];

function getStorePath(filePath) {
  const parts = filePath.split('/');
  const idx = parts.indexOf('src');
  const depth = parts.length - idx - 2;
  return '../'.repeat(depth) + 'stores/';
}

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log('SKIP:', file);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');
  const storePath = getStorePath(file);

  let needsUIStore = false;
  let needsAuthStore = false;

  // Find all destructuring occurrences
  const regex = /const\s*\{([^}]+)\}\s*=\s*useAppContext\(\)/g;
  let match;
  const replacements = [];

  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const inner = match[1];
    const items = inner.split(',').map(s => s.trim()).filter(Boolean);

    const uiItems = ['showToast'];
    const authItems = ['profile', 'user', 'signOut'];

    const foundUI = items.filter(i => uiItems.includes(i));
    const foundAuth = items.filter(i => authItems.includes(i));

    if (foundUI.length) needsUIStore = true;
    if (foundAuth.length) needsAuthStore = true;

    const remaining = items.filter(i => !uiItems.includes(i) && !authItems.includes(i));

    let replacement = '';
    if (remaining.length > 0) {
      replacement = `const { ${remaining.join(', ')} } = useAppContext()`;
    } else {
      replacement = '';
    }

    let additions = [];
    if (foundUI.includes('showToast')) additions.push('const showToast = useUIStore(state => state.showToast);');
    if (foundAuth.includes('profile')) additions.push('const profile = useAuthStore(state => state.profile);');
    if (foundAuth.includes('user')) additions.push('const user = useAuthStore(state => state.user);');
    if (foundAuth.includes('signOut')) additions.push('const logout = useAuthStore(state => state.logout);');

    replacements.push({ fullMatch, replacement, additions });
  }

  if (!needsUIStore && !needsAuthStore) {
    console.log('SKIP (no changes needed):', file);
    return;
  }

  // Add imports if needed
  const importLines = [];
  if (needsUIStore && !content.includes('useUIStore')) {
    importLines.push(`import { useUIStore } from '${storePath}uiStore';`);
  }
  if (needsAuthStore && !content.includes('useAuthStore')) {
    importLines.push(`import { useAuthStore } from '${storePath}authStore';`);
  }

  if (importLines.length) {
    const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?/g;
    const allImports = [...content.matchAll(importRegex)];
    if (allImports.length) {
      const lastImport = allImports[allImports.length - 1];
      const insertPos = lastImport.index + lastImport[0].length;
      content = content.slice(0, insertPos) + '\n' + importLines.join('\n') + content.slice(insertPos);
    }
  }

  // Apply replacements in reverse order to preserve indices
  for (let i = replacements.length - 1; i >= 0; i--) {
    const r = replacements[i];
    const idx = content.lastIndexOf(r.fullMatch);
    if (idx === -1) continue;
    const before = content.slice(0, idx);
    const after = content.slice(idx + r.fullMatch.length);
    let insert = r.replacement;
    if (r.additions.length) {
      if (insert) insert += '\n  ';
      else insert = '  ';
      insert += r.additions.join('\n  ');
    }
    content = before + insert + after;
  }

  // Remove useAppContext import if no longer used anywhere in file
  if (!content.includes('useAppContext')) {
    content = content.replace(/import\s+\{\s*useAppContext\s*\}\s+from\s+['"]\.\.\/context\/AppContext['"];?\n?/g, '');
  }

  // Clean up multiple blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(file, content);
  console.log('OK:', file);
});
