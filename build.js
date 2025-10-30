/**
 * Build script for Toast module
 * Creates a distributable package in the dist/ folder
 *
 * Usage:
 *   npm run build              - Standard build
 *   npm run build:production   - Production build with validation
 *   npm run build:zip          - Build and create ZIP
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MODULE_NAME = 'toast';
const DIST_DIR = path.join(__dirname, 'dist');
const MODULE_DIR = path.join(DIST_DIR, MODULE_NAME);

// Build flags
const args = process.argv.slice(2);
const PRODUCTION = args.includes('--production');
const SKIP_VALIDATION = args.includes('--skip-validation');
const VERBOSE = args.includes('--verbose');

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
  '.claude',
  'node_modules',
  'dist',
  'src',
  '.gitignore',
  'build.js',
  'build-zip.js',
  'package.json',
  'package-lock.json',
  'PLANNING.md',
  'PHASE-4-PLAN.md',
  'docs/'
];

/**
 * Logger with levels
 */
const log = {
  info: (msg) => console.log(msg),
  success: (msg) => console.log(msg),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  verbose: (msg) => VERBOSE && console.log(`   ${msg}`)
};

/**
 * Validation: Check version consistency
 */
function validateVersions() {
  log.info('🔍 Validating versions...');

  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const moduleJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'module.json'), 'utf8'));

  const packageVersion = packageJson.version;
  const moduleVersion = moduleJson.version;

  if (packageVersion !== moduleVersion) {
    log.error(`Version mismatch!`);
    log.error(`  package.json: ${packageVersion}`);
    log.error(`  module.json:  ${moduleVersion}`);
    log.error('');
    log.error('Please update both files to the same version.');
    process.exit(1);
  }

  log.verbose(`Version: ${packageVersion}`);
  return packageVersion;
}

/**
 * Validation: Check source modules exist
 */
function validateSourceModules() {
  log.info('🔍 Validating source modules...');

  const SRC_DIR = path.join(__dirname, 'src');

  const modules = [
    'tts/TTSCacheManager.js',
    'tts/ElevenLabsAPI.js',
    'ai/AIStatusWindow.js',
    'ai/AIProvider.js',
    'ai/ClaudeProvider.js',
    'ai/OpenAIProvider.js',
    'ai/AIProviderFactory.js',
    'templates/TemplateManager.js',
    'core/ToastManager.js',
    'core/ToastManagerIntegration.js',
    'index.js'
  ];

  const missing = [];

  for (const module of modules) {
    const modulePath = path.join(SRC_DIR, module);
    if (!fs.existsSync(modulePath)) {
      missing.push(module);
    } else {
      log.verbose(`✓ ${module}`);
    }
  }

  if (missing.length > 0) {
    log.error('Missing source modules:');
    missing.forEach(m => log.error(`  - ${m}`));
    process.exit(1);
  }

  log.verbose(`All ${modules.length} source modules found`);
}

/**
 * Validation: Check required files exist
 */
function validateRequiredFiles() {
  log.info('🔍 Validating required files...');

  const required = [
    'module.json',
    'package.json',
    'README.md',
    'CHANGELOG.md',
    'styles/toast.css'
  ];

  const missing = [];

  for (const file of required) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    } else {
      log.verbose(`✓ ${file}`);
    }
  }

  if (missing.length > 0) {
    log.error('Missing required files:');
    missing.forEach(f => log.error(`  - ${f}`));
    process.exit(1);
  }

  log.verbose(`All ${required.length} required files found`);
}

/**
 * Validation: Check CHANGELOG has entry for current version
 */
function validateChangelog(version) {
  log.info('🔍 Validating CHANGELOG...');

  const changelog = fs.readFileSync(path.join(__dirname, 'CHANGELOG.md'), 'utf8');

  // Check if version appears in changelog
  // Matches: "## 2.0.0", "## [2.0.0]", "## Version 2.0.0", "## v2.0.0"
  const versionPattern = new RegExp(`##\\s+(Version\\s+|v)?\\[?${version.replace(/\./g, '\\.')}\\]?`, 'i');

  if (!versionPattern.test(changelog)) {
    log.warn(`CHANGELOG.md does not contain an entry for version ${version}`);
    log.warn('Consider adding a changelog entry before releasing.');

    if (PRODUCTION) {
      log.error('Production builds require CHANGELOG entries. Use --skip-validation to bypass.');
      process.exit(1);
    }
  } else {
    log.verbose(`CHANGELOG entry found for v${version}`);
  }
}

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
 * Concatenate source modules into single toast.js file
 */
