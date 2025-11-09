/**
 * Validate Version Sync
 * Ensures all packages have the same version number
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

function validateVersions() {
  console.log('🔍 Validating version sync...');

  // Read root package.json
  const rootPkgPath = path.join(ROOT_DIR, 'package.json');
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  const rootVersion = rootPkg.version;

  console.log(`   Root version: ${rootVersion}`);

  const packages = ['toast-player', 'toast-studio'];
  const versions = { root: rootVersion };
  let hasError = false;

  for (const pkgName of packages) {
    const pkgDir = path.join(PACKAGES_DIR, pkgName);
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    const moduleJsonPath = path.join(pkgDir, 'module.json');

    // Read package.json
    if (!fs.existsSync(pkgJsonPath)) {
      console.error(`❌ Missing package.json: ${pkgJsonPath}`);
      hasError = true;
      continue;
    }

    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    versions[`${pkgName}-package`] = pkgJson.version;

    // Read module.json
    if (!fs.existsSync(moduleJsonPath)) {
      console.error(`❌ Missing module.json: ${moduleJsonPath}`);
      hasError = true;
      continue;
    }

    const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
    versions[`${pkgName}-module`] = moduleJson.version;

    // Check sync
    if (pkgJson.version !== rootVersion) {
      console.error(`❌ Version mismatch in ${pkgName}/package.json: ${pkgJson.version} (expected ${rootVersion})`);
      hasError = true;
    }

    if (moduleJson.version !== rootVersion) {
      console.error(`❌ Version mismatch in ${pkgName}/module.json: ${moduleJson.version} (expected ${rootVersion})`);
      hasError = true;
    }

    console.log(`   ${pkgName}: ${pkgJson.version} (package.json), ${moduleJson.version} (module.json)`);
  }

  if (hasError) {
    console.error('');
    console.error('❌ Version sync validation failed!');
    console.error('');
    console.error('All versions:');
    Object.entries(versions).forEach(([key, ver]) => {
      console.error(`   ${key}: ${ver}`);
    });
    console.error('');
    console.error('Fix: Run "npm run version:sync" to synchronize all versions.');
    process.exit(1);
  }

  console.log('✅ All versions are in sync!');
}

validateVersions();
