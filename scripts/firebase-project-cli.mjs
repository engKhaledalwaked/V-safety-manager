import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = resolve(__dirname, '../firebase-project.config.json');

function readConfig() {
  const raw = readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!parsed.projectId || typeof parsed.projectId !== 'string') {
    throw new Error('firebase-project.config.json must contain a valid "projectId" string.');
  }

  return parsed;
}

function runFirebase(args) {
  const quotedArgs = args.map((arg) => {
    if (/\s/.test(arg) || arg.includes('"')) {
      return `"${arg.replaceAll('"', '\\"')}"`;
    }
    return arg;
  });

  const command = `firebase ${quotedArgs.join(' ')}`;
  const result = spawnSync(command, [], {
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

function printHelp() {
  console.log('Usage: node scripts/firebase-project-cli.mjs <command> [...firebaseArgs]');
  console.log('Commands:');
  console.log('  use              -> firebase use <projectId from config>');
  console.log('  deploy           -> firebase deploy --project <projectId>');
  console.log('  deploy:hosting   -> firebase deploy --only hosting --project <projectId>');
  console.log('  status           -> prints current firebase target and active project');
}

const command = process.argv[2];
const extraArgs = process.argv.slice(3);
const { projectId } = readConfig();

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'use') {
  runFirebase(['use', projectId, ...extraArgs]);
}

if (command === 'deploy') {
  runFirebase(['deploy', '--project', projectId, ...extraArgs]);
}

if (command === 'deploy:hosting') {
  runFirebase(['deploy', '--only', 'hosting', '--project', projectId, ...extraArgs]);
}

if (command === 'status') {
  console.log(`[firebase-project-cli] Config projectId: ${projectId}`);
  runFirebase(['use', ...extraArgs]);
}

console.error(`Unknown command: ${command}`);
printHelp();
process.exit(1);