/**
 * Build both apps for the single-container deployment.
 *
 * This is a script rather than a shell one-liner in package.json for two
 * reasons, both learned the hard way:
 *
 *  - `VAR=value cmd` is not valid syntax in cmd.exe, so an inline env var
 *    silently fails on Windows;
 *  - Git Bash rewrites a bare `/admin` argument into a Windows path
 *    (`C:/Program Files/Git/admin`) before the process ever sees it, which
 *    produced a build with a nonsense base path that 404'd every route.
 *
 * Setting the variable from inside Node sidesteps both.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Normalised in svelte.config.js too; kept without a leading slash here so no
// shell on any platform is tempted to treat it as a path.
const ADMIN_BASE_PATH = process.env.ADMIN_BASE_PATH ?? 'admin';

function run(label, args, env) {
	console.log(`\n[build] ${label}`);
	const res = spawnSync('npm', args, {
		cwd: root,
		stdio: 'inherit',
		env: { ...process.env, ...env },
		// npm is a shell script on Windows; without a shell, spawn can't find it.
		shell: process.platform === 'win32'
	});
	if (res.status !== 0) {
		console.error(`[build] ${label} failed (exit ${res.status})`);
		process.exit(res.status ?? 1);
	}
}

run('portfolio', ['run', 'build', '--workspace=apps/portfolio'], { ADMIN_BASE_PATH: '' });
run('admin', ['run', 'build', '--workspace=apps/admin'], { ADMIN_BASE_PATH });

console.log(`\n[build] done — admin mounted at /${ADMIN_BASE_PATH.replace(/^\/+/, '')}`);
