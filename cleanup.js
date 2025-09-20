const fs = require('fs');
const path = require('path');

// Function to safely delete a file or directory
function safeDelete(filePath) {
  try {
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Recursively delete directory contents
      const files = fs.readdirSync(filePath);
      for (const file of files) {
        safeDelete(path.join(filePath, file));
      }
      // Delete the directory itself
      fs.rmdirSync(filePath);
      console.log(`Deleted directory: ${filePath}`);
    } else {
      // Delete file
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting ${filePath}:`, error.message);
    return false;
  }
}

// List of items to clean up (from our analysis)
const cleanupItems = [
  "C:\\\\Users\\\\Jônatas Felipe\\\\Desktop\\\\NeuraMaint\\\\frontend\\\\node_modules",
  "C:\\\\Users\\\\Jônatas Felipe\\\\Desktop\\\\NeuraMaint\\\\backend\\\\node_modules",
  "C:\\\\Users\\\\Jônatas Felipe\\\\Desktop\\\\NeuraMaint\\\\node_modules",
  "C:\\\\Users\\\\Jônatas Felipe\\\\Desktop\\\\NeuraMaint\\\\frontend\\\\.next",
  "C:\\\\Users\\\\Jônatas Felipe\\\\Desktop\\\\NeuraMaint\\\\backend\\\\dist",
  "C:\\\\Users\\\\Jônatas Felipe\\\\Desktop\\\\NeuraMaint\\\\backend\\\\logs",
  "C:\\\\Users\\\\Jônatas Felipe\\\\Desktop\\\\NeuraMaint\\\\ml-service\\\\__pycache__"
];

// Function to perform cleanup
function performCleanup() {
  const logFilePath = path.join(__dirname, 'cleanup_log.txt');
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  
  logStream.write(`Cleanup started at ${new Date().toISOString()}\n`);
  logStream.write('=========================================\n');
  
  let totalFreedSpace = 0;
  let successCount = 0;
  let errorCount = 0;
  
  console.log('Starting cleanup process...');
  logStream.write('Starting cleanup process...\n');
  
  for (const item of cleanupItems) {
    try {
      const stats = fs.statSync(item);
      const size = stats.isDirectory() ? getDirectorySize(item) : stats.size;
      
      if (safeDelete(item)) {
        successCount++;
        totalFreedSpace += size;
        const message = `Successfully deleted: ${item} (${formatBytes(size)})\n`;
        console.log(message.trim());
        logStream.write(message);
      } else {
        errorCount++;
        const message = `Failed to delete: ${item}\n`;
        console.log(message.trim());
        logStream.write(message);
      }
    } catch (error) {
      errorCount++;
      const message = `Error accessing ${item}: ${error.message}\n`;
      console.log(message.trim());
      logStream.write(message);
    }
  }
  
  const summary = `
Cleanup completed at ${new Date().toISOString()}
=========================================
Total items processed: ${cleanupItems.length}
Successfully deleted: ${successCount}
Errors: ${errorCount}
Total space freed: ${formatBytes(totalFreedSpace)}
`;
  
  console.log(summary);
  logStream.write(summary);
  logStream.end();
  
  return {
    totalItems: cleanupItems.length,
    successCount,
    errorCount,
    totalFreedSpace
  };
}

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

// Only run if explicitly called with 'node cleanup.js --execute'
if (process.argv.includes('--execute')) {
  console.log('=== SISTEMA DE LIMPEZA AUTOMATIZADA ===');
  console.log('ATENÇÃO: Esta operação irá excluir permanentemente os arquivos listados.');
  console.log('Por favor, verifique o relatório cleanup_report.md antes de prosseguir.');
  console.log('');
  
  // Ask for confirmation (in a real script, you would use readline for this)
  console.log('Para executar a limpeza, execute este script com o comando:');
  console.log('node cleanup.js --execute --confirm');
} else if (process.argv.includes('--confirm')) {
  console.log('Iniciando processo de limpeza...');
  const results = performCleanup();
  console.log(`\nProcesso concluído! Espaço total liberado: ${formatBytes(results.totalFreedSpace)}`);
} else {
  console.log('Este script identificou arquivos e diretórios para limpeza.');
  console.log('Por favor, revise o relatório em cleanup_report.md');
  console.log('');
  console.log('Para executar a limpeza, use o comando:');
  console.log('node cleanup.js --execute --confirm');
}