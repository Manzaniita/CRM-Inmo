const fs = require('fs');
const path = require('path');

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
    console.log('SKIP (not found):', file);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  const storePath = getStorePath(file);

  let needsUIStore = false;
  let needsAuthStore = false;
  let hasAppContext = content.includes('useAppContext');

  // Find all destructuring occurrences of useAppContext()
  const regex = /const\s*\{([^}]*)\}\s*=\s*useAppContext\(\)/g;
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

    let replacement;
    if (remaining.length > 0) {
      replacement = `const { ${remaining.join(', ')} } = useAppContext()`;
    } else {
      replacement = '';
    }

    replacements.push({ fullMatch, replacement, foundUI, foundAuth });
  }

  if (!needsUIStore && !needsAuthStore) {
    console.log('SKIP (no ui/auth needed):', file);
    return;
  }

  // Add imports if needed
  const importRegex = /import\s+.*?\s+from\s+['"][^'"]+['"];?/g;
  const allImports = [...content.matchAll(importRegex)];
  const lastImport = allImports[allImports.length - 1];
  const insertPos = lastImport ? lastImport.index + lastImport[0].length : 0;

  const linesToAdd = [];
  if (needsUIStore && !content.includes('useUIStore')) {
    linesToAdd.push(`import { useUIStore } from '${storePath}uiStore';`);
  }
  if (needsAuthStore && !content.includes('useAuthStore')) {
    linesToAdd.push(`import { useAuthStore } from '${storePath}authStore';`);
  }

  if (linesToAdd.length) {
    content = content.slice(0, insertPos) + '\n' + linesToAdd.join('\n') + content.slice(insertPos);
  }

  // Build set of declarations to insert after the LAST useAppContext line
  const declarations = [];
  replacements.forEach(r => {
    if (r.foundUI.includes('showToast')) declarations.push(`const showToast = useUIStore(state => state.showToast);`);
    if (r.foundAuth.includes('profile')) declarations.push(`const profile = useAuthStore(state => state.profile);`);
    if (r.foundAuth.includes('user')) declarations.push(`const user = useAuthStore(state => state.user);`);
    if (r.foundAuth.includes('signOut')) declarations.push(`const logout = useAuthStore(state => state.logout);`);
  });
  const uniqueDeclarations = [...new Set(declarations)];

  // Apply replacements
  replacements.forEach(r => {
    content = content.replace(r.fullMatch, r.replacement);
  });

  // Insert declarations after the first remaining useAppContext call or after the last replacement position
  // We'll insert after the first occurrence of "useAppContext()" that still exists
  const remainingCtxIdx = content.search(/useAppContext\(\)/);
  if (remainingCtxIdx !== -1) {
    const lineEnd = content.indexOf('\n', remainingCtxIdx);
    const pos = lineEnd !== -1 ? lineEnd : remainingCtxIdx;
    content = content.slice(0, pos) + '\n' + uniqueDeclarations.join('\n') + content.slice(pos);
  } else {
    // No remaining useAppContext, insert after last import
    content = content.slice(0, insertPos) + '\n' + uniqueDeclarations.join('\n') + '\n' + content.slice(insertPos);
  }

  // Clean up double blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  // Remove useAppContext import if no longer used
  if (!content.includes('useAppContext')) {
    content = content.replace(/import\s+\{\s*useAppContext\s*\}\s+from\s+['"]\.\.\/context\/AppContext['"];?\n?/g, '');
  }

  fs.writeFileSync(file, content);
  console.log('OK:', file);
});
