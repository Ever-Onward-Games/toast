/**
 * Monorepo Build Script for Toast Player and Toast Studio
 * Creates distributable packages for both modules
 *
 * Usage:
 *   npm run build                    - Build both packages
 *   npm run build:player             - Build only toast-player
 *   npm run build:studio             - Build only toast-studio
 *   npm run build -- --production    - Production build with validation
 */

const fs = require('fs');
const path = require('path');
const sass = require('sass');

// Build flags
const args = process.argv.slice(2);
const PRODUCTION = args.includes('--production');
const VERBOSE = args.includes('--verbose');
const PACKAGE_ARG = args.find(arg => arg.startsWith('--package='));
const SPECIFIC_PACKAGE = PACKAGE_ARG ? PACKAGE_ARG.split('=')[1] : null;

// Directories
const ROOT_DIR = __dirname;
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Package configurations
const PACKAGES = {
  'toast-player': {
    name: 'toast-player',
    dir: path.join(PACKAGES_DIR, 'toast-player'),
    distDir: path.join(DIST_DIR, 'toast-player'),
    sourceModules: [
      // Core Layer (has all playback functionality for now)
      'core/ToastManager.js',

      // Packages Layer (data model)
      'packages/Package.js',

      // Entry point
      'player-index.js'
    ],
    requiredClasses: [
      'ToastManager',
      'Package'
    ],
    hasStyles: true,
    scssEntry: 'toast-player.scss',
    cssOutput: 'toast-player.css',
    jsOutput: 'toast-player.js'
  },
  'toast-studio': {
    name: 'toast-studio',
    dir: path.join(PACKAGES_DIR, 'toast-studio'),
    distDir: path.join(DIST_DIR, 'toast-studio'),
    sourceModules: [
      // Utils Layer
      'utils/webp-anim-utils.js',
      'utils/apng-anim-utils.js',

      // Packages Layer (CRUD operations)
      'packages/PackageManager.js',
      'packages/TokenMappingDialog.js',

      // Animator Layer (Phase 1 - more coming in future phases)
      'animator/StudioCanvas.js',

      // UI Layer
      'ui/ToastStudioApp.js',

      // Entry point
      'studio-index.js'
    ],
    requiredClasses: [
      'PackageManager',
      'TokenMappingDialog',
      'StudioCanvas',
      'ToastStudioApp'
    ],
    hasStyles: true,
    scssEntry: 'toast-studio.scss',
    cssOutput: 'toast-studio.css',
    jsOutput: 'toast-studio.js'
  }
};

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
 * Validate version sync across all packages
 */
function validateVersionSync() {
  log.info('🔍 Validating version sync across packages...');

  const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const rootVersion = rootPkg.version;

  const versions = { root: rootVersion };

  for (const [pkgName, config] of Object.entries(PACKAGES)) {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(config.dir, 'package.json'), 'utf8'));
    const modJson = JSON.parse(fs.readFileSync(path.join(config.dir, 'module.json'), 'utf8'));

    versions[`${pkgName}-package`] = pkgJson.version;
    versions[`${pkgName}-module`] = modJson.version;

    if (pkgJson.version !== modJson.version || pkgJson.version !== rootVersion) {
      log.error('Version mismatch detected!');
      Object.entries(versions).forEach(([key, ver]) => {
        log.error(`  ${key}: ${ver}`);
      });
      log.error('');
      log.error('Run "npm run version:sync" to fix this.');
      process.exit(1);
    }
  }

  log.verbose(`All packages synced at version: ${rootVersion}`);
  return rootVersion;
}

/**
 * Compile SCSS to CSS for a package
 */
function compileScss(packageConfig) {
  if (!packageConfig.hasStyles) {
    log.verbose(`Skipping SCSS compilation for ${packageConfig.name} (no styles)`);
    return;
  }

  log.info(`🎨 Compiling SCSS for ${packageConfig.name}...`);

  const scssPath = path.join(packageConfig.dir, 'styles', packageConfig.scssEntry);
  const cssOutputPath = path.join(packageConfig.distDir, 'styles', packageConfig.cssOutput);

  // Ensure styles directory exists
  fs.mkdirSync(path.join(packageConfig.distDir, 'styles'), { recursive: true });

  try {
    const result = sass.compile(scssPath, {
      style: PRODUCTION ? 'compressed' : 'expanded',
      sourceMap: !PRODUCTION
    });

    fs.writeFileSync(cssOutputPath, result.css);

    const sizeKB = (result.css.length / 1024).toFixed(1);
    log.success(`✅ Compiled ${packageConfig.scssEntry} → ${packageConfig.cssOutput} (${sizeKB} KB)`);
  } catch (err) {
    log.error(`Failed to compile SCSS for ${packageConfig.name}:`);
    log.error(err.message);
    process.exit(1);
  }
}

/**
 * Concatenate source modules for a package
 */
