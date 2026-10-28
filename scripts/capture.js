import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('docs/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Autopsy Workbench - Timeline View (Step 2 - Exploit Inflection Point)
  const stepButtons = await page.$$('div.flex.justify-between.items-center.mt-2 button');
  if (stepButtons.length > 1) {
    await stepButtons[1].click(); // Step 2 (exploit inflection point)
    await new Promise(r => setTimeout(r, 500));
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-autopsy-workbench-timeline.png') });
  console.log('Saved 01-autopsy-workbench-timeline.png');

  // 2. Invariant & Patch Verification Sandbox with Patch Active (WASM Execution Log)
  const tabButtons = await page.$$('div.flex.items-center.gap-1.p-1.bg-slate-900 button');
  for (const b of tabButtons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Rust Invariant Sandbox')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));

  // Toggle patch switch to ON
  const toggleBtn = await page.$('button.relative.inline-flex.h-6.w-11');
  if (toggleBtn) {
    await toggleBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02-invariant-remediation-sandbox.png') });
  console.log('Saved 02-invariant-remediation-sandbox.png');

  // 2b. Source Code Invariant Diff (Scroll to show vulnerable vs patched diff)
  await page.evaluate(() => {
    window.scrollBy(0, 420);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02b-source-code-invariant-diff.png') });
  console.log('Saved 02b-source-code-invariant-diff.png');

  // Reset scroll
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 300));

  // 3. PoC Test Harness Tab
  const tabButtons2 = await page.$$('div.flex.items-center.gap-1.p-1.bg-slate-900 button');
  for (const b of tabButtons2) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('PoC Test Harness')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04-poc-test-harness.png') });
  console.log('Saved 04-poc-test-harness.png');

  // 4. Executive Autopsy Report Tab
  for (const b of tabButtons2) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Executive Autopsy Report')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05-executive-autopsy-report.png') });
  console.log('Saved 05-executive-autopsy-report.png');

  // 5. Main Catalog View
  const headerLinks = await page.$$('header button, header nav button');
  for (const h of headerLinks) {
    const text = await page.evaluate(el => el.textContent, h);
    if (text.trim() === 'Incident Catalog' || text.includes('Incident Catalog')) {
      await h.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03-incident-catalog-threat-repo.png') });
  console.log('Saved 03-incident-catalog-threat-repo.png');

  // 6. Rust Core Crate Specs
  const headerLinks2 = await page.$$('header button, header nav button');
  for (const h of headerLinks2) {
    const text = await page.evaluate(el => el.textContent, h);
    if (text.includes('Rust Core Crate')) {
      await h.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06-rust-wasm-specs.png') });
  console.log('Saved 06-rust-wasm-specs.png');

  // 7. New Incident Submission Modal
  const headerLinks3 = await page.$$('header button, header nav button');
  for (const h of headerLinks3) {
    const text = await page.evaluate(el => el.textContent, h);
    if (text.includes('Submit Autopsy')) {
      await h.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07-submit-autopsy-modal.png') });
  console.log('Saved 07-submit-autopsy-modal.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
