// Screenshot a URL with Puppeteer.
// Usage: node screenshot.mjs <url> [label] [--width=1440] [--height=900] [--full]
// Saves auto-incremented PNGs to ./temporary screenshots/screenshot-N[-label].png
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--')) || 'http://localhost:3000';
const label = args.filter((a) => !a.startsWith('--'))[1];
const getFlag = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const width = Number(getFlag('width', 1440));
const height = Number(getFlag('height', 900));
const fullPage = args.includes('--full');

const OUT_DIR = join(process.cwd(), 'temporary screenshots');
await mkdir(OUT_DIR, { recursive: true });

let next = 1;
try {
  const existing = await readdir(OUT_DIR);
  const nums = existing
    .map((f) => f.match(/^screenshot-(\d+)/))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  if (nums.length) next = Math.max(...nums) + 1;
} catch {}

const name = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outPath = join(OUT_DIR, name);

const browser = await puppeteer.launch({ headless: 'new' });
try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 600)); // let fonts/animations settle
  await page.screenshot({ path: outPath, fullPage });
  console.log(`Saved ${outPath}`);
} finally {
  await browser.close();
}