function concatenateSourceModules(packageConfig) {
  log.info(`🔧 Concatenating source modules for ${packageConfig.name}...`);

  const srcDir = path.join(packageConfig.dir, 'src');
  const scriptsDir = path.join(packageConfig.distDir, 'scripts');
  const outputPath = path.join(scriptsDir, packageConfig.jsOutput);

  // Ensure scripts directory exists
  fs.mkdirSync(scriptsDir, { recursive: true });

  let concatenated = '';
  let missing = [];

  for (const modulePath of packageConfig.sourceModules) {
    const fullPath = path.join(srcDir, modulePath);

    if (!fs.existsSync(fullPath)) {
      missing.push(modulePath);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    concatenated += `\n// ============================================\n`;
    concatenated += `// ${modulePath}\n`;
    concatenated += `// ============================================\n\n`;
    concatenated += content;
    concatenated += '\n\n';
  }

  if (missing.length > 0) {
    log.warn(`Missing ${missing.length} source module(s) for ${packageConfig.name}:`);
    missing.forEach(m => log.warn(`  - ${m}`));
    log.warn('Build will continue, but functionality may be incomplete.');
  }

  // Write output
  fs.writeFileSync(outputPath, concatenated, 'utf8');

  const sizeKB = (concatenated.length / 1024).toFixed(1);
  const lines = concatenated.split('\n').length;
  log.success(`✅ Created ${packageConfig.jsOutput} (${sizeKB} KB, ${lines} lines)`);

  return { sizeKB, lines, missingCount: missing.length };
}

/**
 * Copy files and directories for a package
 */
function copyPackageFiles(packageConfig) {
  log.info(`📦 Copying files for ${packageConfig.name}...`);

  const includes = [
    'module.json',
    'templates',
    'lang',
    'sounds',
    'images'
  ];

  let copiedFiles = 0;
  let copiedDirs = 0;

  for (const item of includes) {
    const srcPath = path.join(packageConfig.dir, item);
    const destPath = path.join(packageConfig.distDir, item);

    if (!fs.existsSync(srcPath)) {
      log.verbose(`Skipping ${item} (not found)`);
      continue;
    }

    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      copyDirectory(srcPath, destPath);
      copiedDirs++;
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      copiedFiles++;
    }
  }

  log.verbose(`Copied ${copiedFiles} file(s) and ${copiedDirs} directory(ies)`);
  return { copiedFiles, copiedDirs };
}

/**
 * Copy directory recursively
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Clean dist directory
 */
function cleanDist() {
  log.info('🧹 Cleaning dist directory...');

  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
}

/**
 * Build a single package
 */
function buildPackage(packageConfig) {
  console.log('');
  log.info(`🔨 Building ${packageConfig.name}...`);
  console.log('');

  // Create dist directory
  fs.mkdirSync(packageConfig.distDir, { recursive: true });

  // Compile SCSS
  if (packageConfig.hasStyles) {
    compileScss(packageConfig);
  }

  // Concatenate source modules
  const jsStats = concatenateSourceModules(packageConfig);

  // Copy files
  const copyStats = copyPackageFiles(packageConfig);

  console.log('');
  log.success(`✅ ${packageConfig.name} build complete!`);

  return {
    package: packageConfig.name,
    jsStats,
    copyStats
  };
}

/**
 * Main build function
 */
async function build() {
  const startTime = Date.now();

  console.log('');
  log.info('🔨 Toast Monorepo Build');
  console.log('');

  // Validate version sync
  const version = validateVersionSync();

  // Clean dist
  cleanDist();

  // Determine which packages to build
  let packagesToBuild = [];

  if (SPECIFIC_PACKAGE) {
    if (!PACKAGES[SPECIFIC_PACKAGE]) {
      log.error(`Unknown package: ${SPECIFIC_PACKAGE}`);
      log.error(`Available packages: ${Object.keys(PACKAGES).join(', ')}`);
      process.exit(1);
    }
    packagesToBuild.push(PACKAGES[SPECIFIC_PACKAGE]);
  } else {
    // Build all packages
    packagesToBuild = Object.values(PACKAGES);
  }

  console.log('');
  log.info(`📦 Building ${packagesToBuild.length} package(s)...`);

  // Build packages
  const results = [];
  for (const packageConfig of packagesToBuild) {
    const result = buildPackage(packageConfig);
    results.push(result);
  }

  // Summary
  const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  log.info('═══════════════════════════════════════');
  log.success('✅ Build Complete!');
  log.info('═══════════════════════════════════════');
  console.log('');
  log.info(`📊 Build Summary:`);
  log.info(`   Version: ${version}`);
  log.info(`   Packages built: ${results.length}`);
  log.info(`   Build time: ${buildTime}s`);
  console.log('');

  for (const result of results) {
    log.info(`   ${result.package}:`);
    log.info(`     Output: dist/${result.package}/`);
    log.info(`     JS size: ${result.jsStats.sizeKB} KB (${result.jsStats.lines} lines)`);
    log.info(`     Files copied: ${result.copyStats.copiedFiles}`);
    log.info(`     Directories copied: ${result.copyStats.copiedDirs}`);
    if (result.jsStats.missingCount > 0) {
      log.warn(`     Missing modules: ${result.jsStats.missingCount}`);
    }
    console.log('');
  }

  log.info('📍 Output directory: dist/');
  console.log('');
  log.info('To install:');
  log.info('  1. Copy dist/toast-player/ to Foundry Data/modules/');
  log.info('  2. Copy dist/toast-studio/ to Foundry Data/modules/');
  log.info('  3. Restart Foundry or refresh the module list');
  log.info('  4. Enable both modules in your world settings');
  console.log('');

  if (PRODUCTION) {
    log.success('🎯 Production build complete!');
    log.info('   Next steps:');
    log.info('   1. Test both modules in Foundry VTT');
    log.info('   2. Run "npm run build:zip:version" to create release packages');
    log.info('   3. Create a GitHub release with the ZIP files');
    console.log('');
  }
}

// Run build
build().catch(err => {
  log.error('Build failed:');
  log.error(err.message);
  if (VERBOSE) {
    console.error(err.stack);
  }
  process.exit(1);
});
