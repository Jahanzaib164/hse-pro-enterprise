#!/usr/bin/env node
/**
 * HSE Pro Enterprise — Self-contained Launcher
 * Just needs Node.js 18+. No Docker, no PostgreSQL install required.
 * Runs embedded PostgreSQL + backend + frontend, then opens browser.
 */

const { default: EmbeddedPostgres } = require('embedded-postgres');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(os.homedir(), '.hse-pro-enterprise', 'pgdata');
const LOG_DIR = path.join(os.homedir(), '.hse-pro-enterprise', 'logs');
const PG_PORT = 5433;
const API_PORT = 3001;
const APP_PORT = 3000;
const DB_NAME = 'hse_pro';
const DB_USER = 'hse_user';
const DB_PASS = 'hse_secure_pass';

const GREEN = '\x1b[32m';
const CYAN  = '\x1b[36m';
const YELLOW= '\x1b[33m';
const RED   = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

function log(msg)   { console.log(`${CYAN}[HSE Pro]${RESET} ${msg}`); }
function ok(msg)    { console.log(`${GREEN}[HSE Pro]${RESET} ✓ ${msg}`); }
function warn(msg)  { console.log(`${YELLOW}[HSE Pro]${RESET} ⚠ ${msg}`); }
function err(msg)   { console.log(`${RED}[HSE Pro]${RESET} ✗ ${msg}`); }

function banner() {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗
║          HSE PRO ENTERPRISE — STARTING UP            ║
║    Health, Safety & Environment Management System    ║
╚══════════════════════════════════════════════════════╝${RESET}\n`);
}

function checkNode() {
  const v = process.version;
  const major = parseInt(v.slice(1).split('.')[0]);
  if (major < 18) {
    err(`Node.js 18+ required. You have ${v}. Download from https://nodejs.org`);
    process.exit(1);
  }
  ok(`Node.js ${v}`);
}

function ensureDirs() {
  [DATA_DIR, LOG_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
}

async function installDeps(dir, name) {
  const nm = path.join(dir, 'node_modules');
  if (!fs.existsSync(nm)) {
    log(`Installing ${name} dependencies (first run, may take a minute)...`);
    execSync('npm install --production --prefer-offline', { cwd: dir, stdio: 'inherit' });
    ok(`${name} dependencies installed`);
  }
}

async function startPostgres() {
  log('Starting embedded PostgreSQL...');
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: DB_USER,
    password: DB_PASS,
    port: PG_PORT,
    persistent: true,
  });

  const isNew = !fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));

  await pg.initialise();
  await pg.start();
  ok(`PostgreSQL started on port ${PG_PORT}`);

  // Create DB if needed
  const client = pg.getPgClient();
  await client.connect();

  const { rows } = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
  );

  if (rows.length === 0) {
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    ok(`Database '${DB_NAME}' created`);
  }
  await client.end();

  if (isNew) {
    log('Loading database schema and seed data (first run)...');
    const { Client } = require('pg');
    const dbClient = new Client({
      host: 'localhost', port: PG_PORT,
      database: DB_NAME, user: DB_USER, password: DB_PASS,
    });
    await dbClient.connect();

    const schemaSQL = fs.readFileSync(path.join(ROOT, 'database', 'schema.sql'), 'utf8');
    const seedSQL   = fs.readFileSync(path.join(ROOT, 'database', 'seed.sql'), 'utf8');

    await dbClient.query(schemaSQL);
    ok('Schema loaded');
    await dbClient.query(seedSQL);
    ok('Seed data loaded');
    await dbClient.end();
  }

  return pg;
}

function writeBackendEnv() {
  const envPath = path.join(ROOT, 'backend', '.env');
  const crypto = require('crypto');

  // Only write if JWT secrets are placeholder
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  if (existing.includes('CHANGE_ME') || !existing.includes('JWT_SECRET=')) {
    const jwt1 = crypto.randomBytes(64).toString('hex');
    const jwt2 = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(envPath, `NODE_ENV=production
PORT=${API_PORT}
FRONTEND_URL=http://localhost:${APP_PORT}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:${PG_PORT}/${DB_NAME}
JWT_SECRET=${jwt1}
JWT_REFRESH_SECRET=${jwt2}
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
REDIS_URL=
SYSTEM_OWNER_EMAIL=admin@hse-pro.com
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
S3_ENDPOINT=
S3_BUCKET=hse-pro-files
S3_ACCESS_KEY=
S3_SECRET_KEY=
`);
    ok('Backend environment configured');
  } else {
    // Patch DB URL and port for embedded PG
    let env = existing;
    env = env.replace(/DATABASE_URL=.*/,
      `DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:${PG_PORT}/${DB_NAME}`);
    env = env.replace(/^PORT=.*/m, `PORT=${API_PORT}`);
    fs.writeFileSync(envPath, env);
  }
}

