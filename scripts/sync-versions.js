/**
 * Sync Versions
 * Updates all package versions to match the root package.json
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

function syncVersions(targetVersion) {
  console.log('🔄 Syncing versions...');

  // Read root package.json
  const rootPkgPath = path.join(ROOT_DIR, 'package.json');
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
  const rootVersion = targetVersion || rootPkg.version;

  console.log(`   Target version: ${rootVersion}`);

  // Update root package.json if needed
  if (rootPkg.version !== rootVersion) {
    rootPkg.version = rootVersion;
    fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
    console.log(`   ✅ Updated root package.json to ${rootVersion}`);
  }

  const packages = ['toast-player', 'toast-studio'];

  for (const pkgName of packages) {
    const pkgDir = path.join(PACKAGES_DIR, pkgName);
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    const moduleJsonPath = path.join(pkgDir, 'module.json');

    // Update package.json
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkgJson.version !== rootVersion) {
        pkgJson.version = rootVersion;
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
        console.log(`   ✅ Updated ${pkgName}/package.json to ${rootVersion}`);
      } else {
        console.log(`   ✓ ${pkgName}/package.json already at ${rootVersion}`);
      }
    }

    // Update module.json
    if (fs.existsSync(moduleJsonPath)) {
      const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
      if (moduleJson.version !== rootVersion) {
        moduleJson.version = rootVersion;
        fs.writeFileSync(moduleJsonPath, JSON.stringify(moduleJson, null, 2) + '\n');
        console.log(`   ✅ Updated ${pkgName}/module.json to ${rootVersion}`);
      } else {
        console.log(`   ✓ ${pkgName}/module.json already at ${rootVersion}`);
      }
    }
  }

  console.log('');
  console.log('✅ All versions synced to ' + rootVersion);
}

// Allow passing version as argument
const targetVersion = process.argv[2];
syncVersions(targetVersion);
