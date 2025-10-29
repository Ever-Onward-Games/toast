/**
 * Build ZIP archive for Toast module
 * Creates a toast.zip file in the dist/ folder
 */

const fs = require('fs');
const path = require('path');

const MODULE_NAME = 'toast';
const DIST_DIR = path.join(__dirname, 'dist');
const MODULE_DIR = path.join(DIST_DIR, MODULE_NAME);
const ZIP_PATH = path.join(DIST_DIR, `${MODULE_NAME}.zip`);

/**
 * Create ZIP using archiver (if available)
 */
async function createZipWithArchiver() {
  try {
    const archiver = require('archiver');

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(ZIP_PATH);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const sizeKB = (archive.pointer() / 1024).toFixed(2);
        console.log(`✅ Created ${MODULE_NAME}.zip (${sizeKB} KB)`);
        resolve();
      });

      archive.on('error', reject);

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
function createZipNative() {
  console.log('ℹ️  archiver not installed, using fallback method...');

  // Check if zip command is available
  const { execSync } = require('child_process');

  try {
    // Try PowerShell Compress-Archive (Windows)
    if (process.platform === 'win32') {
      const cmd = `powershell Compress-Archive -Path "${MODULE_DIR}" -DestinationPath "${ZIP_PATH}" -Force`;
      execSync(cmd, { cwd: __dirname });
      console.log(`✅ Created ${MODULE_NAME}.zip`);
      return true;
    }

    // Try zip command (Linux/Mac)
    const cmd = `cd "${DIST_DIR}" && zip -r "${MODULE_NAME}.zip" "${MODULE_NAME}"`;
    execSync(cmd, { cwd: __dirname });
    console.log(`✅ Created ${MODULE_NAME}.zip`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main function
 */
async function buildZip() {
  console.log('📦 Creating ZIP archive...');

  // Check if module directory exists
  if (!fs.existsSync(MODULE_DIR)) {
    console.error('❌ Error: Module directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Try archiver first
  const archiverResult = await createZipWithArchiver();

  if (archiverResult === null) {
    // Fallback to native methods
    const nativeResult = createZipNative();

    if (!nativeResult) {
      console.log('');
      console.log('⚠️  Could not create ZIP automatically.');
      console.log('');
      console.log('To create a ZIP manually:');
      console.log(`  1. Navigate to: ${DIST_DIR}`);
      console.log(`  2. Compress the "${MODULE_NAME}" folder into ${MODULE_NAME}.zip`);
      console.log('');
      console.log('Or install archiver:');
      console.log('  npm install archiver');
      console.log('  npm run build:zip');
    }
  }
}

// Run
buildZip().catch(error => {
  console.error('❌ ZIP creation failed:', error.message);
  process.exit(1);
});