function writeFrontendEnv() {
  const envPath = path.join(ROOT, 'frontend', '.env.local');
  fs.writeFileSync(envPath,
`NEXT_PUBLIC_API_URL=http://localhost:${API_PORT}/api
NEXT_PUBLIC_WS_URL=ws://localhost:${API_PORT}
`);
}

function startProcess(cmd, args, cwd, name, color) {
  const proc = spawn(cmd, args, {
    cwd,
    env: { ...process.env },
    shell: true,
  });

  proc.stdout.on('data', (d) => {
    const lines = d.toString().trim().split('\n');
    lines.forEach(l => l && console.log(`${color}[${name}]${RESET} ${l}`));
  });
  proc.stderr.on('data', (d) => {
    const lines = d.toString().trim().split('\n');
    lines.forEach(l => l && console.log(`${YELLOW}[${name}]${RESET} ${l}`));
  });
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      err(`${name} exited with code ${code}`);
    }
  });

  return proc;
}

function waitForPort(port, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const req = http.request({ host: 'localhost', port, path: '/' }, () => resolve());
      req.on('error', () => {
        if (Date.now() - start > timeout) reject(new Error(`Port ${port} not ready after ${timeout}ms`));
        else setTimeout(check, 1000);
      });
      req.end();
    }
    check();
  });
}

function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  if (platform === 'darwin')      cmd = `open "${url}"`;
  else if (platform === 'win32')  cmd = `start "" "${url}"`;
  else                            cmd = `xdg-open "${url}"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch {
    log(`Open your browser at: ${BOLD}${url}${RESET}`);
  }
}

const procs = [];
async function main() {
  banner();
  checkNode();
  ensureDirs();

  // Install dependencies
  await installDeps(path.join(ROOT, 'launcher'), 'Launcher');
  await installDeps(path.join(ROOT, 'backend'), 'Backend');
  await installDeps(path.join(ROOT, 'frontend'), 'Frontend');

  // Start embedded PostgreSQL
  const pg = await startPostgres();

  // Write env files
  writeBackendEnv();
  writeFrontendEnv();

  // Build backend if needed
  const distDir = path.join(ROOT, 'backend', 'dist');
  if (!fs.existsSync(distDir)) {
    log('Building backend (first run)...');
    execSync('npm run build', { cwd: path.join(ROOT, 'backend'), stdio: 'inherit' });
    ok('Backend built');
  }

  // Start backend
  log('Starting backend API...');
  const backendProc = startProcess(
    'node', ['dist/index.js'],
    path.join(ROOT, 'backend'),
    'API', '\x1b[35m'
  );
  procs.push(backendProc);

  // Start frontend
  log('Starting frontend...');
  const frontendProc = startProcess(
    'npm', ['run', 'dev', '--', '-p', String(APP_PORT)],
    path.join(ROOT, 'frontend'),
    'UI', '\x1b[34m'
  );
  procs.push(frontendProc);

  // Wait for frontend to be ready
  log(`Waiting for app to be ready...`);
  try {
    await waitForPort(APP_PORT, 120000);
  } catch {
    warn('App taking longer than expected to start...');
  }

  const url = `http://localhost:${APP_PORT}`;
  console.log(`
${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗
║               HSE PRO ENTERPRISE IS READY!           ║
╠══════════════════════════════════════════════════════╣
║  🌐  Open:     http://localhost:${APP_PORT}               ║
║  📧  Email:    admin@hse-pro.com                      ║
║  🔑  Password: Password123!                           ║
╠══════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop                                 ║
╚══════════════════════════════════════════════════════╝${RESET}
`);

  openBrowser(url);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n${YELLOW}[HSE Pro]${RESET} Shutting down...`);
    procs.forEach(p => p.kill());
    await pg.stop();
    ok('All services stopped. Goodbye!');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    procs.forEach(p => p.kill());
    await pg.stop();
    process.exit(0);
  });
}

main().catch(e => {
  err(`Fatal error: ${e.message}`);
  console.error(e);
  process.exit(1);
});
