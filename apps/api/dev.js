const { spawn, execSync } = require('node:child_process');

console.log('Building initial TypeScript build...');
try {
  execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });
} catch (err) {
  console.error('Initial build encountered errors, proceeding to watch mode...');
}

console.log('Starting tsc watch and NestJS server in watch mode...');

const tsc = spawn('npx', ['tsc', '-p', 'tsconfig.build.json', '-w', '--preserveWatchOutput'], {
  stdio: 'inherit',
});

const server = spawn(process.execPath, ['--watch', '--watch-path=dist', 'dist/main.js'], {
  stdio: 'inherit',
});

function cleanup() {
  try { tsc.kill(); } catch (_) {}
  try { server.kill(); } catch (_) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

tsc.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`tsc exited with code ${code}`);
  }
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`server exited with code ${code}`);
  }
});
