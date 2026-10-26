import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function chooseDifficulty(page: Page, choice: 'Normal' | 'Tricky') {
  await page.getByRole('combobox', { name: 'Difficulty', exact: true }).click();
  await page.getByRole('option', { name: choice, exact: true }).click();
}

async function configure(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
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
  await expect(page.locator('.practice-correct')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Split', exact: true }),
  ).toHaveClass(/strategy-correct-action/);
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText(
    '100.0%',
  );
  await expect(page.locator('.playing-card')).toHaveCount(4);
  await expect(page.getByLabel('Face-down card', { exact: true })).toHaveCount(
    1,
  );
  await expect(page.locator('.dealer-area .seat-label')).toHaveText('Dealer 6');
  await expect(page.locator('.strategy-hand .hand-under')).toHaveCount(0);
  await expect(split).toBeEnabled();
  await expect(page.locator('.practice-correct')).toHaveCount(0);
  await page.getByRole('button', { name: 'Stand', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Explanation', exact: true })
      .getByRole('heading', { name: 'Split', exact: true }),
  ).toBeVisible();
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
  await expect(page.getByRole('checkbox')).toHaveCount(5);
  await expect(page.getByLabel('Number of decks')).toHaveCount(0);
  await expect(page.getByLabel('Stakes', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Blackjack payout')).toHaveCount(0);
  await expect(
    page.getByRole('combobox', { name: 'Difficulty', exact: true }),
  ).toHaveText('Normal');
  await chooseDifficulty(page, 'Tricky');
  await page.getByRole('checkbox', { name: 'Dealer hits soft 17' }).uncheck();
  await page.getByRole('checkbox', { name: 'Late surrender (LS)' }).check();
  await page.getByRole('checkbox', { name: 'Double after split' }).uncheck();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await expect(
    page.getByRole('button', { name: 'Surrender', exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /^FREE PLAY / }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Dealer hits soft 17' }),
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Late surrender (LS)' }),
  ).not.toBeChecked();
  await page.getByRole('button', { name: 'BACK' }).click();
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Dealer hits soft 17' }),
  ).not.toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Late surrender (LS)' }),
  ).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: 'Double after split' }),
  ).not.toBeChecked();
  await expect(
    page.getByRole('combobox', { name: 'Difficulty', exact: true }),
  ).toHaveText('Tricky');
});

test('Tricky deals edge cases continuously and changing back to Normal retains accuracy', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await configure(page);
  await chooseDifficulty(page, 'Tricky');
  await page.screenshot({
    path: testInfo.outputPath('strategy-difficulty-setup.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  // The expanded pool selects soft 15 vs 7; Normal's same RNG deals 6,6 vs 6.
  await expect(page.locator('.strategy-hand .score-pill')).toHaveText('15');
  const hit = page.getByRole('button', { name: 'Hit', exact: true });
  await hit.click();
  await expect(
    page.getByRole('button', { name: 'Hit', exact: true }),
  ).toHaveClass(/strategy-correct-action/);
  await expect(hit).toBeEnabled();
  await expect(page.locator('.strategy-hand .score-pill')).toHaveText('15');
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await chooseDifficulty(page, 'Normal');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.strategy-hand .score-pill')).toHaveText('12');
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Split', exact: true }),
  ).toHaveClass(/strategy-correct-action/);
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
  await chooseDifficulty(page, 'Tricky');
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.getByRole('button', { name: 'Hit', exact: true }).click();
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText(
    '100.0%',
  );
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'STREAK 1',
  );
  await page.getByRole('button', { name: 'Table Rules', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Dealer hits soft 17' }).check();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.strategy-session-stats')).toHaveText(
    /^CORRECT 0 \/ 0\s*· STREAK 0\s*· BEST 0$/,
  );
  await expect(page.getByLabel('Basic Strategy accuracy')).not.toContainText(
    '%',
  );
  await expect(page.getByLabel('Current round', { exact: true })).toHaveText(
    'ROUND 01',
  );
  await expect(
    page.getByRole('region', { name: 'Explanation', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Hit', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Difficulty', exact: true }),
  ).toHaveText('Tricky');
});

test('keeps one resume button and starts fresh when switching between Free Play and Basic Strategy', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^RESUME / })).toHaveCount(0);
  await page.getByRole('button', { name: /^FREE PLAY / }).click();
  await page.getByRole('button', { name: 'START FREE PLAY' }).click();
  const freshStats = await page.locator('.session-stats').innerText();
  const startingBankroll = await page
    .getByLabel('Current bankroll')
    .locator('.bankvalue')
    .innerText();
  await page
    .getByRole('button', { name: 'Add $25 to bet', exact: true })
    .click();
  await page.getByRole('button', { name: 'Deal cards' }).click();
  await expect(
    page.getByRole('button', { name: 'Stand', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Stand', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Deal again' })).toBeEnabled();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await expect(page.getByRole('button', { name: /^RESUME / })).toHaveCount(1);
  await page.getByRole('button', { name: 'RESUME GAME', exact: true }).click();
  await expect(page.getByLabel('Basic Strategy accuracy')).toContainText(
    '100.0%',
  );
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page.getByRole('button', { name: /^FREE PLAY / }).click();
  await page.getByRole('button', { name: 'BACK' }).click();
  await expect(page.getByRole('button', { name: /^RESUME / })).toHaveCount(0);
  await page.getByRole('button', { name: /^FREE PLAY / }).click();
  await page.getByRole('button', { name: 'START FREE PLAY' }).click();
  await expect(page.locator('.session-stats')).toHaveText(freshStats);
  await expect(
    page.getByLabel('Current bankroll').locator('.bankvalue'),
  ).toHaveText(startingBankroll);
  await expect(page.getByLabel('Current round')).toHaveCount(0);
  await expect(page.getByLabel('Bet controls')).toBeVisible();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
});

test('timed questions pause in menus and score a timeout once before advancing', async ({
  page,
}) => {
  await page.clock.install();
  await configure(page);
  await page.getByRole('checkbox', { name: 'Timed hands' }).check();
  await page.getByRole('checkbox', { name: 'Skip explanations' }).check();
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
  await expect(page.locator('.strategy-correct-action')).toHaveCount(1);
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 1',
  );
  await page.clock.runFor(1200);
  await expect(
    page.getByRole('region', { name: 'Explanation', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Hit', exact: true }),
  ).toBeEnabled();
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
    page.getByRole('combobox', { name: 'Difficulty', exact: true }),
  ).toBeInViewport();
  await chooseDifficulty(page, 'Tricky');
  await page.screenshot({
    path: testInfo.outputPath('strategy-difficulty-mobile.png'),
    fullPage: true,
  });
  await chooseDifficulty(page, 'Normal');
  await expect(
    page.getByRole('button', { name: 'START BASIC STRATEGY' }),
  ).toBeInViewport();
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.keyboard.press('p');
  await expect(
    page.getByRole('button', { name: 'Split', exact: true }),
  ).toHaveClass(/strategy-correct-action/);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await page.screenshot({
    path: testInfo.outputPath('strategy-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
