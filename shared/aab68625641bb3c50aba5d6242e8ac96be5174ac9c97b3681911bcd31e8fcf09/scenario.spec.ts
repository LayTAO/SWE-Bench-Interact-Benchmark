const fs = require('fs');
const path = require('path');

const {chromium} = require('playwright');

const mode = process.argv[2];
const outputDir = process.argv[3];
const url = process.argv[4] || 'http://127.0.0.1:4200/sidenav';
const executablePath = process.env.CHROMIUM_EXECUTABLE;

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 600_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`dev server did not become ready: ${lastError || 'timeout'}`);
}

async function main() {
  fs.mkdirSync(outputDir, {recursive: true});
  const baseUrl = url.replace(/\/sidenav\/?$/, '/index.html');
  await waitForServer(baseUrl);
  const browser = await chromium.launch({headless: true, executablePath});
  const context = await browser.newContext({
    viewport: {width: 960, height: 600},
    recordVideo: {dir: outputDir, size: {width: 960, height: 600}},
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(baseUrl, {waitUntil: 'domcontentloaded', timeout: 120_000});
  if (!new URL(page.url()).pathname.endsWith('/sidenav')) {
    await page.evaluate(() => {
      history.pushState(null, '', '/sidenav');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  }
  const fixture = page.locator('#interactrepair-focus-trap-fixture');
  await fixture.waitFor({state: 'visible'});
  const drawer = fixture.locator('mat-sidenav.mat-drawer-opened').first();
  await drawer.waitFor({state: 'visible'});
  // FocusTrap places its boundary anchors as siblings around the trapped
  // region, so the official regression test queries the whole fixture rather
  // than only the drawer subtree.
  const anchorState = await fixture.locator('.cdk-focus-trap-anchor').evaluateAll(anchors =>
    anchors.map(anchor => ({
      hasTabindex: anchor.hasAttribute('tabindex'),
      tabindex: anchor.getAttribute('tabindex'),
    })),
  );
  const focusTrapDisabled = anchorState.length > 0 && anchorState.every(anchor => !anchor.hasTabindex);
  await page.evaluate(({mode, focusTrapDisabled, anchorState}) => {
    const badge = document.createElement('div');
    badge.id = 'interactrepair-observation';
    badge.style.cssText = 'position:fixed;right:16px;top:16px;z-index:99999;padding:12px 16px;border-radius:8px;background:#111;color:white;font:14px/1.4 monospace;box-shadow:0 2px 12px #0006';
    badge.textContent = `${mode}: side drawer focus trap ${focusTrapDisabled ? 'disabled' : 'ENABLED'}; anchors=${JSON.stringify(anchorState)}`;
    document.body.appendChild(badge);
    const activeDrawer = document.querySelector('mat-sidenav.mat-drawer-opened');
    if (activeDrawer) activeDrawer.style.outline = focusTrapDisabled ? '4px solid #16883e' : '4px solid #d22';
  }, {mode, focusTrapDisabled, anchorState});
  await page.screenshot({path: path.join(outputDir, `${mode}-screenshot.png`), fullPage: false});
  const video = page.video();
  const observation = {
    schema_version: '1.0',
    mode,
    browser: await page.evaluate(() => navigator.userAgent),
    viewport: {width: 960, height: 600},
    precondition: {start_drawer_open: true, end_drawer_open: false, start_mode: 'side'},
    action: 'open the side drawer while a closed over-mode drawer shares its container',
    postcondition: {focus_trap_anchors: anchorState, focus_trap_disabled: focusTrapDisabled},
    oracle: {expected_focus_trap_disabled: true, passed: focusTrapDisabled},
    environment_valid: pageErrors.length === 0,
    trigger_valid: anchorState.length > 0,
    bug_observed: !focusTrapDisabled,
    console_errors: consoleErrors,
    page_errors: pageErrors,
    used_for_scoring: true,
  };
  fs.writeFileSync(path.join(outputDir, 'observation.json'), JSON.stringify(observation, null, 2) + '\n');
  await context.close();
  await browser.close();
  if (video) {
    const source = await video.path();
    fs.renameSync(source, path.join(outputDir, `${mode}-video.webm`));
  }
  if ((mode === 'buggy' && focusTrapDisabled) || (mode === 'fixed' && !focusTrapDisabled)) process.exitCode = 1;
}

main().catch(error => {
  fs.mkdirSync(outputDir, {recursive: true});
  fs.writeFileSync(path.join(outputDir, 'observation.json'), JSON.stringify({
    schema_version: '1.0', instance_id: 'angular__components-32661', mode,
    environment_valid: false, trigger_valid: false, bug_observed: null,
    action_error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
  }, null, 2) + '\n');
  console.error(error);
  process.exitCode = 2;
});
