// Pixel-compare two screenshot folders produced by screenshot-routes.cjs.
//   node scripts/qa/compare-screenshots.cjs <beforeDir> <afterDir> [diffDir]
// Prints one line per image with the share of differing pixels; writes a red
// diff mask per changed image when diffDir is given. Exit code 1 if any image
// differs by more than DIFF_THRESHOLD (default 0.05 %).
const fs = require('fs');
const path = require('path');
let PNG;
try {
	({ PNG } = require('pngjs'));
} catch {
	({ PNG } = require(path.join(process.env.HOME, 'Desktop/KidsGarden-mobile/node_modules/pngjs')));
}

const [, , beforeDir, afterDir, diffDir] = process.argv;
const threshold = Number(process.env.DIFF_THRESHOLD || 0.05);
if (diffDir) fs.mkdirSync(diffDir, { recursive: true });
let failed = 0;
for (const file of fs.readdirSync(beforeDir).filter((f) => f.endsWith('.png')).sort()) {
	const afterPath = path.join(afterDir, file);
	if (!fs.existsSync(afterPath)) {
		console.log(`${file}: MISSING in after`);
		failed++;
		continue;
	}
	const a = PNG.sync.read(fs.readFileSync(path.join(beforeDir, file)));
	const b = PNG.sync.read(fs.readFileSync(afterPath));
	const w = Math.max(a.width, b.width);
	const h = Math.max(a.height, b.height);
	const out = diffDir ? new PNG({ width: w, height: h }) : null;
	let diff = 0;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const ia = (y * a.width + x) * 4;
			const ib = (y * b.width + x) * 4;
			const inA = x < a.width && y < a.height;
			const inB = x < b.width && y < b.height;
			let same = inA && inB;
			if (same) {
				for (let c = 0; c < 3; c++) if (Math.abs(a.data[ia + c] - b.data[ib + c]) > 8) same = false;
			}
			if (out) {
				const io = (y * w + x) * 4;
				const base = inA ? a.data[ia] : 255;
				out.data[io] = same ? base : 255;
				out.data[io + 1] = same ? base : 0;
				out.data[io + 2] = same ? base : 0;
				out.data[io + 3] = 255;
			}
			if (!same) diff++;
		}
	}
	const pct = (100 * diff) / (w * h);
	const sizeNote = a.width !== b.width || a.height !== b.height ? ` size ${a.width}x${a.height} -> ${b.width}x${b.height}` : '';
	console.log(`${file}: ${pct.toFixed(3)}% differs${sizeNote}`);
	if (pct > threshold) {
		failed++;
		if (out) fs.writeFileSync(path.join(diffDir, file), PNG.sync.write(out));
	}
}
process.exitCode = failed ? 1 : 0;
