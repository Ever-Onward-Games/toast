/**
 * Bump to the next beta version
 * Usage: npm run version:bump-beta
 *
 * This script:
 * 1. Reads the current version from root package.json
 * 2. Increments the beta number (e.g., 3.0.0-beta.1 -> 3.0.0-beta.2)
 * 3. Syncs the new version across all packages
 * 4. Updates CHANGELOG.md with new version header
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ROOT_PKG_PATH = path.join(ROOT_DIR, 'package.json');
const CHANGELOG_PATH = path.join(ROOT_DIR, 'CHANGELOG.md');

/**
 * Parse version and increment beta number
 */
function incrementBetaVersion(version) {
  const betaMatch = version.match(/^(\d+\.\d+\.\d+)-beta\.(\d+)$/);

  if (!betaMatch) {
    console.error(`❌ Current version "${version}" is not a beta version`);
    console.error('   Beta versions should follow format: X.Y.Z-beta.N');
    process.exit(1);
  }

  const baseVersion = betaMatch[1];
  const betaNumber = parseInt(betaMatch[2], 10);
  const newBetaNumber = betaNumber + 1;

  return `${baseVersion}-beta.${newBetaNumber}`;
}

/**
 * Update CHANGELOG.md with new version
 */
function updateChangelog(newVersion) {
  let changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');

  // Find the first version header
  const versionHeaderPattern = /^## Version /m;
  const match = changelog.match(versionHeaderPattern);

  if (!match) {
    console.warn('⚠️  Could not find version header in CHANGELOG.md');
    console.warn('   Please add changelog entry manually.');
    return;
  }

  // Insert new version header before the first existing version
  const insertPosition = match.index;
  const newHeader = `## Version ${newVersion}\n\n### Changes\n- TBD\n\n`;

  changelog = changelog.slice(0, insertPosition) + newHeader + changelog.slice(insertPosition);

  fs.writeFileSync(CHANGELOG_PATH, changelog, 'utf8');
  console.log(`✅ Added ${newVersion} to CHANGELOG.md`);
  console.log('   Please update the changelog with your changes!');
}

/**
 * Main function
 */
function main() {
  console.log('');
  console.log('📦 Bumping beta version...');
  console.log('');

  // Read current version
  const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG_PATH, 'utf8'));
  const currentVersion = rootPkg.version;

  console.log(`Current version: ${currentVersion}`);

  // Calculate new version
  const newVersion = incrementBetaVersion(currentVersion);

  console.log(`New version:     ${newVersion}`);
  console.log('');

  // Update root package.json
  rootPkg.version = newVersion;
  fs.writeFileSync(ROOT_PKG_PATH, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
  console.log('✅ Updated root package.json');

  // Run sync-versions.js to update all packages
  console.log('');
  console.log('🔄 Syncing versions across all packages...');
  console.log('');

  const { execSync } = require('child_process');
  execSync('node scripts/sync-versions.js', { stdio: 'inherit' });

  // Update CHANGELOG.md
  console.log('');
  updateChangelog(newVersion);

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Bumped to ${newVersion}`);
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Update CHANGELOG.md with your changes');
  console.log('  2. Commit the version bump: git add . && git commit -m "Bump version to ' + newVersion + '"');
  console.log('  3. Build and test: npm run build:release');
  console.log('  4. Tag and release: git tag v' + newVersion + ' && git push && git push --tags');
  console.log('');
}

// Run
main();
