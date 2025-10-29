/**
 * Build script for Toast module
 * Creates a distributable package in the dist/ folder
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MODULE_NAME = 'toast';
const DIST_DIR = path.join(__dirname, 'dist');
const MODULE_DIR = path.join(DIST_DIR, MODULE_NAME);

// Files and directories to include in the distribution
const INCLUDE = [
  'module.json',
  'README.md',
  'CHANGELOG.md',
  'scripts/',
  'styles/',
  'sounds/'
];

// Files and directories to exclude
const EXCLUDE = [
  '.git',
  '.idea',
  'node_modules',
  'dist',
  '.gitignore',
  'build.js',
  'package.json',
  'package-lock.json',
  '.claude'
];

/**
 * Remove directory recursively
 */
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        removeDir(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
    fs.rmdirSync(dir);
  }
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy file
 */
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

/**
 * Main build function
 */
function build() {
  console.log('🔨 Building Toast module...');

  // Clean dist directory
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync(DIST_DIR)) {
    removeDir(DIST_DIR);
  }

  // Create module directory
  console.log('📁 Creating module directory...');
  fs.mkdirSync(MODULE_DIR, { recursive: true });

  // Copy files and directories
  console.log('📦 Copying files...');

  INCLUDE.forEach(item => {
    const srcPath = path.join(__dirname, item);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️  Warning: ${item} not found, skipping...`);
      return;
    }

    const destPath = path.join(MODULE_DIR, item);

    if (item.endsWith('/')) {
      // Directory
      const dirName = item.slice(0, -1);
      console.log(`  📂 ${dirName}/`);
      copyDir(path.join(__dirname, dirName), path.join(MODULE_DIR, dirName));
    } else {
      // File
      console.log(`  📄 ${item}`);
      copyFile(srcPath, destPath);
    }
  });

  console.log('✅ Build complete!');
  console.log(`📍 Output: ${MODULE_DIR}`);
  console.log('');
  console.log('To install:');
  console.log(`  1. Copy the "${MODULE_NAME}" folder from dist/ to your Foundry Data/modules/ directory`);
  console.log('  2. Restart Foundry or refresh the module list');
  console.log('  3. Enable the module in your world settings');
}

// Run build
try {
  build();
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
