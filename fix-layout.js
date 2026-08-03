const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<DashboardLayout>')) {
        // Remove import
        content = content.replace(/import\s*{\s*DashboardLayout\s*}\s*from\s*["']@\/layouts\/dashboard-layout["'];?\n?/g, '');
        // Replace wrapper
        content = content.replace(/<DashboardLayout>/g, '<>');
        content = content.replace(/<\/DashboardLayout>/g, '</>');
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'app/dashboard'));
