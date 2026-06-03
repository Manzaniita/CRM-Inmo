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

  const declarations = [];
  const newLines = [];
  let componentBodyStart = -1;

  // Find where component body starts
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(export\s+default\s+function|function\s+\w+)\s*\(/.test(lines[i])) {
      componentBodyStart = i + 1;
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^const\s+(showToast|profile|user|logout)\s*=\s*use(UI|Auth)Store/.test(trimmed)) {
      declarations.push(lines[i].trim());
      continue;
    }
    newLines.push(lines[i]);
  }

  if (declarations.length && componentBodyStart !== -1) {
    // Find adjusted index after removing lines
    let adjustedIdx = componentBodyStart;
    newLines.splice(adjustedIdx, 0, ...declarations.map(d => '  ' + d));
  }

  content = newLines.join('\n');

  // Remove useAppContext import if unused
  if (!content.includes('useAppContext')) {
    content = content.replace(/import\s+\{\s*useAppContext\s*\}\s+from\s+['"]\.\.\/context\/AppContext['"];?\n?/g, '');
  }

  content = content.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(file, content);
  console.log('FIXED2:', file);
});
