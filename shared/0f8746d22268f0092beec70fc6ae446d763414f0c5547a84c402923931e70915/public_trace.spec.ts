import {expect, test} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

test('clicking FileTrigger does not jump a scrollable DropZone ancestor', async ({page}) => {
  let consoleErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => consoleErrors.push(String(error)));

  await page.goto('/');
  let shell = page.getByTestId('scroll-shell');
  let upload = page.getByRole('button', {name: 'Click to upload'});
  await expect(upload).toBeVisible();

  await shell.evaluate(element => {
    element.scrollTop = 430;
  });
  await expect.poll(() => shell.evaluate(element => element.scrollTop)).toBe(430);

  let before = await page.evaluate(() => {
    let shell = document.querySelector<HTMLElement>('[data-testid="scroll-shell"]')!;
    let hidden = document.querySelector<HTMLButtonElement>('button[aria-label="DropZone"]')!;
    let upload = document.querySelector<HTMLButtonElement>('.upload-button')!;
    let shellRect = shell.getBoundingClientRect();
    let hiddenRect = hidden.getBoundingClientRect();
    let uploadRect = upload.getBoundingClientRect();
    return {
      scrollTop: shell.scrollTop,
      hiddenTop: hiddenRect.top,
      uploadTop: uploadRect.top,
      shellTop: shellRect.top,
      shellBottom: shellRect.bottom,
      activeLabel: document.activeElement?.getAttribute('aria-label') || '',
    };
  });

  await expect(upload).toBeVisible();
  await upload.click();
  await page.waitForTimeout(150);

  let after = await page.evaluate(() => {
    let shell = document.querySelector<HTMLElement>('[data-testid="scroll-shell"]')!;
    let hidden = document.querySelector<HTMLButtonElement>('button[aria-label="DropZone"]')!;
    let upload = document.querySelector<HTMLButtonElement>('.upload-button')!;
    let hiddenRect = hidden.getBoundingClientRect();
    let uploadRect = upload.getBoundingClientRect();
    return {
      scrollTop: shell.scrollTop,
      hiddenTop: hiddenRect.top,
      uploadTop: uploadRect.top,
      activeLabel: document.activeElement?.getAttribute('aria-label') || '',
    };
  });

  let delta = after.scrollTop - before.scrollTop;
  let variant = process.env.REPRO_VARIANT || 'unknown';
  let observation = {
    variant,
    precondition: {
      positionedScrollableAncestor: true,
      uploadVisibleBeforeClick: before.uploadTop > before.shellTop && before.uploadTop < before.shellBottom,
      hiddenButtonOutsideBeforeClick: before.hiddenTop < before.shellTop,
    },
    before,
    after,
    scrollDelta: delta,
    activeIsDropZoneButton: after.activeLabel === 'DropZone',
    consoleErrors,
    verified: false,
    subjectArtifactSha256: process.env.SUBJECT_ARTIFACT_SHA256 || null,
  };

  if (variant === 'buggy') {
    observation.verified =
      observation.precondition.uploadVisibleBeforeClick &&
      observation.precondition.hiddenButtonOutsideBeforeClick &&
      Math.abs(delta) > 100 &&
      observation.activeIsDropZoneButton &&
      consoleErrors.length === 0;
  } else if (variant === 'gold') {
    observation.verified =
      observation.precondition.uploadVisibleBeforeClick &&
      observation.precondition.hiddenButtonOutsideBeforeClick &&
      Math.abs(delta) <= 1 &&
      observation.activeIsDropZoneButton &&
      consoleErrors.length === 0;
  }

  let evidenceDir = process.env.REPRO_EVIDENCE_DIR || 'test-results';
  await writeFile(join(evidenceDir, 'observation.json'), JSON.stringify(observation, null, 2));
  await page.screenshot({path: join(evidenceDir, `${variant}-screenshot.png`), fullPage: false});
  expect(observation.verified, JSON.stringify(observation, null, 2)).toBe(true);
});
