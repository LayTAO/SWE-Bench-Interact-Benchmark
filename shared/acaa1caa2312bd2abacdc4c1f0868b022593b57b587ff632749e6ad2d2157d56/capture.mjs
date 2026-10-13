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
await page.goto(`${baseURL}/.interactrepair-repro/index.html`, {waitUntil: 'domcontentloaded', timeout: 60000});
await page.waitForTimeout(3000);
// Keep application failures, but discard only the known Vite optimizer noise
// that can be emitted before the frozen reproduction is ready.
for (let index = consoleErrors.length - 1; index >= 0; index--) {
  if (/504|Outdated Optimize Dep|dependency optimizer/i.test(consoleErrors[index])) consoleErrors.splice(index, 1);
}

let observation;
if (instanceId === 'IR-M-063') {
  if (await page.getByRole('combobox').count() === 0) {
    throw new Error(`ComboBox did not render. Console: ${JSON.stringify(consoleErrors)} Body: ${(await page.locator('body').innerText()).slice(0, 1000)}`);
  }
  const input = page.locator('input').first();
  await input.click();
  await input.pressSequentially('apple');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  if (await page.locator('input').count() === 0) {
    throw new Error(`ComboBox input disappeared after selection. Console: ${JSON.stringify(consoleErrors)} Body: ${(await page.locator('body').innerText()).slice(0, 1600)}`);
  }
  const selectedBeforeClear = await input.inputValue();
  for (let index = 0; index < 5; index++) await page.keyboard.press('Backspace');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  const valueAfterBlur = await input.inputValue();
  await input.click();
  await page.waitForTimeout(300);
  const optionStates = await page.getByRole('option').evaluateAll((options) =>
    options.map((option) => ({text: option.textContent?.trim(), ariaSelected: option.getAttribute('aria-selected')}))
  );
  observation = {
    action: 'Type apple, select it with Enter, clear the input, blur, then reopen the menu',
    selected_before_clear: selectedBeforeClear,
    input_value_after_blur: valueAfterBlur,
    option_states_after_reopen: optionStates,
    oracle_passed: optionStates.length === 3 && optionStates.every((option) => option.ariaSelected === 'false'),
  };
} else if (instanceId === 'IR-M-065') {
  await page.getByRole('button', {name: 'Actions'}).click();
  const menu = page.locator('cds-menu');
  await menu.waitFor({state: 'attached'});
  await page.waitForTimeout(500);
  await menu.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const overlap = document.getElementById('overlap');
    if (overlap) {
      overlap.style.position = 'fixed';
      overlap.style.left = `${box.left}px`;
      overlap.style.top = `${box.top}px`;
    }
  });
  const metrics = await menu.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(innerWidth - 1, box.left + box.width / 2));
    const y = Math.max(0, Math.min(innerHeight - 1, box.top + Math.min(box.height / 2, 60)));
    const top = document.elementFromPoint(x, y);
    const style = getComputedStyle(element);
    return {zIndex: style.zIndex, display: style.display, visibility: style.visibility, opacity: style.opacity, open: element.hasAttribute('open'), topElement: top?.tagName ?? null, box: {x: box.x, y: box.y, width: box.width, height: box.height}};
  });
  observation = {action: 'Open the menu button beside an overlapping stacking-context element', menu_z_index: metrics.zIndex, menu_display: metrics.display, menu_visibility: metrics.visibility, menu_opacity: metrics.opacity, menu_open: metrics.open, top_element_at_menu: metrics.topElement, menu_box: metrics.box, oracle_passed: metrics.open && metrics.zIndex !== 'auto' && metrics.zIndex !== '0'};
} else if (instanceId === 'IR-M-066') {
  const trigger = page.getByRole('combobox');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.locator('#outside').click();
  const textAfterOutside = (await trigger.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  observation = {action: 'Highlight an item with ArrowDown, then click outside without selecting', trigger_text_after_outside_click: textAfterOutside, oracle_passed: textAfterOutside.includes('Choose an option')};
} else if (instanceId === 'IR-M-067') {
  await page.getByRole('combobox', {name: 'String items'}).click();
  await page.waitForTimeout(300);
  const customItemCount = await page.getByTestId('custom-item').count();
  const optionTexts = await page.locator('[role="option"]').allTextContents();
  observation = {action: 'Open a Dropdown with string items and an itemToElement renderer', custom_item_count: customItemCount, option_texts: optionTexts.map((value) => value.replace(/\s+/g, ' ').trim()), component_visible: await page.locator('#issue-dropdown').isVisible(), oracle_passed: customItemCount === 3 && consoleErrors.length === 0};
} else if (instanceId === 'IR-M-068') {
  const input = page.getByRole('combobox', {name: 'Fruit'});
  await input.click();
  await page.getByRole('option', {name: 'Apple'}).click();
  await input.focus();
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const active = document.activeElement;
    return {documentId: active?.id ?? null, documentTag: active?.tagName ?? null, shadowId: active?.shadowRoot?.activeElement?.id ?? null};
  });
  observation = {action: 'Select an item and press Tab once', focus_after_tab: focus, oracle_passed: focus.documentId === 'after'};
} else if (instanceId === 'IR-M-069') {
  const combo = page.locator('#issue-combobox');
  await combo.locator('#selection-button').click();
  await page.waitForTimeout(300);
  const state = await combo.evaluate((element) => ({value: element.value ?? '', inputValue: element.shadowRoot?.querySelector('#trigger-button')?.value ?? ''}));
  observation = {action: 'Cancel cds-combo-box-beingselected while clicking the clear button', component_value: state.value, input_value: state.inputValue, oracle_passed: state.value === 'option-1' && state.inputValue === 'Option 1'};
} else if (instanceId === 'IR-M-070') {
  const select = page.locator('#issue-multiselect');
  const mango = select.locator('cds-multi-select-item[value="mango"]');
  await mango.click();
  await page.waitForTimeout(150);
  await mango.click();
  await page.waitForTimeout(150);
  const order = await select.evaluate((element) => Array.from(element.querySelectorAll('cds-multi-select-item')).map((item) => item.textContent.trim()));
  observation = {action: 'Select Mango, then deselect it with selection-feedback set to top', item_order_after_deselection: order, oracle_passed: JSON.stringify(order) === JSON.stringify(['Apple', 'Banana', 'Mango', 'Zebra'])};
} else if (instanceId === 'IR-M-071') {
  const trigger = page.getByRole('combobox', {name: 'Fruit'});
  await trigger.click();
  await page.getByRole('option', {name: 'Apple'}).click();
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => ({id: document.activeElement?.id ?? null, tag: document.activeElement?.tagName ?? null}));
  observation = {action: 'Select an option in an expanded MultiSelect and press Tab', focus_after_tab: focus, oracle_passed: focus.id === 'after'};
} else {
  throw new Error(`unsupported Carbon instance ${instanceId}`);
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
