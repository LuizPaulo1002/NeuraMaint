// Logging functionality test script
// Run with: node test-logging.cjs

const fs = require('fs');
const path = require('path');

async function testLogging() {
  console.log('📝 Starting Logging Functionality Tests\n');

  try {
    // Test 1: Check if log directory exists
    console.log('1️⃣ Checking log directory...');
    
    const logDir = path.join(__dirname, 'logs');
    
    if (fs.existsSync(logDir)) {
      console.log('✅ Log directory found');
      
      // List log files
      const logFiles = fs.readdirSync(logDir);
      console.log('   Log files found:', logFiles.length);
      
      if (logFiles.length > 0) {
        console.log('   Sample log files:');
        logFiles.slice(0, 3).forEach(file => {
          console.log(`     - ${file}`);
        });
      }
      console.log();
    } else {
      console.log('❌ Log directory not found');
      console.log();
    }

    // Test 2: Check if log files are being written
    console.log('2️⃣ Checking log file writing...');
    
    // Try to read the most recent log file
    if (fs.existsSync(logDir)) {
      const logFiles = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .sort();
      
      if (logFiles.length > 0) {
        const latestLogFile = logFiles[logFiles.length - 1];
        const logFilePath = path.join(logDir, latestLogFile);
        
        try {
          const logContent = fs.readFileSync(logFilePath, 'utf8');
          const lines = logContent.split('\n').filter(line => line.trim() !== '');
          
          console.log('✅ Log file reading successful');
          console.log('   File:', latestLogFile);
          console.log('   Lines:', lines.length);
          
          if (lines.length > 0) {
            console.log('   Last 3 log entries:');
            lines.slice(-3).forEach(line => {
              console.log(`     - ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
            });
          }
          console.log();
        } catch (error) {
          console.log('❌ Failed to read log file');
          console.log('   Error:', error.message);
          console.log();
        }
      } else {
        console.log('⚠️  No log files found in directory');
        console.log();
      }
    }

    // Test 3: Check for critical activity logs
    console.log('3️⃣ Checking critical activity logs...');
    
    // Look for login events
    if (fs.existsSync(logDir)) {
      const logFiles = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .sort();
      
      let loginEventsFound = false;
      let alertEventsFound = false;
      
      for (const logFile of logFiles) {
        const logFilePath = path.join(logDir, logFile);
        try {
          const logContent = fs.readFileSync(logFilePath, 'utf8');
          
          if (logContent.includes('login') || logContent.includes('Login')) {
            loginEventsFound = true;
          }
          
          if (logContent.includes('alert') || logContent.includes('Alert')) {
            alertEventsFound = true;
          }
          
          if (loginEventsFound && alertEventsFound) {
            break;
          }
        } catch (error) {
          // Continue to next file
        }
      }
      
      if (loginEventsFound) {
        console.log('✅ Login events found in logs');
      } else {
        console.log('⚠️  No login events found in logs');
      }
      
      if (alertEventsFound) {
        console.log('✅ Alert events found in logs');
      } else {
        console.log('⚠️  No alert events found in logs');
      }
      console.log();
    }

    // Test 4: Check log rotation
    console.log('4️⃣ Checking log rotation...');
    
    if (fs.existsSync(logDir)) {
      const logFiles = fs.readdirSync(logDir);
      const rotatedLogs = logFiles.filter(file => 
        file.includes('.log.') || file.match(/\.\d{4}-\d{2}-\d{2}/)
      );
      
      if (rotatedLogs.length > 0) {
        console.log('✅ Log rotation is working');
        console.log('   Rotated logs found:', rotatedLogs.length);
        console.log('   Sample rotated logs:');
        rotatedLogs.slice(0, 3).forEach(file => {
          console.log(`     - ${file}`);
        });
      } else {
        console.log('⚠️  No rotated logs found (may be normal if system is new)');
      }
      console.log();
    }

    // Test 5: Check log format
    console.log('5️⃣ Checking log format...');
    
    if (fs.existsSync(logDir)) {
      const logFiles = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .sort();
      
      if (logFiles.length > 0) {
        const latestLogFile = logFiles[logFiles.length - 1];
        const logFilePath = path.join(logDir, latestLogFile);
        
        try {
          const logContent = fs.readFileSync(logFilePath, 'utf8');
          const lines = logContent.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length > 0) {
            const firstLine = lines[0];
            
            // Check for common log format elements
            const hasTimestamp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(firstLine);
            const hasLevel = /(INFO|ERROR|WARN|DEBUG)/.test(firstLine);
            const hasMessage = firstLine.length > 20;
            
            if (hasTimestamp && hasLevel && hasMessage) {
              console.log('✅ Log format appears correct');
              console.log('   Sample log entry:');
              console.log(`     ${firstLine.substring(0, 100)}${firstLine.length > 100 ? '...' : ''}`);
            } else {
              console.log('⚠️  Log format may not be standard');
              console.log('   Sample log entry:');
              console.log(`     ${firstLine.substring(0, 100)}${firstLine.length > 100 ? '...' : ''}`);
            }
          }
          console.log();
        } catch (error) {
          console.log('❌ Failed to check log format');
          console.log('   Error:', error.message);
          console.log();
        }
      }
    }

    // Test 6: Check error logs
    console.log('6️⃣ Checking error logs...');
    
    if (fs.existsSync(logDir)) {
      const logFiles = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .sort();
      
      let errorLogsFound = false;
      
      for (const logFile of logFiles) {
        const logFilePath = path.join(logDir, logFile);
        try {
          const logContent = fs.readFileSync(logFilePath, 'utf8');
          
          if (logContent.includes('ERROR') || logContent.includes('Error')) {
            errorLogsFound = true;
            break;
          }
        } catch (error) {
          // Continue to next file
        }
      }
      
      if (errorLogsFound) {
        console.log('✅ Error logs are being recorded');
      } else {
        console.log('✅ No error logs found (system appears healthy)');
      }
      console.log();
    }

    console.log('📝 Logging Functionality tests completed!');

  } catch (error) {
    console.error('❌ Logging test error:', error.message);
  }
}

// Run logging tests
testLogging();