import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const [instanceId, variant, baseURL, evidenceDir] = process.argv.slice(2);
if (!instanceId || !variant || !baseURL || !evidenceDir) throw new Error('missing capture arguments');
const executablePath = process.env.CHROMIUM_EXECUTABLE;
fs.mkdirSync(evidenceDir, {recursive: true});
const videoDir = path.join(evidenceDir, '.video');
fs.mkdirSync(videoDir, {recursive: true});
const consoleErrors = [];
const browser = await chromium.launch({executablePath, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
const context = await browser.newContext({viewport: {width: 960, height: 600}, recordVideo: {dir: videoDir, size: {width: 960, height: 600}}});
await context.tracing.start({screenshots: true, snapshots: true, sources: true});
const page = await context.newPage();
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => consoleErrors.push(error.message));
const entryURL = instanceId === 'IR-M-045' ? `${baseURL}/index.html` : `${baseURL}/`;
await page.goto(entryURL, {waitUntil: 'networkidle'});
await page.locator('body').waitFor({state: 'attached'});
let observation;

if (instanceId === 'IR-M-045') {
  await page.getByRole('button', {name: 'First menu'}).click();
  const second = page.locator('button').filter({hasText: 'Second menu'});
  const box = await second.boundingBox();
  if (!box) throw new Error('Second menu trigger has no geometry');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(200);
  const visibleMenus = await page.getByRole('menu').count();
  await page.mouse.up();
  observation = {action: 'Open the first menu, then press and hold the second trigger', visible_menu_count_while_second_is_pressed: visibleMenus, oracle_passed: visibleMenus === 1};
} else if (instanceId === 'IR-M-046') {
  await page.getByRole('button').click();
  await page.waitForTimeout(300);
  const listboxVisible = await page.getByRole('listbox').isVisible().catch(() => false);
  const buttonText = await page.getByRole('button').textContent();
  observation = {action: 'Open a Select whose Popover is conditionally rendered from the Select isOpen render prop', listbox_visible: listboxVisible, trigger_text: buttonText?.replace(/\s+/g, ' ').trim(), oracle_passed: listboxVisible};
} else if (instanceId === 'IR-M-047') {
  await page.locator('#add-tall-row').click();
  const timeline = await page.evaluate(async () => {
    const rows = () => Array.from(document.querySelectorAll('[data-key]'));
    const sample = () => {
      const tall = rows().find((element) => element.getAttribute('data-key') === 'tall');
      const first = rows().find((element) => element.getAttribute('data-key') === 'one');
      const tallBox = tall?.getBoundingClientRect();
      const firstBox = first?.getBoundingClientRect();
      return {time: performance.now(), tallHeight: tallBox?.height ?? null, tallY: tallBox?.y ?? null, firstY: firstBox?.y ?? null, tallTransform: tall ? getComputedStyle(tall).transform : null, firstTransform: first ? getComputedStyle(first).transform : null};
    };
    const values = [];
    for (let index = 0; index < 55; index++) {
      values.push(sample());
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return values;
  });
  const valid = timeline.filter((entry) => entry.tallHeight != null && entry.firstY != null);
  const final = valid.at(-1) ?? null;
  const late = valid.slice(Math.floor(valid.length * 0.65));
  const lateFirstRange = late.length ? Math.max(...late.map((entry) => entry.firstY)) - Math.min(...late.map((entry) => entry.firstY)) : null;
  observation = {action: 'Insert a wrapped variable-height row and sample row geometry on every animation frame', final_geometry: final, late_first_row_position_range: lateFirstRange, frame_timeline: timeline, oracle_passed: lateFirstRange != null && lateFirstRange < 2};
} else if (instanceId === 'IR-M-048') {
  await page.locator('#run-detached-transition').click();
  await page.waitForTimeout(300);
  const status = await page.locator('#callback-status').textContent();
  const detachedStillPresent = await page.locator('#detached-transition').count();
  observation = {action: 'Start a width transition, detach its element, and queue runAfterTransition', callback_status: status?.trim(), detached_element_count: detachedStillPresent, oracle_passed: status?.trim() === 'callback fired'};
} else if (instanceId === 'IR-M-049') {
  const trigger = page.locator('#tooltip-trigger');
  await page.evaluate(() => {
    const events = [];
    const record = (type, event) => events.push({type, time: performance.now(), propertyName: event?.propertyName ?? null});
    const onTransitionRun = event => record('transitionrun', event);
    const onTransitionEnd = event => record('transitionend', event);
    const onTransitionCancel = event => record('transitioncancel', event);
    document.addEventListener('transitionrun', onTransitionRun, true);
    document.addEventListener('transitionend', onTransitionEnd, true);
    document.addEventListener('transitioncancel', onTransitionCancel, true);
    window.__interactRepairTooltipEvidence = {
      events,
      cleanup: () => {
        document.removeEventListener('transitionrun', onTransitionRun, true);
        document.removeEventListener('transitionend', onTransitionEnd, true);
        document.removeEventListener('transitioncancel', onTransitionCancel, true);
      },
    };
  });
  await trigger.focus();
  const tooltip = page.getByRole('tooltip');
  await tooltip.waitFor({state: 'visible'});
  const geometry = await page.evaluate(async () => {
    const state = window.__interactRepairTooltipEvidence;
    const timeline = [];
    let settledFrames = 0;
    let sawTransition = false;
    const sample = () => {
      const trigger = document.getElementById('tooltip-trigger');
      const tip = document.querySelector('[role="tooltip"]');
      const triggerRect = trigger?.getBoundingClientRect();
      const tipRect = tip?.getBoundingClientRect();
      const activeAnimations = tip ? tip.getAnimations().filter(animation => animation.playState === 'running' || animation.playState === 'pending') : [];
      const entering = tip?.hasAttribute('data-entering') ?? false;
      const triggerCenterX = triggerRect ? triggerRect.left + triggerRect.width / 2 : null;
      const tooltipCenterX = tipRect ? tipRect.left + tipRect.width / 2 : null;
      const centerDelta = triggerCenterX != null && tooltipCenterX != null ? Math.abs(triggerCenterX - tooltipCenterX) : null;
      return {time: performance.now(), entering, active_animation_count: activeAnimations.length, triggerCenterX, tooltipCenterX, centerDelta, triggerOrigin: tip ? getComputedStyle(tip).getPropertyValue('--trigger-origin').trim() : ''};
    };
    for (let frame = 0; frame < 720; frame++) {
      const current = sample();
      timeline.push(current);
      if (current.entering || current.active_animation_count > 0) {
        sawTransition = true;
        settledFrames = 0;
      } else if (sawTransition) {
        settledFrames += 1;
      }
      if (sawTransition && settledFrames >= 4) break;
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    const events = state?.events ?? [];
    state?.cleanup();
    const valid = timeline.filter(entry => entry.centerDelta != null);
    const maxCenterDelta = valid.length ? Math.max(...valid.map(entry => entry.centerDelta)) : null;
    const peak = valid.length ? valid.reduce((best, entry) => entry.centerDelta > best.centerDelta ? entry : best, valid[0]) : null;
    return {timeline, max_center_delta: maxCenterDelta, peak_sample: peak, transition_events: events, transitionrun_count: events.filter(event => event.type === 'transitionrun').length, transitionend_count: events.filter(event => event.type === 'transitionend').length, saw_transition: sawTransition};
  });
  const triggerBox = await trigger.boundingBox();
  const tooltipBox = await tooltip.boundingBox();
  const environmentValid = Boolean(triggerBox && triggerBox.width > 0 && triggerBox.height > 0 && tooltipBox && tooltipBox.width > 0 && tooltipBox.height > 0);
  const triggerValid = geometry.transitionrun_count >= 1 && geometry.saw_transition && geometry.timeline.length >= 2;
  observation = {action: 'Focus a Tooltip trigger and sample trigger/tooltip geometry through the CSS scale transition', ...geometry, environment_valid: environmentValid, trigger_valid: triggerValid, oracle_passed: environmentValid && triggerValid && geometry.max_center_delta != null && geometry.max_center_delta < 2};
} else if (instanceId === 'IR-M-050') {
  await page.getByRole('button', {name: 'Open dialog'}).click();
  await page.getByRole('button', {name: 'Open menu'}).click();
  await page.getByRole('menuitem', {name: 'First item'}).click();
  await page.waitForTimeout(1300);
  const dialogVisible = await page.getByRole('dialog', {name: 'Parent dialog'}).isVisible().catch(() => false);
  const menuVisible = await page.getByRole('menu').isVisible().catch(() => false);
  observation = {action: 'Choose an item from an exiting Popover menu inside a modal dialog', parent_dialog_visible: dialogVisible, menu_visible: menuVisible, oracle_passed: dialogVisible && !menuVisible};
} else if (instanceId === 'IR-M-052') {
  await page.getByRole('tab', {name: 'Tall'}).click();
  await page.waitForTimeout(100);
  const properties = await page.locator('.logical-panels').evaluate((element) => ({height: element.style.getPropertyValue('--tab-panel-height'), width: element.style.getPropertyValue('--tab-panel-width')}));
  observation = {action: 'Switch TabPanels whose transition uses block-size and inline-size', tab_panel_height_variable: properties.height, tab_panel_width_variable: properties.width, oracle_passed: properties.height !== '' && properties.width !== ''};
} else {
  throw new Error(`unsupported Adobe instance ${instanceId}`);
}

await page.screenshot({path: path.join(evidenceDir, `${variant}-screenshot.png`), fullPage: true});
await page.waitForTimeout(500);
const video = page.video();
await context.tracing.stop({path: path.join(evidenceDir, `${variant}-trace.zip`)});
await context.close();
if (video) fs.renameSync(await video.path(), path.join(evidenceDir, `${variant}-video.webm`));
await browser.close();
const payload = {schema_version: '1.0', instance_id: instanceId, variant, chromium_version: '145.0.7632.6', chromium_executable: executablePath, viewport: {width: 960, height: 600}, workers: 1, retries: 0, used_for_scoring: false, ...observation, console_errors: consoleErrors};
fs.writeFileSync(path.join(evidenceDir, 'observation.json'), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload, null, 2));
