import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function configure(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^DEVIATIONS / }).click();
}

test('grades a count boundary, shows feedback, and keeps dealing with isolated accuracy', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await configure(page);
  await page.getByRole('button', { name: 'START DEVIATIONS' }).click();
  await expect(
    page.getByRole('heading', { name: 'DEVIATIONS', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('True count')).toHaveText('TRUE COUNT0');
  await expect(page.locator('.strategy-hand .score-pill')).toHaveText('11');
  await expect(page.locator('.strategy-hand .hand-under')).toHaveCount(0);
  await expect(page.locator('.dealer-area .seat-label')).toHaveText(
    'Dealer 11',
  );
  await expect(page.locator('.deviation-context')).toHaveText(
    'ILLUSTRIOUS 18 · NO SURRENDER',
  );
  await expect(
    page.getByRole('button', { name: 'Surrender', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Bet amount')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Peek count' })).toHaveCount(0);
  await expect(page.locator('.strategy-explanation')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Explanation', exact: true }),
  ).toHaveCount(0);
  const hit = page.getByRole('button', { name: 'Hit', exact: true });
  await hit.click();
  await expect(
    page.getByRole('button', { name: 'Hit', exact: true }),
  ).toHaveClass(/strategy-correct-action/);
  await expect(
    page.getByRole('region', { name: 'Explanation', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Deviations accuracy')).toContainText('100.0%');
  await expect(page.locator('.playing-card')).toHaveCount(4);
  await expect(page.getByLabel('Face-down card', { exact: true })).toHaveCount(
    1,
  );
  await page.screenshot({
    path: testInfo.outputPath('deviations-feedback.png'),
    fullPage: true,
  });
  await expect(hit).toBeEnabled();
  await page.getByRole('button', { name: 'Double', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Explanation', exact: true })
      .getByRole('heading', { name: 'Hit', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Deviations accuracy')).toContainText('50.0%');
  await expect(
    page.getByRole('region', { name: 'Explanation', exact: true }),
  ).toContainText('Double at TC +1 or above');
  expect(errors).toEqual([]);
});

test('includes insurance with specialized actions and then resumes ordinary decision questions', async ({
  page,
}) => {
  await configure(page);
  await page
    .getByRole('radio', { name: 'Illustrious 18', exact: true })
    .check();
  await page.evaluate(() => {
    const values = [0, 0.75];
    Math.random = () => values.shift() ?? 0.4;
  });
  await page.getByRole('button', { name: 'START DEVIATIONS' }).click();
  await expect(page.getByLabel('True count')).toHaveText('TRUE COUNT+3');
  await expect(
    page.getByRole('button', { name: 'Hit', exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press('i');
  await expect(
    page.getByRole('button', { name: 'Take insurance', exact: true }),
  ).toHaveClass(/strategy-correct-action/);
  await expect(
    page.getByRole('button', { name: 'Hit', exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Take insurance', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Hit', exact: true }).click();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 2 / 2',
  );
});

test('uses H17 Fab 4 indices, resets on rule changes, and saves preferences separately', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.75;
  });
  await configure(page);
  await page.getByRole('radio', { name: 'Fab 4', exact: true }).check();
  await page.getByRole('button', { name: 'START DEVIATIONS' }).click();
  await expect(page.getByLabel('True count')).toHaveText('TRUE COUNT+1');
  await expect(page.locator('.deviation-context')).toHaveText(
    'FAB 4 · LATE SURRENDER',
  );
  await page.getByRole('button', { name: 'Surrender', exact: true }).click();
  await expect(page.getByLabel('Deviations accuracy')).toContainText('100.0%');
  await page.getByRole('button', { name: 'Table Rules', exact: true }).click();
  await page.getByRole('radio', { name: 'H17', exact: false }).check();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.getByLabel('True count')).toHaveText('TRUE COUNT-1');
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
  await page.getByRole('button', { name: 'Surrender', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Surrender', exact: true }),
  ).toHaveClass(/strategy-correct-action/);
  await page.reload();
  await page.getByRole('button', { name: /^DEVIATIONS / }).click();
  await expect(
    page.getByRole('radio', { name: 'H17', exact: false }),
  ).toBeChecked();
  await expect(
    page.getByRole('radio', { name: 'Fab 4', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'BACK' }).click();
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Dealer hits soft 17' }),
  ).not.toBeChecked();
});

test('resumes only the current drill and wipes sessions on mode switches while keeping preferences', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page.getByRole('button', { name: /^DEVIATIONS / }).click();
  await page.getByRole('radio', { name: 'Fab 4', exact: true }).check();
  await page.getByRole('button', { name: 'START DEVIATIONS' }).click();
  await page.getByRole('button', { name: 'Stand', exact: true }).click();
  const review = page.getByRole('region', { name: 'Explanation', exact: true });
  await expect(review).toBeVisible();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await expect(page.getByRole('button', { name: /^RESUME / })).toHaveCount(1);
  await page.getByRole('button', { name: 'RESUME GAME', exact: true }).click();
  await expect(review).toBeVisible();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 1',
  );
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page.getByRole('button', { name: /^DEVIATIONS / }).click();
  await expect(
    page.getByRole('radio', { name: 'Fab 4', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'START DEVIATIONS' }).click();
  await expect(review).toHaveCount(0);
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
});

test('fits a phone, pauses timed questions in menus, and counts a timeout once', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0.3;
  });
  await configure(page);
  await page.getByRole('checkbox', { name: 'Timed hands' }).check();
  await page.getByRole('slider', { name: 'Seconds per hand' }).focus();
  await page.getByRole('slider', { name: 'Seconds per hand' }).press('Home');
  await expect(
    page.getByRole('button', { name: 'START DEVIATIONS' }),
  ).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath('deviations-setup-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'START DEVIATIONS' }).click();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  const reference = page.getByRole('link', {
    name: 'Illustrious 18 / Fab 4',
    exact: true,
  });
  await expect(reference).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'H17 / S17 comparison' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('button', { name: 'OK', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(reference).toBeFocused();
  await page.clock.fastForward(10000);
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
  await page.clock.runFor(3000);
  await expect(
    page.getByRole('region', { name: 'Explanation', exact: true }),
  ).toContainText('Time expired');
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'TIMEOUTS 1',
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await page.screenshot({
    path: testInfo.outputPath('deviations-mobile.png'),
    fullPage: true,
  });
  await page.clock.runFor(1200);
  await page.getByRole('button', { name: 'Next hand', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Hit', exact: true }),
  ).toBeEnabled();
});
