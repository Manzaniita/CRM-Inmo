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

  // Remove orphaned useAppContext import
  const useAppContextCount = (content.match(/useAppContext/g) || []).length;
  if (useAppContextCount === 1) {
    content = content.replace(/import\s+\{\s*useAppContext\s*\}\s+from\s+['"]\.\.\/context\/AppContext['"];?\n?/g, '');
  }

  // Clean up double semicolons
  content = content.replace(/;\s*;/g, ';');

  fs.writeFileSync(file, content);
  console.log('POST:', file);
});
