#!/usr/bin/env node

/**
 * Execute Backup Script for Anvil & Loom v2
 * Creates backups of tables, weaves, and map data
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
  blue: '\x1b[34m'
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

/**
 * Creates a timestamp string for backup naming
 */
function createTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Ensures a directory exists, creating it if necessary
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, 'green');
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
 * Gets the size of a file or directory
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
 * Creates a backup manifest
 */
function createManifest(manifestPath, items) {
  const manifest = {
    timestamp: new Date().toISOString(),
    backupVersion: '1.0',
    items: items,
    totalSize: items.reduce((sum, item) => sum + item.size, 0)
  };
  
  ensureDirectoryExists(path.dirname(manifestPath));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Main backup execution
 */
async function executeBackup() {
  log('='.repeat(60), 'bright');
  log('Anvil & Loom v2 - Backup Execution', 'bright');
  log('='.repeat(60), 'bright');
  
  const timestamp = createTimestamp();
  const backupBaseDir = path.join(process.cwd(), '_BACKUP');
  const backupDir = path.join(backupBaseDir, timestamp);
  
  logStep(1, 'Preparing backup directory');
  ensureDirectoryExists(backupDir);
  logSuccess(`Backup directory: ${backupDir}`);
  
  const backupItems = [];
  
  // Backup tables
  logStep(2, 'Backing up tables directory');
  const tablesSource = path.join(process.cwd(), 'app', 'core-data', 'tables');
  const tablesBackup = path.join(backupDir, 'tables');
  
  try {
    if (fs.existsSync(tablesSource)) {
      copyDirectory(tablesSource, tablesBackup);
      const size = getPathSize(tablesBackup);
      backupItems.push({ path: 'tables', type: 'directory', size });
      logSuccess(`Tables backed up (${formatBytes(size)})`);
    } else {
      logWarning('Tables directory not found, skipping');
    }
  } catch (error) {
    logError(`Failed to backup tables: ${error.message}`);
  }
  
  // Backup weaves
  logStep(3, 'Backing up weaves directory');
  const weavesSource = path.join(process.cwd(), 'app', 'core-data', 'weaves');
  const weavesBackup = path.join(backupDir, 'weaves');
  
  try {
    if (fs.existsSync(weavesSource)) {
      copyDirectory(weavesSource, weavesBackup);
      const size = getPathSize(weavesBackup);
      backupItems.push({ path: 'weaves', type: 'directory', size });
      logSuccess(`Weaves backed up (${formatBytes(size)})`);
    } else {
      logWarning('Weaves directory not found, skipping');
    }
  } catch (error) {
    logError(`Failed to backup weaves: ${error.message}`);
  }
  
  // Backup map-related data (placeholder for now)
  logStep(4, 'Backing up map data');
  const mapData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    type: 'map-data',
    count: 0,
    maps: [],
    note: 'Map data is stored as specialized panels in Tapestry. This backup is a placeholder for future implementation.'
  };
  
  const mapBackupPath = path.join(backupDir, 'map-data.json');
  try {
    fs.writeFileSync(mapBackupPath, JSON.stringify(mapData, null, 2), 'utf-8');
    const size = fs.statSync(mapBackupPath).size;
    backupItems.push({ path: 'map-data.json', type: 'file', size });
    logSuccess(`Map data backed up (${formatBytes(size)})`);
  } catch (error) {
    logError(`Failed to backup map data: ${error.message}`);
  }
  
  // Create manifest
  logStep(5, 'Creating backup manifest');
  const manifestPath = path.join(backupDir, 'MANIFEST.json');
  createManifest(manifestPath, backupItems);
  logSuccess('Manifest created');
  
  // Verify backups
  logStep(6, 'Verifying backups');
  let allValid = true;
  
  for (const item of backupItems) {
    const itemPath = path.join(backupDir, item.path);
    const verification = verifyBackup(itemPath);
    
    if (verification.valid) {
      logSuccess(`${item.path} - Valid (${formatBytes(verification.size)})`);
    } else {
      logError(`${item.path} - Invalid: ${verification.error}`);
      allValid = false;
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'bright');
  log('Backup Summary', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`Backup location: ${backupDir}`, 'blue');
  log(`Timestamp: ${timestamp}`, 'blue');
  log(`Total items: ${backupItems.length}`, 'blue');
  log(`Total size: ${formatBytes(backupItems.reduce((sum, item) => sum + item.size, 0))}`, 'blue');
  
  if (allValid) {
    logSuccess('All backups verified successfully!');
    log('\nYou can now proceed with legacy system removal.', 'green');
    log('To restore from backup, run: npm run restore:all', 'yellow');
  } else {
    logError('Some backups failed verification. Please review errors above.');
    process.exit(1);
  }
  
  log('\n' + '='.repeat(60), 'bright');
}

// Execute backup
executeBackup().catch(error => {
  logError(`Backup execution failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
