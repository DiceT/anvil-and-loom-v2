#!/usr/bin/env node

/**
 * Restore Backups Script for Anvil & Loom v2
 * Restores data from backups to original locations
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
 * Reads backup manifest
 */
function readManifest(manifestPath) {
  try {
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logError(`Failed to read manifest: ${error.message}`);
    return null;
  }
}

/**
 * Verifies a backup exists and is valid
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
 * Ensures a directory exists, creating it if necessary
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copies a file from source to destination
 */
function copyFile(sourcePath, destPath) {
  ensureDirectoryExists(path.dirname(destPath));
  fs.copyFileSync(sourcePath, destPath);
}

/**
 * Recursively copies a directory from source to destination
 */
function copyDirectory(sourcePath, destPath) {
  ensureDirectoryExists(destPath);
  
  const entries = fs.readdirSync(sourcePath, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(sourcePath, entry.name);
    const destEntryPath = path.join(destPath, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destEntryPath);
    } else {
      copyFile(srcPath, destEntryPath);
    }
  }
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
 * Restores a single backup item
 */
function restoreBackupItem(backupDir, item, targetBaseDir) {
  const sourcePath = path.join(backupDir, item.path);
  const targetPath = path.join(targetBaseDir, item.path);
  
  // Verify source exists
  const verification = verifyBackup(sourcePath);
  if (!verification.valid) {
    logError(`Cannot restore ${item.path}: ${verification.error}`);
    return false;
  }
  
  // Remove existing target if it exists
  if (fs.existsSync(targetPath)) {
    logInfo(`Removing existing ${item.path}...`);
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  
  // Copy from backup
  logInfo(`Restoring ${item.path}...`);
  
  if (item.type === 'directory') {
    copyDirectory(sourcePath, targetPath);
  } else {
    copyFile(sourcePath, targetPath);
  }
  
  // Verify restoration
  const restoredVerification = verifyBackup(targetPath);
  if (restoredVerification.valid) {
    logSuccess(`${item.path} restored (${formatBytes(restoredVerification.size)})`);
    return true;
  } else {
    logError(`${item.path} restoration failed: ${restoredVerification.error}`);
    return false;
  }
}

/**
 * Main restore function
 */
async function restoreBackups() {
  log('='.repeat(60), 'bright');
  log('Anvil & Loom v2 - Backup Restoration', 'bright');
  log('='.repeat(60), 'bright');
  
  const backupBaseDir = path.join(process.cwd(), '_BACKUP');
  
  // Check if backup directory exists
  logStep(1, 'Checking backup directory');
  if (!fs.existsSync(backupBaseDir)) {
    logError('Backup directory does not exist');
    logInfo(`Expected location: ${backupBaseDir}`);
    process.exit(1);
  }
  logSuccess(`Backup directory found: ${backupBaseDir}`);
  
  // List available backups
  logStep(2, 'Listing available backups');
  const backupDirs = listBackupDirectories(backupBaseDir);
  
  if (backupDirs.length === 0) {
    logError('No backup directories found');
    process.exit(1);
  }
  
  logSuccess(`Found ${backupDirs.length} backup(s):`);
  backupDirs.forEach((dir, index) => {
    log(`  ${index + 1}. ${dir}`, 'cyan');
  });
  
  // Use most recent backup or specified backup
  const args = process.argv.slice(2);
  let selectedBackup = backupDirs[0]; // Default to latest
  
  if (args.length > 0) {
    const requestedBackup = args[0];
    if (backupDirs.includes(requestedBackup)) {
      selectedBackup = requestedBackup;
    } else {
      logError(`Backup "${requestedBackup}" not found`);
      logInfo('Available backups:');
      backupDirs.forEach((dir, index) => {
        log(`  ${index + 1}. ${dir}`, 'cyan');
      });
      process.exit(1);
    }
  }
  
  logStep(3, `Selected backup: ${selectedBackup}`);
  
  const backupPath = path.join(backupBaseDir, selectedBackup);
  const manifestPath = path.join(backupPath, 'MANIFEST.json');
  
  // Read manifest
  logStep(4, 'Reading backup manifest');
  const manifest = readManifest(manifestPath);
  
  if (!manifest) {
    logError('Failed to read backup manifest');
    process.exit(1);
  }
  
  logSuccess('Manifest loaded');
  logInfo(`Backup timestamp: ${manifest.timestamp}`);
  logInfo(`Backup version: ${manifest.version}`);
  logInfo(`Total items: ${manifest.items.length}`);
  logInfo(`Total size: ${formatBytes(manifest.totalSize)}`);
  
  // Confirmation prompt
  logStep(5, 'Restore confirmation');
  logWarning('This will overwrite existing data files!');
  logWarning('Please ensure you have a recent backup before proceeding.');
  log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow');
  
  // Simple countdown (non-blocking)
  await new Promise(resolve => {
    let count = 5;
    const interval = setInterval(() => {
      process.stdout.write(`\r${colors.yellow}${count}...${colors.reset} `);
      count--;
      if (count < 0) {
        clearInterval(interval);
        process.stdout.write('\r' + ' '.repeat(20) + '\r');
        resolve();
      }
    }, 1000);
  });
  
  log('\n');
  
  // Restore each item
  logStep(6, 'Restoring backup items');
  const targetBaseDir = path.join(process.cwd(), 'app', 'core-data');
  let allRestored = true;
  let totalRestoredSize = 0;
  
  for (const item of manifest.items) {
    const success = restoreBackupItem(backupPath, item, targetBaseDir);
    if (success) {
      totalRestoredSize += item.size;
    } else {
      allRestored = false;
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'bright');
  log('Restore Summary', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`Backup: ${selectedBackup}`, 'blue');
  log(`Location: ${backupPath}`, 'blue');
  log(`Restored size: ${formatBytes(totalRestoredSize)}`, 'blue');
  log(`Manifest size: ${formatBytes(manifest.totalSize)}`, 'blue');
  
  if (totalRestoredSize !== manifest.totalSize) {
    logWarning(`Size mismatch! Restored: ${formatBytes(totalRestoredSize)}, Manifest: ${formatBytes(manifest.totalSize)}`);
  }
  
  if (allRestored) {
    logSuccess('All backups restored successfully!');
    log('\nNext steps:', 'green');
    log('1. Restart the application: npm run dev', 'cyan');
    log('2. Verify all data is accessible', 'cyan');
    log('3. Test core functionality', 'cyan');
    log('\nFor verification procedures, see: _DEVELOPMENT/rollback-plan.md', 'yellow');
  } else {
    logError('Some backups failed to restore. Please review errors above.');
    process.exit(1);
  }
  
  log('\n' + '='.repeat(60), 'bright');
}

// Execute restore
restoreBackups().catch(error => {
  logError(`Restore failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
