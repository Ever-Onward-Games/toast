/**
 * Create ZIP files for Toast Player and Toast Studio
 * Creates versioned ZIP files for distribution
 *
 * Usage:
 *   node build-zip-monorepo.js              - Create unversioned ZIPs
 *   node build-zip-monorepo.js --version    - Create versioned ZIPs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build flags
const args = process.argv.slice(2);
const USE_VERSION = args.includes('--version');
const VERBOSE = args.includes('--verbose');

// Directories
const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Check if archiver is available (optional dependency)
let archiver;
try {
  archiver = require('archiver');
} catch (err) {
  archiver = null;
}

/**
 * Logger
 */
const log = {
  info: (msg) => console.log(msg),
  success: (msg) => console.log(msg),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  verbose: (msg) => VERBOSE && console.log(`   ${msg}`)
};

/**
 * Get version from package
 */
function getVersion(packageName) {
  const pkgPath = path.join(ROOT_DIR, 'packages', packageName, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

/**
 * Create ZIP using archiver (if available) or system zip command
 */
function createZip(sourceDir, outputPath, packageName) {
  if (archiver) {
    return createZipWithArchiver(sourceDir, outputPath, packageName);
  } else {
    return createZipWithCommand(sourceDir, outputPath, packageName);
  }
}

/**
 * Create ZIP using archiver library (preferred)
 */
function createZipWithArchiver(sourceDir, outputPath, packageName) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(1);
      log.success(`✅ Created ${path.basename(outputPath)} (${sizeKB} KB)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, packageName);
    archive.finalize();
  });
}

/**
 * Create ZIP using system command (fallback)
 */
function createZipWithCommand(sourceDir, outputPath, packageName) {
  try {
    // Change to dist directory
    const originalDir = process.cwd();
    process.chdir(DIST_DIR);

    // Create ZIP
    if (process.platform === 'win32') {
      // Windows: Use PowerShell
      execSync(`powershell Compress-Archive -Path "${packageName}" -DestinationPath "${path.basename(outputPath)}" -Force`, {
        stdio: VERBOSE ? 'inherit' : 'pipe'
      });
    } else {
      // Unix: Use zip command
      execSync(`zip -r "${path.basename(outputPath)}" "${packageName}"`, {
        stdio: VERBOSE ? 'inherit' : 'pipe'
      });
    }

    // Return to original directory
    process.chdir(originalDir);

    // Get file size
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    log.success(`✅ Created ${path.basename(outputPath)} (${sizeKB} KB)`);

    return Promise.resolve();
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('');
  log.info('📦 Creating ZIP files...');
  console.log('');

  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    log.error('dist/ directory not found!');
    log.error('Please run "npm run build" first.');
    process.exit(1);
  }

  // Packages to zip
  const packages = ['toast-player', 'toast-studio'];

  for (const packageName of packages) {
    const sourceDir = path.join(DIST_DIR, packageName);

    // Check if package directory exists
    if (!fs.existsSync(sourceDir)) {
      log.warn(`Skipping ${packageName} (not found in dist/)`);
      continue;
    }

    // Determine output filename
    const version = getVersion(packageName);
    const zipName = USE_VERSION
      ? `${packageName}-v${version}.zip`
      : `${packageName}.zip`;
    const outputPath = path.join(DIST_DIR, zipName);

    // Create ZIP
    log.info(`🗜️  Creating ${zipName}...`);
    try {
      await createZip(sourceDir, outputPath, packageName);
    } catch (err) {
      log.error(`Failed to create ZIP for ${packageName}:`);
      log.error(err.message);
      process.exit(1);
    }
  }

  console.log('');
  log.success('✅ All ZIP files created!');
  console.log('');
  log.info('📍 Output directory: dist/');
  console.log('');

  // List created ZIPs
  const zipFiles = fs.readdirSync(DIST_DIR).filter(f => f.endsWith('.zip'));
  if (zipFiles.length > 0) {
    log.info('📦 Created files:');
    zipFiles.forEach(file => {
      const stats = fs.statSync(path.join(DIST_DIR, file));
      const sizeKB = (stats.size / 1024).toFixed(1);
      log.info(`   ${file} (${sizeKB} KB)`);
    });
    console.log('');
  }
}

// Run
main().catch(err => {
  log.error('ZIP creation failed:');
  log.error(err.message);
  if (VERBOSE) {
    console.error(err.stack);
  }
  process.exit(1);
});
