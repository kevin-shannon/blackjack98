import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function configure(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'BASIC STRATEGY Rapid-fire decisions' })
    .click();
}
async function startStrategy(page: Page) {
  await configure(page);
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
}
test('gives instant feedback, updates accuracy, and deals another independent hand', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  }); // 6,6 vs 6: split with DAS.
  await startStrategy(page);
  await expect(
    page.getByRole('heading', { name: 'BASIC STRATEGY', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText('—');
  await expect(page.getByLabel('Bet amount')).toHaveCount(0);
  await expect(page.getByLabel('Current bankroll')).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Peek count' })).toHaveCount(0);
  const split = page.getByRole('button', { name: 'Split', exact: true });
  await split.click();
  await expect(page.getByRole('status')).toHaveText('Correct! Split.');
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText(
    '100.0%',
  );
  await expect(page.locator('.playing-card')).toHaveCount(3);
  await expect(split).toBeEnabled();
  await page.getByRole('button', { name: 'Stand', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Incorrect. Correct action: Split.',
  );
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText(
    '50.0%',
  );
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 1 / 2',
  );
  await page.screenshot({
    path: testInfo.outputPath('strategy-feedback-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(errors).toEqual([]);
});

test('offers only relevant settings and persists them independently of Free Play', async ({
  page,
}) => {
  await configure(page);
  await expect(page.getByRole('checkbox')).toHaveCount(4);
  await expect(page.getByLabel('Number of decks')).toHaveCount(0);
  await expect(page.getByLabel('Stakes', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Blackjack payout')).toHaveCount(0);
  await expect(
    page.getByRole('radio', { name: 'Normal', exact: false }),
  ).toBeChecked();
  await page.getByRole('radio', { name: 'Difficult', exact: false }).check();
  await page.getByRole('checkbox', { name: 'Dealer hits soft 17' }).check();
  await page.getByRole('checkbox', { name: 'Allow surrender' }).check();
  await page.getByRole('checkbox', { name: 'Double after split' }).uncheck();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await expect(
    page.getByRole('button', { name: 'Surrender', exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await expect(
    page.getByRole('checkbox', { name: 'Dealer hits soft 17' }),
  ).not.toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Allow surrender' }),
  ).not.toBeChecked();
  await page.getByRole('button', { name: 'BACK' }).click();
  await page
    .getByRole('button', { name: 'BASIC STRATEGY Rapid-fire decisions' })
    .click();
  await expect(
    page.getByRole('checkbox', { name: 'Dealer hits soft 17' }),
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Allow surrender' }),
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Double after split' }),
  ).not.toBeChecked();
  await expect(
    page.getByRole('radio', { name: 'Difficult', exact: false }),
  ).toBeChecked();
});

test('Difficult deals edge cases continuously and changing back to Normal retains accuracy', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await configure(page);
  await page.getByRole('radio', { name: 'Difficult', exact: false }).check();
  await page.screenshot({
    path: testInfo.outputPath('strategy-difficulty-setup.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  // The chosen edge cell is hard 16 vs 6; Normal's same RNG deals 6,6 vs 6.
  await expect(page.locator('.strategy-hand .hand-under')).toHaveText(
    'HARD 16',
  );
  const stand = page.getByRole('button', { name: 'Stand', exact: true });
  await stand.click();
  await expect(page.getByRole('status')).toHaveText('Correct! Stand.');
  await expect(stand).toBeEnabled();
  await expect(page.locator('.strategy-hand .hand-under')).toHaveText(
    'HARD 16',
  );
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await page.getByRole('radio', { name: 'Normal', exact: false }).check();
  await page.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(page.locator('.strategy-hand .hand-under')).toHaveText(
    'HARD 12',
  );
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Correct! Split.');
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 2 / 2',
  );
});

test('changing table rules mid-run resets Basic Strategy accuracy, streaks, and hand count', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await configure(page);
  await page.getByRole('radio', { name: 'Difficult', exact: false }).check();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.getByRole('button', { name: 'Stand', exact: true }).click();
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText(
    '100.0%',
  );
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'STREAK 1',
  );
  await page.getByRole('button', { name: 'Table Rules', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Dealer hits soft 17' }).check();
  await page.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(page.locator('.strategy-session-stats')).toHaveText(
    /^CORRECT 0 \/ 0\s*· STREAK 0\s*· BEST 0$/,
  );
  await expect(page.getByLabel('Basic Strategy accuracy')).not.toContainText(
    '%',
  );
  await expect(page.locator('.strategy-table-meta')).toHaveText('HAND 01');
  await expect(page.getByRole('status')).toHaveText(
    'Choose the correct basic strategy action.',
  );
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: 'Difficult', exact: false }),
  ).toBeChecked();
});

test('mode switches, resumes, and new sessions keep both modes stats separate', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await page.getByRole('button', { name: 'START FREE PLAY' }).click();
  await page.getByRole('button', { name: 'DEAL CARDS' }).click();
  await expect(
    page.getByRole('button', { name: 'STAND', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'STAND', exact: true }).click();
  await expect(page.getByRole('button', { name: 'DEAL AGAIN' })).toBeEnabled();
  const freeStats = await page.locator('.session-stats').innerText();
  const bankroll = await page
    .getByLabel('Current bankroll')
    .locator('.bankvalue')
    .innerText();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page
    .getByRole('button', { name: 'BASIC STRATEGY Rapid-fire decisions' })
    .click();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText(
    '100.0%',
  );
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page
    .getByRole('button', { name: 'RESUME FREE PLAY', exact: true })
    .click();
  await expect(page.locator('.session-stats')).toHaveText(freeStats);
  await expect(
    page.getByLabel('Current bankroll').locator('.bankvalue'),
  ).toHaveText(bankroll);
  await page.getByRole('button', { name: 'New Session', exact: true }).click();
  await page.getByRole('button', { name: 'RESET', exact: true }).click();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page
    .getByRole('button', { name: 'RESUME BASIC STRATEGY', exact: true })
    .click();
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText(
    '100.0%',
  );
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 1 / 1',
  );
  await page.getByRole('button', { name: 'New Session', exact: true }).click();
  await page.getByRole('button', { name: 'RESET', exact: true }).click();
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText('—');
});

test('timed questions pause in menus and score a timeout once before advancing', async ({
  page,
}) => {
  await page.clock.install();
  await configure(page);
  await page.getByRole('checkbox', { name: 'Timed hands' }).check();
  await page.getByRole('slider', { name: 'Seconds per hand' }).focus();
  await page.getByRole('slider', { name: 'Seconds per hand' }).press('Home');
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.clock.fastForward(10000);
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await page.clock.runFor(3000);
  await expect(page.getByRole('status')).toContainText(
    'Time expired. Correct action:',
  );
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'TIMEOUTS 1',
  );
  await page.clock.runFor(1200);
  await expect(page.getByRole('status')).toHaveText(
    'Choose the correct basic strategy action.',
  );
});

test('fits a phone and supports keyboard answers', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await configure(page);
  await expect(
    page.getByRole('group', { name: 'Difficulty', exact: true }),
  ).toBeInViewport();
  await page.getByRole('radio', { name: 'Difficult', exact: false }).check();
  await page.screenshot({
    path: testInfo.outputPath('strategy-difficulty-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('radio', { name: 'Normal', exact: false }).check();
  await expect(
    page.getByRole('button', { name: 'START BASIC STRATEGY' }),
  ).toBeInViewport();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.keyboard.press('p');
  await expect(page.getByRole('status')).toHaveText('Correct! Split.');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await page.screenshot({
    path: testInfo.outputPath('strategy-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
