import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for (const file of readdirSync(new URL('./src/', import.meta.url)).filter(name => name.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', fileURLToPath(new URL('./src/' + file, import.meta.url))], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
