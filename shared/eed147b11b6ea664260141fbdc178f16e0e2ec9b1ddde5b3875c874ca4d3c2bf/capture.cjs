const fs = require('fs');
const path = require('path');

const {chromium} = require('playwright');

const mode = process.argv[2];
const outputDir = process.argv[3];
const url = process.argv[4] || 'http://127.0.0.1:4200/index.html';

if (!['buggy', 'gold'].includes(mode)) {
  throw new Error(`invalid mode: ${mode}`);
}

async function main() {
  fs.mkdirSync(outputDir, {recursive: true});
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const context = await browser.newContext({viewport: {width: 960, height: 600}});
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 120000});
    const viewport = page.locator('#interactrepair-append-only');
    await viewport.waitFor({state: 'visible', timeout: 120000});
    await viewport.evaluate(element => element.scrollIntoView({block: 'center'}));
    await page.waitForTimeout(1000);

    const precondition = await viewport.evaluate(element => {
      const wrapper = element.querySelector('.cdk-virtual-scroll-content-wrapper');
      return {
        scrollTop: element.scrollTop,
        transform: wrapper.style.transform,
        renderedText: wrapper.firstElementChild && wrapper.firstElementChild.textContent.trim(),
      };
    });

    await viewport.evaluate(element => {
      element.scrollTop = 400;
      element.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(1000);

    const postcondition = await viewport.evaluate(element => {
      const wrapper = element.querySelector('.cdk-virtual-scroll-content-wrapper');
      return {
        scrollTop: element.scrollTop,
        transform: wrapper.style.transform,
        renderedText: wrapper.firstElementChild && wrapper.firstElementChild.textContent.trim(),
      };
    });
    const oraclePassed = postcondition.transform === 'translateY(0px)';

    await page.evaluate(({mode, oraclePassed, postcondition}) => {
      const badge = document.createElement('div');
      badge.id = 'interactrepair-observation';
      badge.style.cssText = 'position:fixed;right:16px;top:16px;z-index:99999;padding:12px 16px;border-radius:8px;background:#111;color:white;font:14px/1.4 monospace;box-shadow:0 2px 12px #0006;max-width:620px';
      badge.textContent = mode + ': scrollTop=' + postcondition.scrollTop + '; transform=' + postcondition.transform;
      document.body.appendChild(badge);
      const target = document.querySelector('#interactrepair-append-only');
      target.style.outline = oraclePassed ? '5px solid #16883e' : '5px solid #d22';
    }, {mode, oraclePassed, postcondition});

    await page.screenshot({path: path.join(outputDir, `${mode}-screenshot.png`), fullPage: false});
    const observation = {
      schema_version: '1.0',
      mode,
      browser: await page.evaluate(() => navigator.userAgent),
      viewport: {width: 960, height: 600},
      precondition,
      action: 'set append-only viewport scrollTop to 400px and dispatch one scroll event',
      postcondition,
      oracle: {
        measured_field: '#interactrepair-append-only .cdk-virtual-scroll-content-wrapper.style.transform',
        expected: 'translateY(0px)',
        passed: oraclePassed,
      },
      console_errors: consoleErrors,
      page_errors: pageErrors,
      used_for_scoring: false,
    };
    fs.writeFileSync(path.join(outputDir, 'observation.json'), JSON.stringify(observation, null, 2) + '\n');
    if ((mode === 'buggy' && oraclePassed) || (mode === 'gold' && !oraclePassed)) {
      process.exitCode = 1;
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 2;
});
