/**
 * Combined server — the public portfolio and the admin console in one process.
 *
 * Why this exists: Railway's free plan caps a project at three services, and
 * `victorious-renewal` already spends them on portfolio, api and Postgres. So
 * the console rides along on the portfolio's container, mounted at /admin,
 * rather than needing a service of its own.
 *
 * Both apps are built with @sveltejs/adapter-node, which exports a standard
 * `(req, res, next)` handler. Routing between them is a prefix test — the
 * admin build is compiled with ADMIN_BASE_PATH=/admin, so it already expects
 * to own that prefix and generates its own asset and route URLs beneath it.
 *
 *   npm run build:combined     builds both with the right base path
 *   node server/combined.js    runs this
 *
 * If the admin build is missing, the portfolio is still served and /admin
 * returns a clear 503 — one app failing to build must not take the public
 * site down with it.
 */

import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';
// Normalised the same way the admin build normalises it, so the mount point
// the server routes on and the base the client was compiled with cannot drift.
const ADMIN_BASE_RAW = (process.env.ADMIN_BASE_PATH ?? 'admin').trim();
const ADMIN_BASE = ADMIN_BASE_RAW ? `/${ADMIN_BASE_RAW.replace(/^\/+|\/+$/g, '')}` : '/admin';

/** Load a built adapter-node handler, or null if that app wasn't built. */
async function loadHandler(appDir, label) {
	const entry = join(root, 'apps', appDir, 'build', 'handler.js');
	if (!existsSync(entry)) {
		console.warn(`[combined] ${label} build not found at ${entry} — it will not be served.`);
		return null;
	}
	const mod = await import(`file://${entry}`);
	console.log(`[combined] ${label} handler loaded`);
	return mod.handler;
}

const portfolio = await loadHandler('portfolio', 'portfolio');
const admin = await loadHandler('admin', 'admin');

if (!portfolio) {
	// The public site is the reason this process exists. Without it there is
	// nothing to serve, and failing loudly at boot beats serving 404s.
	console.error('[combined] portfolio build missing — refusing to start.');
	process.exit(1);
}

function notFound(res) {
	res.statusCode = 404;
	res.setHeader('content-type', 'text/plain; charset=utf-8');
	res.end('Not found');
}

function adminUnavailable(res) {
	res.statusCode = 503;
	res.setHeader('content-type', 'text/plain; charset=utf-8');
	res.end('The admin console is not available on this deployment.');
}

const server = createServer((req, res) => {
	const url = req.url ?? '/';

	// Exactly the base, or anything beneath it. A bare `startsWith` would also
	// capture an unrelated route like /administration.
	const isAdmin = url === ADMIN_BASE || url.startsWith(`${ADMIN_BASE}/`) || url.startsWith(`${ADMIN_BASE}?`);

	if (isAdmin) {
		if (!admin) return adminUnavailable(res);
		// The admin handler expects to see the base in the URL — it was built
		// with it — so the path is passed through untouched.
		return admin(req, res, () => notFound(res));
	}

	return portfolio(req, res, () => notFound(res));
});

server.listen(PORT, HOST, () => {
	console.log(`[combined] listening on http://${HOST}:${PORT}`);
	console.log(`[combined] portfolio at /  ·  admin at ${ADMIN_BASE}${admin ? '' : ' (unavailable)'}`);
});

// Railway sends SIGTERM on redeploy; closing cleanly lets in-flight requests
// finish instead of being cut mid-response.
for (const signal of ['SIGTERM', 'SIGINT']) {
	process.on(signal, () => {
		console.log(`[combined] ${signal} — shutting down`);
		server.close(() => process.exit(0));
		// Don't hang forever on a stuck keep-alive connection.
		setTimeout(() => process.exit(0), 10_000).unref();
	});
}
