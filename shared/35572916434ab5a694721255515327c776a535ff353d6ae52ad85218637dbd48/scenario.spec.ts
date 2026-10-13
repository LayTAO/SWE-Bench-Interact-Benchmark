const fs = require('fs');
const path = require('path');
const {chromium} = require('playwright');

const mode = process.argv[2];
const outputDir = process.argv[3];
const url = process.argv[4] || 'http://127.0.0.1:4200/index.html';
const executablePath = process.env.CHROMIUM_EXECUTABLE;

if (!['buggy', 'fixed'].includes(mode)) throw new Error(`invalid mode: ${mode}`);

async function main() {
  fs.mkdirSync(outputDir, {recursive: true});
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: {width: 960, height: 600},
    recordVideo: {dir: outputDir, size: {width: 960, height: 600}},
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(error.message));
  let observation;
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.evaluate(() => {
      history.pushState(null, '', '/virtual-scroll');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
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
    const fixedState = postcondition.transform === 'translateY(0px)';
    const bugObserved = !fixedState;
    await page.evaluate(({mode, fixedState, postcondition}) => {
      const badge = document.createElement('div');
      badge.id = 'interactrepair-observation';
      badge.textContent = `${mode}: scrollTop=${postcondition.scrollTop}; transform=${postcondition.transform}`;
      badge.style.cssText = 'position:fixed;right:16px;top:16px;z-index:99999;padding:12px 16px;border-radius:8px;background:#111;color:white;font:14px/1.4 monospace;box-shadow:0 2px 12px #0006';
      document.body.appendChild(badge);
      const target = document.querySelector('#interactrepair-append-only');
      target.style.outline = fixedState ? '5px solid #16883e' : '5px solid #d22';
    }, {mode, fixedState, postcondition});
    await page.screenshot({path: path.join(outputDir, `${mode}-screenshot.png`), fullPage: false});
    observation = {
      schema_version: '1.0', instance_id: 'angular__components-25077', mode,
      browser: await page.evaluate(() => navigator.userAgent), viewport: {width: 960, height: 600},
      environment_valid: pageErrors.length === 0,
      trigger_valid: true, bug_observed: bugObserved,
      precondition, action: 'set append-only viewport scrollTop to 400px and dispatch one scroll event', postcondition,
      oracle: {measured_field: '#interactrepair-append-only .cdk-virtual-scroll-content-wrapper.style.transform', expected: 'translateY(0px)', passed: fixedState},
      console_errors: consoleErrors, page_errors: pageErrors, used_for_scoring: true,
    };
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();
    if (video) {
      const source = await video.path();
      fs.renameSync(source, path.join(outputDir, `${mode}-video.webm`));
    }
  }
  fs.writeFileSync(path.join(outputDir, 'observation.json'), JSON.stringify(observation, null, 2) + '\n');
  if (!observation.environment_valid || !observation.trigger_valid || observation.bug_observed !== (mode === 'buggy')) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 2; });
