const fs = require('fs');
const path = require('path');

// Function to get directory size recursively
function getDirectorySize(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
    return 0;
  }
}

// Function to format bytes to human readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to get file stats
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modified: stats.mtime
    };
  } catch (error) {
    console.error(`Error getting stats for ${filePath}:`, error.message);
    return null;
  }
}

// List of directories and files to analyze for cleanup
const cleanupTargets = [
  // Cache directories
  'node_modules',
  '.cache',
  '__pycache__',
  '.next',
  'dist',
  'build',
  'out',
  
  // Log directories
  'logs',
  
  // IDE specific directories
  '.idea',
  '.vscode',
  
  // Individual files
  '*.log',
  '*.tmp',
  '*.out',
  '*.err',
  '*.bak',
  '*.old',
  '*.backup',
  '*.copy',
  '~*',
  '*.swp',
  '*.swo'
];

// Directories to check
const directoriesToCheck = [
  '.',
  'backend',
  'frontend',
  'ml-service',
  'test-scripts'
];

// Results array
const results = [];

// Check each directory
directoriesToCheck.forEach(dir => {
  try {
    const fullPath = path.join(__dirname, dir);
    const files = fs.readdirSync(fullPath);
    
    files.forEach(file => {
      const filePath = path.join(fullPath, file);
      const stats = fs.statSync(filePath);
      
      // Check for directories that match our cleanup criteria
      if (stats.isDirectory()) {
        if (cleanupTargets.includes(file) || 
            file.endsWith('node_modules') || 
            file.endsWith('__pycache__') || 
            file.endsWith('.cache') || 
            file.endsWith('.next') || 
            file.endsWith('dist') || 
            file.endsWith('logs')) {
          
          const size = getDirectorySize(filePath);
          results.push({
            path: filePath,
            type: 'directory',
            size: formatBytes(size),
            sizeInBytes: size,
            modified: stats.mtime,
            justification: getJustification(file)
          });
        }
      } 
      // Check for files that match our cleanup criteria
      else if (stats.isFile()) {
        if (shouldCleanupFile(file)) {
          const fileStats = getFileStats(filePath);
          if (fileStats) {
            results.push({
              path: filePath,
              type: 'file',
              size: formatBytes(fileStats.size),
              sizeInBytes: fileStats.size,
              modified: fileStats.modified,
              justification: getJustification(file)
            });
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error checking directory ${dir}:`, error.message);
  }
});

// Function to determine if a file should be cleaned up
function shouldCleanupFile(fileName) {
  const cleanupExtensions = [
    '.log', '.tmp', '.out', '.err', '.bak', '.old', '.backup', '.copy'
  ];
  
  const cleanupPatterns = [
    '~', '.swp', '.swo'
  ];
  
  // Check extensions
  for (const ext of cleanupExtensions) {
    if (fileName.endsWith(ext)) return true;
  }
  
  // Check patterns
  for (const pattern of cleanupPatterns) {
    if (fileName.includes(pattern)) return true;
  }
  
  return false;
}

// Function to get justification for cleanup
function getJustification(name) {
  if (name.includes('node_modules')) return 'Dependency cache directory';
  if (name.includes('__pycache__') || name.includes('.cache')) return 'Python cache directory';
  if (name.includes('.next')) return 'Next.js build cache';
  if (name.includes('dist') || name.includes('build') || name.includes('out')) return 'Build artifacts';
  if (name.includes('logs')) return 'Log files directory';
  if (name.includes('.idea') || name.includes('.vscode')) return 'IDE cache directory';
  if (name.endsWith('.log')) return 'Log file';
  if (name.endsWith('.tmp') || name.includes('~') || name.endsWith('.swp') || name.endsWith('.swo')) return 'Temporary file';
  if (name.endsWith('.bak') || name.endsWith('.old') || name.endsWith('.backup') || name.endsWith('.copy')) return 'Backup file';
  return 'Unnecessary file/directory';
}

// Sort results by size (largest first)
results.sort((a, b) => b.sizeInBytes - a.sizeInBytes);

// Calculate total size
const totalSize = results.reduce((sum, item) => sum + item.sizeInBytes, 0);

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  totalItems: results.length,
  totalSize: formatBytes(totalSize),
  totalSizeInBytes: totalSize,
  items: results
};

// Write report to file
const reportPath = path.join(__dirname, 'cleanup_report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log(`Cleanup analysis complete. Found ${results.length} items for potential cleanup.`);
console.log(`Total space that could be freed: ${formatBytes(totalSize)}`);
console.log(`Detailed report saved to: ${reportPath}`);
console.log('\nTop 10 largest items:');
results.slice(0, 10).forEach((item, index) => {
  console.log(`${index + 1}. ${item.path} - ${item.size} - ${item.justification}`);
});