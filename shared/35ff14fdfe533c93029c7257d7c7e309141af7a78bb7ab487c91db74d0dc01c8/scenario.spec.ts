const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const subjectDirectory = process.env.SUBJECT_DIR;
  const outputDirectory = process.env.OUTPUT_DIR;
  const variant = process.env.REPRO_VARIANT;
  const expectedOpen = process.env.EXPECTED_OPEN_AFTER_SCROLLBAR_CLICK === 'true';

  if (!subjectDirectory || !outputDirectory || !variant) {
    throw new Error('SUBJECT_DIR, OUTPUT_DIR, and REPRO_VARIANT are required');
  }

  const { chromium } = require(path.join(subjectDirectory, 'node_modules/playwright'));
  fs.mkdirSync(path.join(outputDirectory, 'video'), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'en',
    reducedMotion: 'reduce',
    viewport: { width: 1024, height: 768 },
    recordVideo: {
      dir: path.join(outputDirectory, 'video'),
      size: { width: 1024, height: 768 }
    }
  });

  try {
    const consoleErrors = [];
    await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
    const page = await context.newPage();
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', error => consoleErrors.push(error.message));

    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__reproReady === true);
    await page.locator('#subject sl-select-button').click();
    await page.waitForFunction(() => {
      const select = document.querySelector('#subject');
      const listbox = select.listbox ?? select.renderRoot.querySelector('sl-listbox');
      return listbox.matches(':popover-open') && listbox.scrollHeight > listbox.clientHeight;
    });

    const readState = () => page.evaluate(() => {
      const select = document.querySelector('#subject');
      const listbox = select.listbox ?? select.renderRoot.querySelector('sl-listbox');
      const rect = listbox.getBoundingClientRect();

      return {
        open: listbox.matches(':popover-open'),
        ariaExpanded: select.button.getAttribute('aria-expanded'),
        scrollTop: listbox.scrollTop,
        scrollHeight: listbox.scrollHeight,
        clientHeight: listbox.clientHeight,
        activeElement: document.activeElement?.localName ?? null,
        listboxRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    });

    const before = await readState();
    await page.screenshot({ path: path.join(outputDirectory, 'before.png') });

    const scrollbarX = before.listboxRect.x + before.listboxRect.width - 2;
    const scrollbarY = before.listboxRect.y + before.listboxRect.height * 0.72;
    await page.mouse.move(scrollbarX, scrollbarY);
    await page.mouse.down({ button: 'left' });
    await page.waitForTimeout(200);
    const duringMouseDown = await readState();
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(250);
    const afterScrollbarClick = await readState();

    await page.mouse.move(
      before.listboxRect.x + before.listboxRect.width / 2,
      before.listboxRect.y + before.listboxRect.height / 2
    );
    await page.mouse.wheel(0, 260);
    await page.waitForTimeout(250);
    const afterWheel = await readState();
    await page.screenshot({ path: path.join(outputDirectory, 'after.png') });

    const observation = {
      variant,
      browser: `Chromium ${browser.version()}`,
      action: {
        description: 'Open the Select in a modal, click its native listbox scrollbar track, then wheel over the listbox',
        scrollbarPoint: { x: scrollbarX, y: scrollbarY },
        wheelDeltaY: 260
      },
      before,
      duringMouseDown,
      afterScrollbarClick,
      afterWheel,
      consoleErrors,
      expectedOpen,
      passed: before.open && afterScrollbarClick.open === expectedOpen && consoleErrors.length === 0,
      usedForScoring: false
    };

    fs.writeFileSync(
      path.join(outputDirectory, 'observation.json'),
      `${JSON.stringify(observation, null, 2)}\n`
    );
    await context.tracing.stop({ path: path.join(outputDirectory, 'trace.zip') });

    if (!observation.passed) process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
