// Browser smoke test for wireframe/WF_reference.html.
// Every view renders without errors or horizontal overflow at phone and desktop widths,
// and the core flows (accept trade, add item, list, buy, send offer) still change state.
// Needs Playwright: npm i --no-save playwright@1.48.2 && npx playwright install chromium
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const URL = pathToFileURL(resolve('wireframe/WF_reference.html')).href;
const VIEWS = ['home', 'search', 'shop', 'portfolio', 'trades', 'wishlist', 'people', 'messages', 'me', 'system'];
const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.reload();

for (const width of [360, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const v of [...VIEWS, 'profile']) {
    await page.evaluate(v => (v === 'profile' ? ACT.profile({ v: 'ashley' }) : ACT.go({ v })), v);
    const h1 = await page.$eval('main h1', e => e.textContent.trim()).catch(() => '');
    check(h1, `${v} @${width}px: no page heading`);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    check(sw <= width, `${v} @${width}px: horizontal overflow (${sw}px)`);
  }
}

await page.setViewportSize({ width: 1440, height: 900 });
const S = () => page.evaluate(() => ({ wallet: S.wallet, mine: owned('you').length, status: S.trades.map(t => t.status), listings: S.listings.length }));
const s0 = await S();
await page.evaluate(() => ACT.go({ v: 'trades' }));
await page.click('.trade >> text=Accept');
await page.click('.mfoot >> text=Accept trade');
const s1 = await S();
check(s1.status[0] === 'accepted' && s1.wallet === s0.wallet + 20, 'accepting the seeded trade did not complete it');

await page.evaluate(() => ACT.addItem());
await page.fill('#pq', 'umbreon');
await page.click('#plist .catrow >> nth=0');
await page.click('.mfoot >> text=Add to portfolio');
check((await S()).mine === s1.mine + 1, 'adding an item did not add it');

const before = (await S()).listings;
await page.click('.tbl tbody tr >> nth=0');
await page.click('#modal >> text=List for sale');
await page.click('.mfoot >> text=List for sale');
check((await S()).listings === before + 1, 'listing an item did not create a listing');

const w = (await S()).wallet;
await page.evaluate(() => ACT.buy({ id: liveListings().sort((a, b) => a.l.price - b.l.price)[0].l.id }));
await page.click('.mfoot .btn');
check((await S()).wallet < w, 'buying did not charge the wallet');

await page.evaluate(() => ACT.newTrade({ partner: 'mira' }));
await page.click('.cols section:nth-child(1) .pick >> nth=0');
await page.click('.cols section:nth-child(2) .pick >> nth=0');
await page.click('.mfoot >> text=Send offer');
check((await S()).status.at(-1) === 'pending', 'sending a trade offer did not create a pending trade');

check(!errors.length, `page errors: ${errors.join(' | ')}`);
await browser.close();

if (failures.length) { console.error(`wireframe smoke test: ${failures.length} failure(s)\n  ${failures.join('\n  ')}`); process.exit(1); }
console.log(`wireframe smoke test: ${VIEWS.length + 1} views x 2 widths and 5 flows passed`);
