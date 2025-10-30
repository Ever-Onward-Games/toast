/**
 * Build ZIP archive for Toast module
 * Creates a toast.zip or toast-v{version}.zip file in the dist/ folder
 *
 * Usage:
 *   npm run build:zip           - Create toast.zip
 *   npm run build:zip:version   - Create toast-v2.0.0.zip
 */

const fs = require('fs');
const path = require('path');

const MODULE_NAME = 'toast';
const DIST_DIR = path.join(__dirname, 'dist');
const MODULE_DIR = path.join(DIST_DIR, MODULE_NAME);

// Build flags
const args = process.argv.slice(2);
const INCLUDE_VERSION = args.includes('--version');
const VERBOSE = args.includes('--verbose');

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
 * Get module version from module.json
 */
function getModuleVersion() {
  const moduleJsonPath = path.join(MODULE_DIR, 'module.json');

  if (!fs.existsSync(moduleJsonPath)) {
    log.error('module.json not found in dist. Run "npm run build" first.');
    process.exit(1);
  }

  const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
  return moduleJson.version;
}

/**
 * Get ZIP filename
 */
function getZipFilename() {
  if (INCLUDE_VERSION) {
    const version = getModuleVersion();
    return `${MODULE_NAME}-v${version}.zip`;
  }
  return `${MODULE_NAME}.zip`;
}

/**
 * Create ZIP using archiver (if available)
 */
async function createZipWithArchiver(zipPath) {
  try {
    const archiver = require('archiver');

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const sizeKB = (archive.pointer() / 1024).toFixed(2);
        const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);

        if (archive.pointer() > 1024 * 1024) {
          log.success(`✅ Created ${path.basename(zipPath)} (${sizeMB} MB)`);
        } else {
          log.success(`✅ Created ${path.basename(zipPath)} (${sizeKB} KB)`);
        }

        resolve();
      });

      output.on('error', reject);
      archive.on('error', reject);

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          log.warn(err.message);
        } else {
          reject(err);
        }
      });

      // Log progress
      archive.on('entry', (entry) => {
        log.verbose(`Adding: ${entry.name}`);
      });

      archive.pipe(output);
      archive.directory(MODULE_DIR, MODULE_NAME);
      archive.finalize();
    });
  } catch (error) {
    return null;
  }
}

/**
 * Create ZIP using native Node.js (fallback)
 */
function createZipNative(zipPath) {
  log.info('ℹ️  archiver not installed, using fallback method...');

  // Check if zip command is available
  const { execSync } = require('child_process');

  try {
    // Try PowerShell Compress-Archive (Windows)
    if (process.platform === 'win32') {
      const cmd = `powershell Compress-Archive -Path "${MODULE_DIR}" -DestinationPath "${zipPath}" -Force`;
      execSync(cmd, { cwd: __dirname, stdio: VERBOSE ? 'inherit' : 'pipe' });

      const stats = fs.statSync(zipPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

      if (stats.size > 1024 * 1024) {
        log.success(`✅ Created ${path.basename(zipPath)} (${sizeMB} MB)`);
      } else {
        log.success(`✅ Created ${path.basename(zipPath)} (${sizeKB} KB)`);
      }

      return true;
    }

    // Try zip command (Linux/Mac)
    const cmd = `cd "${DIST_DIR}" && zip -r "${path.basename(zipPath)}" "${MODULE_NAME}"`;
    execSync(cmd, { cwd: __dirname, stdio: VERBOSE ? 'inherit' : 'pipe' });

    const stats = fs.statSync(zipPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    if (stats.size > 1024 * 1024) {
      log.success(`✅ Created ${path.basename(zipPath)} (${sizeMB} MB)`);
    } else {
      log.success(`✅ Created ${path.basename(zipPath)} (${sizeKB} KB)`);
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate module directory
 */
function validateModuleDirectory() {
  log.info('🔍 Validating module directory...');

  if (!fs.existsSync(MODULE_DIR)) {
    log.error('Module directory not found.');
    log.error('Run "npm run build" first.');
    process.exit(1);
  }

  // Check for required files
  const requiredFiles = [
    'module.json',
    'README.md',
    'scripts/toast.js',
    'styles/toast.css'
  ];

  const missing = [];

  for (const file of requiredFiles) {
    const filePath = path.join(MODULE_DIR, file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    } else {
      log.verbose(`✓ ${file}`);
    }
  }

  if (missing.length > 0) {
    log.error('Missing required files in dist:');
    missing.forEach(f => log.error(`  - ${f}`));
    log.error('');
    log.error('Run "npm run build" to create a complete build first.');
    process.exit(1);
  }

  log.verbose('All required files present');
}

/**
 * Main function
 */
async function buildZip() {
  const startTime = Date.now();

  log.info('📦 Creating ZIP archive...');
  log.info('');

  // Validate module directory exists
  validateModuleDirectory();

  const zipFilename = getZipFilename();
  const zipPath = path.join(DIST_DIR, zipFilename);

  log.info('');

  // Remove existing ZIP if it exists
  if (fs.existsSync(zipPath)) {
    log.verbose(`Removing existing ${zipFilename}...`);
    fs.unlinkSync(zipPath);
  }

  // Try archiver first
  const archiverResult = await createZipWithArchiver(zipPath);

  if (archiverResult === null) {
    // Fallback to native methods
    const nativeResult = createZipNative(zipPath);

    if (!nativeResult) {
      log.info('');
      log.error('Could not create ZIP automatically.');
      log.info('');
      log.info('To create a ZIP manually:');
      log.info(`  1. Navigate to: ${DIST_DIR}`);
      log.info(`  2. Compress the "${MODULE_NAME}" folder into ${zipFilename}`);
      log.info('');
      log.info('Or install archiver:');
      log.info('  npm install archiver');
      log.info('  npm run build:zip');
      process.exit(1);
    }
  }

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

  log.info('');
  log.success('✅ ZIP creation complete!');
  log.info('');
  log.info('📊 Summary:');
  log.info(`   File: ${zipFilename}`);
  log.info(`   Location: ${DIST_DIR}`);
  log.info(`   Build time: ${elapsedTime}s`);
  log.info('');
  log.info('📦 Release package ready!');
  log.info('');
  log.info('Next steps:');
  log.info('  1. Test installation from ZIP in Foundry VTT');
  log.info('  2. Create a GitHub release');
  log.info('  3. Upload the ZIP as a release asset');
  log.info('');
}

// Run
buildZip().catch(error => {
  log.error(`ZIP creation failed: ${error.message}`);
  if (VERBOSE) {
    console.error(error.stack);
  }
  process.exit(1);
});
