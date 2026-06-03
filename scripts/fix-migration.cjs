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

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Collect module-level store declarations to move inside component
  const declarations = [];
  const newLines = [];
  let insideComponent = false;
  let componentBodyStart = -1; // line index where we should insert declarations

  // Find component body start: first line with 'export default function' or 'function XXXX('
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(export\s+default\s+function|function\s+\w+)\s*\(/.test(line)) {
      componentBodyStart = i + 1;
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^const\s+(showToast|profile|user|logout)\s*=\s*use( UI | Auth )Store/.test(line.trim())) {
      declarations.push(line.trim());
      continue; // skip adding this line at module level
    }
    newLines.push(line);
  }

  if (declarations.length && componentBodyStart !== -1) {
    // Insert declarations right after component signature line
    newLines.splice(componentBodyStart, 0, ...declarations);
  }

  content = newLines.join('\n');

  // Remove useAppContext import if no longer used
  if (!content.includes('useAppContext')) {
    content = content.replace(/import\s+\{\s*useAppContext\s*\}\s+from\s+['"]\.\.\/context\/AppContext['"];?\n?/g, '');
  }

  // Clean up triple blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(file, content);
  console.log('FIXED:', file);
});
