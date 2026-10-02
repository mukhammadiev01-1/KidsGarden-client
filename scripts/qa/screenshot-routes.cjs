// Drive one headless Chrome over the DevTools protocol and take a full-page
// screenshot of each route, as desktop or as a phone (user agent + metrics),
// so two builds can be compared pixel for pixel (see compare-screenshots.cjs).
//
//   node scripts/qa/screenshot-routes.cjs <outDir> <desktop|mobile> <token|-> name=/path ...
//
// BASE_URL defaults to http://localhost:3100 (a `next start -p 3100`).
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const [, , outDir, mode, token, ...routes] = process.argv;
const mobile = mode === 'mobile';
const W = mobile ? 390 : 1440;
const H = mobile ? 844 : 900;
const UA = mobile
	? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
	: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (url) =>
	new Promise((res, rej) =>
		http
			.get(url, (r) => {
				let b = '';
				r.on('data', (d) => (b += d));
				r.on('end', () => {
					try {
						res(JSON.parse(b));
					} catch (e) {
						rej(e);
					}
				});
			})
			.on('error', rej),
	);

(async () => {
	const port = 9333 + Math.floor(Math.random() * 100);
	const profile = fs.mkdtempSync(path.join(require('os').tmpdir(), 'kg-cdp-profile-'));
	const chrome = spawn(
		CHROME,
		['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--window-size=${W},${H}`, `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank'],
		{ stdio: 'ignore' },
	);
	let targets;
	for (let i = 0; i < 50; i++) {
		try {
			targets = await getJSON(`http://127.0.0.1:${port}/json`);
			break;
		} catch {
			await sleep(200);
		}
	}
	const page = targets.find((t) => t.type === 'page');
	const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
	await new Promise((r) => ws.on('open', r));
	let id = 0;
	const pending = new Map();
	const consoleLines = [];
	ws.on('message', (raw) => {
		const m = JSON.parse(raw);
		if (m.id && pending.has(m.id)) {
			pending.get(m.id)(m);
			pending.delete(m.id);
		} else if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
			consoleLines.push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300)}`);
		} else if (m.method === 'Runtime.exceptionThrown') {
			consoleLines.push(`exception: ${(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300)}`);
		}
	});
	const send = (method, params = {}) =>
		new Promise((r) => {
			const i = ++id;
			pending.set(i, r);
			ws.send(JSON.stringify({ id: i, method, params }));
		});
	await send('Page.enable');
	await send('Runtime.enable');
	await send('Emulation.setUserAgentOverride', { userAgent: UA });
	await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile });
	if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });

	// Seed the auth token on the app origin before the first real route.
	await send('Page.navigate', { url: BASE + '/favicon.ico' });
	await sleep(600);
	await send('Runtime.evaluate', {
		expression: token && token !== '-' ? `localStorage.setItem('accessToken', ${JSON.stringify(token)})` : `localStorage.removeItem('accessToken')`,
	});

	const report = [];
	for (const spec of routes) {
		const eq = spec.indexOf('=');
		const name = spec.slice(0, eq);
		const route = spec.slice(eq + 1);
		consoleLines.length = 0;
		await send('Page.navigate', { url: BASE + route });
		let lastLen = -1;
		for (let i = 0; i < 24; i++) {
			await sleep(500);
			const r = await send('Runtime.evaluate', { expression: 'document.body.innerHTML.length', returnByValue: true });
			const len = r.result.result.value;
			if (len === lastLen && i > 5) break;
			lastLen = len;
		}
		// Freeze animations/transitions and take the whole document.
		await send('Runtime.evaluate', {
			expression: `(() => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'; document.head.appendChild(s); window.scrollTo(0,0); return 1; })()`,
		});
		await sleep(800);
		// The phone layout scrolls inside #mobile-wrap rather than the document,
		// so measure the tallest scroll container and grow the viewport to it.
		const dims = await send('Runtime.evaluate', {
			returnByValue: true,
			expression: `(() => {
				let h = document.documentElement.scrollHeight;
				for (const el of document.querySelectorAll('body, body *')) {
					const cs = getComputedStyle(el);
					if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 8 && el.clientWidth >= window.innerWidth * 0.9) {
						h = Math.max(h, el.scrollHeight + el.getBoundingClientRect().top + window.scrollY);
					}
				}
				return { w: document.documentElement.scrollWidth, h: Math.min(Math.ceil(h), 12000), url: location.pathname };
			})()`,
		});
		const { w, h, url } = dims.result.result.value;
		if (h > H) {
			await send('Emulation.setDeviceMetricsOverride', { width: W, height: h, deviceScaleFactor: 1, mobile });
			await sleep(400);
		}
		const shot = await send('Page.captureScreenshot', {
			format: 'png',
			captureBeyondViewport: true,
			clip: { x: 0, y: 0, width: W, height: h, scale: 1 },
		});
		if (h > H) await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile });
		fs.writeFileSync(path.join(outDir, name + '.png'), Buffer.from(shot.result.data, 'base64'));
		report.push({ name, route, landedOn: url, scrollWidth: w, height: h, console: [...new Set(consoleLines)].slice(0, 6) });
		console.log(`${name}: ${url} ${w}x${h} console=${consoleLines.length}`);
	}
	fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
	ws.close();
	chrome.kill();
	fs.rmSync(profile, { recursive: true, force: true });
})().catch((e) => {
	console.error('harness error', e);
	process.exit(1);
});