function concatenateModules() {
  log.info('🔧 Concatenating source modules...');

  const SRC_DIR = path.join(__dirname, 'src');
  const OUTPUT_FILE = path.join(__dirname, 'scripts', 'toast.js');

  // Module files in order of dependencies
  const modules = [
    // TTS Layer
    'tts/TTSCacheManager.js',
    'tts/ElevenLabsAPI.js',

    // AI Layer
    'ai/AIStatusWindow.js',
    'ai/AIProvider.js',
    'ai/ClaudeProvider.js',
    'ai/OpenAIProvider.js',
    'ai/AIProviderFactory.js',

    // Templates Layer
    'templates/TemplateManager.js',

    // Core Layer
    'core/ToastManager.js',
    'core/ToastManagerIntegration.js',

    // Entry point (hooks)
    'index.js'
  ];

  let concatenated = '';
  let totalLines = 0;

  for (const module of modules) {
    const modulePath = path.join(SRC_DIR, module);

    if (!fs.existsSync(modulePath)) {
      log.error(`Module not found: ${module}`);
      process.exit(1);
    }

    const content = fs.readFileSync(modulePath, 'utf8');
    const lines = content.split('\n').length;
    concatenated += content + '\n\n';
    totalLines += lines;

    log.verbose(`✓ ${module} (${lines} lines)`);
  }

  // Write concatenated file
  fs.writeFileSync(OUTPUT_FILE, concatenated, 'utf8');

  const sizeKB = (concatenated.length / 1024).toFixed(1);
  log.success(`✅ Created scripts/toast.js (${sizeKB} KB, ${totalLines} lines)`);

  return { size: sizeKB, lines: totalLines, modules: modules.length };
}

/**
 * Validate concatenated output
 */
function validateOutput() {
  log.info('🔍 Validating build output...');

  const outputFile = path.join(__dirname, 'scripts', 'toast.js');

  if (!fs.existsSync(outputFile)) {
    log.error('scripts/toast.js was not created!');
    process.exit(1);
  }

  const content = fs.readFileSync(outputFile, 'utf8');

  // Check for required classes
  const requiredClasses = [
    'TTSCacheManager',
    'ElevenLabsAPI',
    'AIStatusWindow',
    'AIProvider',
    'ClaudeProvider',
    'OpenAIProvider',
    'AIProviderFactory',
    'TemplateManager',
    'ToastManager'
  ];

  const missingClasses = [];

  for (const className of requiredClasses) {
    const pattern = new RegExp(`class ${className}`);
    if (!pattern.test(content)) {
      missingClasses.push(className);
    } else {
      log.verbose(`✓ ${className}`);
    }
  }

  if (missingClasses.length > 0) {
    log.error('Missing classes in output:');
    missingClasses.forEach(c => log.error(`  - ${c}`));
    process.exit(1);
  }

  // Check for Hooks
  if (!content.includes('Hooks.once("init"') || !content.includes('Hooks.once("ready"')) {
    log.error('Missing Foundry hooks in output!');
    process.exit(1);
  }

  log.verbose('All required classes and hooks found');
}

/**
 * Main build function
 */
function build() {
  const startTime = Date.now();

  log.info('🔨 Building Toast module...');
  log.info('');

  // Pre-build validation
  if (!SKIP_VALIDATION) {
    const version = validateVersions();
    validateSourceModules();
    validateRequiredFiles();
    validateChangelog(version);
    log.info('');
  }

  // Concatenate source modules first
  const buildStats = concatenateModules();

  // Validate output
  if (!SKIP_VALIDATION) {
    validateOutput();
  }

  log.info('');

  // Clean dist directory
  log.info('🧹 Cleaning dist directory...');
  if (fs.existsSync(DIST_DIR)) {
    removeDir(DIST_DIR);
  }

  // Create module directory
  log.info('📁 Creating module directory...');
  fs.mkdirSync(MODULE_DIR, { recursive: true });

  // Copy files and directories
  log.info('📦 Copying files...');

  let copiedFiles = 0;
  let copiedDirs = 0;

  INCLUDE.forEach(item => {
    const srcPath = path.join(__dirname, item);

    if (!fs.existsSync(srcPath)) {
      log.warn(`${item} not found, skipping...`);
      return;
    }

    const destPath = path.join(MODULE_DIR, item);

    if (item.endsWith('/')) {
      // Directory
      const dirName = item.slice(0, -1);
      log.verbose(`📂 ${dirName}/`);
      copyDir(path.join(__dirname, dirName), path.join(MODULE_DIR, dirName));
      copiedDirs++;
    } else {
      // File
      log.verbose(`📄 ${item}`);
      copyFile(srcPath, destPath);
      copiedFiles++;
    }
  });

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

  log.info('');
  log.success('✅ Build complete!');
  log.info('');
  log.info('📊 Build Summary:');
  log.info(`   Version: ${JSON.parse(fs.readFileSync(path.join(__dirname, 'module.json'), 'utf8')).version}`);
  log.info(`   Source modules: ${buildStats.modules}`);
  log.info(`   Output size: ${buildStats.size} KB`);
  log.info(`   Output lines: ${buildStats.lines}`);
  log.info(`   Files copied: ${copiedFiles}`);
  log.info(`   Directories copied: ${copiedDirs}`);
  log.info(`   Build time: ${elapsedTime}s`);
  log.info('');
  log.info(`📍 Output: ${MODULE_DIR}`);
  log.info('');

  if (PRODUCTION) {
    log.info('🎯 Production build complete!');
    log.info('   Next steps:');
    log.info('   1. Test the module in Foundry VTT');
    log.info('   2. Run "npm run build:zip" to create release package');
    log.info('   3. Create a GitHub release with the ZIP file');
  } else {
    log.info('To install:');
    log.info(`  1. Copy the "${MODULE_NAME}" folder from dist/ to your Foundry Data/modules/ directory`);
    log.info('  2. Restart Foundry or refresh the module list');
    log.info('  3. Enable the module in your world settings');
  }

  log.info('');
}

// Run build
try {
  build();
} catch (error) {
  log.error(`Build failed: ${error.message}`);
  if (VERBOSE) {
    console.error(error.stack);
  }
  process.exit(1);
}
