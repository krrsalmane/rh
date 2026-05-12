// Clean start script - kills processes on port 3000 then starts server
const { exec } = require('child_process');
const { spawn } = require('child_process');

async function killPort3000() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Checking for processes on port 3000...');
    
    exec('netstat -ano | findstr :3000', (error, stdout, stderr) => {
      if (stdout) {
        const lines = stdout.split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const match = line.match(/\s+(\d+)$/);
          if (match) {
            pids.add(match[1]);
          }
        });
        
        if (pids.size > 0) {
          console.log(`🔪 Found ${pids.size} process(es) on port 3000, killing them...`);
          
          let killed = 0;
          pids.forEach(pid => {
            exec(`taskkill /F /PID ${pid}`, (killError) => {
              if (!killError) {
                killed++;
                console.log(`✅ Killed process ${pid}`);
              }
              
              if (killed === pids.size) {
                setTimeout(resolve, 1000); // Wait 1 second for processes to fully terminate
              }
            });
          });
        } else {
          console.log('✅ No processes found on port 3000');
          resolve();
        }
      } else {
        console.log('✅ No processes found on port 3000');
        resolve();
      }
    });
  });
}

async function startServer() {
  console.log('🚀 Starting backend server...');
  
  const server = spawn('node', ['-r', 'ts-node/register', 'src/server.ts'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
  
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

async function main() {
  try {
    await killPort3000();
    await startServer();
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

main();
