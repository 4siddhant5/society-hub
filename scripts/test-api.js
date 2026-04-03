const { spawn } = require('child_process');

const startBackend = (port) => {
  const proc = spawn('node', ['backend/src/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
  });

  proc.stdout.on('data', (d) => process.stdout.write(d));
  proc.stderr.on('data', (d) => process.stderr.write(d));

  proc.on('error', (err) => {
    console.error('Backend process error:', err);
  });

  return proc;
};

const waitForHealth = async (url, timeoutMs = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch (e) {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timeout waiting for ${url}`);
};

const runTest = (cmd, args, env = {}) => {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: 'inherit',
      shell: false,
    });
    p.on('close', (code) => {
      if (code === 0) resolve(code);
      else reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`));
    });
    p.on('error', reject);
  });
};

(async () => {
  const TEST_PORT = process.env.TEST_PORT ? Number(process.env.TEST_PORT) : 4001;
  const API_URL = `http://localhost:${TEST_PORT}`;

  const backend = startBackend(TEST_PORT);
  let crashed = false;
  backend.on('error', (e) => {
    console.error('Backend process error:', e);
    crashed = true;
  });

  try {
    await waitForHealth(`${API_URL}/health`, 20000);
    await runTest('node', ['tests/api/auth.test.js'], { API_URL });
    await runTest('node', ['tests/api/notices.test.js'], { API_URL });
    console.log('All tests passed');
    process.exitCode = 0;
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (backend && !backend.killed) {
      backend.kill('SIGTERM');
      await new Promise((resolve) => backend.once('exit', resolve));
    }
  }
})();
