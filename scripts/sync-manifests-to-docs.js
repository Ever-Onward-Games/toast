/**
 * Sync module.json manifests to docs/ for GitHub Pages
 * Run this after building to update the public manifest files
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// Module configurations
const MODULES = [
  {
    name: 'toast-player',
    distPath: path.join(DIST_DIR, 'toast-player', 'module.json'),
    docsPath: path.join(DOCS_DIR, 'toast-player', 'module.json')
  },
  {
    name: 'toast-studio',
    distPath: path.join(DIST_DIR, 'toast-studio', 'module.json'),
    docsPath: path.join(DOCS_DIR, 'toast-studio', 'module.json')
  }
];

console.log('📄 Syncing module.json manifests to docs/ for GitHub Pages...\n');

// Ensure docs directories exist
for (const module of MODULES) {
  const docsDir = path.dirname(module.docsPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    console.log(`✅ Created directory: ${path.relative(ROOT_DIR, docsDir)}`);
  }
}

// Copy manifest files
for (const module of MODULES) {
  if (!fs.existsSync(module.distPath)) {
    console.error(`❌ Error: ${module.name} manifest not found at ${module.distPath}`);
    console.error('   Run "npm run build" first!');
    process.exit(1);
  }

  // Copy the file
  fs.copyFileSync(module.distPath, module.docsPath);
  console.log(`✅ Synced ${module.name}/module.json → docs/${module.name}/`);
}

console.log('\n✅ All manifests synced to docs/');
console.log('\n📍 GitHub Pages URLs:');
console.log('   Toast Player: https://ever-onward-games.github.io/toast/toast-player/module.json');
console.log('   Toast Studio: https://ever-onward-games.github.io/toast/toast-studio/module.json');
console.log('\n💡 Commit and push docs/ folder to publish to GitHub Pages');
