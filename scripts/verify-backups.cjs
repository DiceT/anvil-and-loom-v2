#!/usr/bin/env node

/**
 * Verify Backups Script for Anvil & Loom v2
 * Verifies that all backups exist and are valid
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.bright}${colors.blue}[Step ${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);
}

/**
 * Formats bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Gets size of a file or directory
 */
function getPathSize(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.isDirectory()) {
    let totalSize = 0;
    const files = fs.readdirSync(filePath);
    for (const file of files) {
      totalSize += getPathSize(path.join(filePath, file));
    }
    return totalSize;
  }
  return stats.size;
}

/**
 * Verifies a backup exists and is not empty
 */
function verifyBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      return { valid: false, error: 'Path does not exist' };
    }
    
    const stats = fs.statSync(backupPath);
    
    if (stats.isDirectory()) {
      const entries = fs.readdirSync(backupPath);
      if (entries.length === 0) {
        return { valid: false, error: 'Directory is empty' };
      }
      
      // Check if directory has any files recursively and calculate actual size
      let hasFiles = false;
      let totalSize = 0;
      const checkRecursive = (dirPath) => {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const itemStats = fs.statSync(itemPath);
          if (itemStats.isDirectory()) {
            const subResult = checkRecursive(itemPath);
            hasFiles = hasFiles || subResult.hasFiles;
            totalSize += subResult.size;
          } else if (itemStats.isFile()) {
            hasFiles = true;
            totalSize += itemStats.size;
          }
        }
        return { hasFiles, size: totalSize };
      };
      const result = checkRecursive(backupPath);
      
      if (!result.hasFiles) {
        return { valid: false, error: 'Directory contains no files' };
      }
      
      return { valid: true, size: result.size };
    } else {
      if (stats.size === 0) {
        return { valid: false, error: 'File is empty' };
      }
    }
    
    return { valid: true, size: stats.size };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Verifies backup manifest
 */
function verifyManifest(manifestPath) {
  try {
    if (!fs.existsSync(manifestPath)) {
      return { valid: false, error: 'Manifest does not exist' };
    }
    
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);
    
    // Validate manifest structure
    if (!manifest.backupVersion || !manifest.timestamp || !manifest.items) {
      return { valid: false, error: 'Invalid manifest structure' };
    }
    
    // Validate items
    if (!Array.isArray(manifest.items)) {
      return { valid: false, error: 'Invalid items in manifest' };
    }
    
    return { valid: true, manifest };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Lists all backup directories
 */
function listBackupDirectories(backupBaseDir) {
  if (!fs.existsSync(backupBaseDir)) {
    return [];
  }
  
  const entries = fs.readdirSync(backupBaseDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
    .reverse(); // Newest first
}

/**
 * Main verification function
 */
async function verifyBackups() {
  log('='.repeat(60), 'bright');
  log('Anvil & Loom v2 - Backup Verification', 'bright');
  log('='.repeat(60), 'bright');
  
  const backupBaseDir = path.join(process.cwd(), '_BACKUP');
  
  // Check if backup directory exists
  logStep(1, 'Checking backup directory');
  if (!fs.existsSync(backupBaseDir)) {
    logError('Backup directory does not exist');
    logInfo(`Expected location: ${backupBaseDir}`);
    logInfo('Run "npm run backup:all" to create backups');
    process.exit(1);
  }
  logSuccess(`Backup directory found: ${backupBaseDir}`);
  
  // List available backups
  logStep(2, 'Listing available backups');
  const backupDirs = listBackupDirectories(backupBaseDir);
  
  if (backupDirs.length === 0) {
    logError('No backup directories found');
    logInfo('Run "npm run backup:all" to create backups');
    process.exit(1);
  }
  
  logSuccess(`Found ${backupDirs.length} backup(s):`);
  backupDirs.forEach((dir, index) => {
    log(`  ${index + 1}. ${dir}`, 'cyan');
  });
  
  // Use most recent backup
  const latestBackup = backupDirs[0];
  logStep(3, `Verifying latest backup: ${latestBackup}`);
  
  const backupPath = path.join(backupBaseDir, latestBackup);
  const manifestPath = path.join(backupPath, 'MANIFEST.json');
  
  // Verify manifest
  logStep(4, 'Verifying backup manifest');
  const manifestResult = verifyManifest(manifestPath);
  
  if (!manifestResult.valid) {
    logError(`Manifest verification failed: ${manifestResult.error}`);
    process.exit(1);
  }
  
  logSuccess('Manifest is valid');
  const manifest = manifestResult.manifest;
  logInfo(`Backup timestamp: ${manifest.timestamp}`);
  logInfo(`Backup version: ${manifest.backupVersion}`);
  logInfo(`Total items: ${manifest.items.length}`);
  logInfo(`Total size: ${formatBytes(manifest.totalSize)}`);
  
  // Verify each backup item
  logStep(5, 'Verifying backup items');
  let allValid = true;
  let totalVerifiedSize = 0;
  
  for (const item of manifest.items) {
    const itemPath = path.join(backupPath, item.path);
    const verification = verifyBackup(itemPath);
    
    if (verification.valid) {
      logSuccess(`${item.path} - Valid (${formatBytes(verification.size)})`);
      totalVerifiedSize += verification.size;
    } else {
      logError(`${item.path} - Invalid: ${verification.error}`);
      allValid = false;
    }
  }
  
  // Check for expected items
  logStep(6, 'Checking for expected backup items');
  const expectedItems = ['tables', 'weaves', 'map-data.json'];
  
  for (const expectedItem of expectedItems) {
    const itemPath = path.join(backupPath, expectedItem);
    const verification = verifyBackup(itemPath);
    
    if (verification.valid) {
      logSuccess(`${expectedItem} exists and is valid`);
    } else {
      logError(`${expectedItem} is missing or invalid: ${verification.error}`);
      allValid = false;
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'bright');
  log('Verification Summary', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`Backup: ${latestBackup}`, 'blue');
  log(`Location: ${backupPath}`, 'blue');
  log(`Verified size: ${formatBytes(totalVerifiedSize)}`, 'blue');
  log(`Manifest size: ${formatBytes(manifest.totalSize)}`, 'blue');
  
  if (totalVerifiedSize !== manifest.totalSize) {
    logWarning(`Size mismatch! Verified: ${formatBytes(totalVerifiedSize)}, Manifest: ${formatBytes(manifest.totalSize)}`);
  }
  
  if (allValid) {
    logSuccess('All backups verified successfully!');
    log('\nYou can proceed with legacy system removal.', 'green');
    log('To restore from backup, run: npm run restore:all', 'yellow');
  } else {
    logError('Some backups failed verification. Please review errors above.');
    logInfo('To create new backups, run: npm run backup:all');
    process.exit(1);
  }
  
  // Additional information
  log('\n' + '='.repeat(60), 'bright');
  log('Additional Information', 'bright');
  log('='.repeat(60), 'bright');
  
  logInfo(`Total backup directories: ${backupDirs.length}`);
  if (backupDirs.length > 1) {
    logInfo('To verify a different backup, manually specify the backup directory:');
    logInfo('  node scripts/verify-backups.cjs <backup-timestamp>');
  }
  
  logInfo('For detailed rollback procedures, see: _DEVELOPMENT/rollback-plan.md');
  
  log('\n' + '='.repeat(60), 'bright');
}

// Execute verification
verifyBackups().catch(error => {
  logError(`Verification failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
