import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function chooseTest(page: Page, name: string) {
  await page.getByRole('combobox', { name: 'Test', exact: true }).click();
  await page.getByRole('option', { name, exact: true }).click();
}
async function setup(page: Page, name: string) {
  await page.clock.install();
  await page.addInitScript(() => {
    const values = [0.26, 0.4];
    let index = 0;
    Math.random = () => values[index++ % values.length];
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^COUNTING / }).click();
  await chooseTest(page, name);
  await expect(
    page.getByRole('slider', { name: 'Pace', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'START COUNTING', exact: true })
    .click();
}

for (const width of [320, 1280]) {
  test(`Deck Estimation grades half-deck steps, hides exact amounts, and fits at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page, 'Deck Estimation');
    const input = page.getByRole('textbox', {
      name: 'Your deck estimate',
      exact: true,
    });
    await expect(input).toBeFocused();
    await expect(
      page.getByRole('img', {
        name: 'Discard pile; estimate decks remaining from the used cards',
      }),
    ).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page.locator('.deck-estimation-discard [title]')).toHaveCount(
      0,
    );
    // Two decks remaining means four decks in the discard tray.
    await expect(page.locator('.deck-stack')).toHaveAttribute('height', '112');
    await expect(page.locator('.playing-card')).toHaveCount(0);
    await expect(page.getByLabel('Current question')).toHaveText('QUESTION 01');
    await input.fill('2.2');
    await expect(
      page.getByRole('button', { name: 'Submit', exact: true }),
    ).toBeDisabled();
    await page.screenshot({
      path: testInfo.outputPath('deck-estimation.png'),
      fullPage: true,
    });
    await input.fill('1.5');
    await input.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Incorrect', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('status')).toContainText('Decks remaining: 2');
    await expect(
      page.getByText('6 decks − 4 discarded = 2 remaining.'),
    ).toBeVisible();
    await page.clock.fastForward(60000);
    await expect(page.getByLabel('Current question')).toHaveText('QUESTION 01');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByLabel('Current question')).toHaveText('QUESTION 02');
    // More remaining cards means a smaller discard pile.
    await expect(page.locator('.deck-stack')).toHaveAttribute('height', '98');
    await expect(input).toBeFocused();
    await input.fill('2.5');
    await input.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'CORRECT', exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel('Deck Estimation accuracy')).toContainText(
      '50.0%',
    );
    await page.clock.runFor(1100);
    await expect(page.getByLabel('Current question')).toHaveText('QUESTION 03');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });

  test(`True Count shows givens and truncates negative quotients toward zero at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page, 'True Count');
    await expect(
      page.getByLabel('Given running count', { exact: true }),
    ).toHaveText('-5');
    await expect(
      page.getByLabel('Given decks remaining', { exact: true }),
    ).toHaveText('2');
    await expect(
      page.getByText('Truncate toward zero (−2.5 → −2).'),
    ).toBeVisible();
    const input = page.getByRole('textbox', {
      name: 'Your true count',
      exact: true,
    });
    await expect(input).toBeFocused();
    await page.screenshot({
      path: testInfo.outputPath('true-count.png'),
      fullPage: true,
    });
    await input.fill('-2.5');
    await expect(
      page.getByRole('button', { name: 'Submit', exact: true }),
    ).toBeDisabled();
    await input.fill('-3');
    await input.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Close, but not quite.', exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel('True Count accuracy')).toContainText('90.0%');
    await expect(page.locator('.strategy-session-stats')).toContainText(
      'ANSWERS 1',
    );
    await expect(page.locator('.strategy-session-stats')).not.toContainText(
      'CORRECT',
    );
    await expect(
      page
        .getByRole('region', { name: 'Count check', exact: true })
        .getByRole('status'),
    ).toContainText('True count: -2');
    await expect(
      page.getByText('-5 ÷ 2 = -2.50. Truncate toward zero: -2.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await input.fill('-2');
    await input.press('Enter');
    await expect(page.getByLabel('True Count accuracy')).toContainText('95.0%');
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await page.clock.fastForward(60000);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(page.getByLabel('Current question')).toHaveText('QUESTION 02');
    await page.clock.runFor(1100);
    await expect(page.getByLabel('Current question')).toHaveText('QUESTION 03');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}

test('switching tests honors drafts, resets session stats on Apply, and saves the selected test', async ({
  page,
}) => {
  await setup(page, 'Deck Estimation');
  await page
    .getByRole('textbox', { name: 'Your deck estimate', exact: true })
    .fill('2');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await chooseTest(page, 'True Count');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByLabel('Deck Estimation accuracy')).toContainText(
    '100.0%',
  );
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Test', exact: true }),
  ).toHaveText('Deck Estimation');
  await chooseTest(page, 'True Count');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Apply', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'ANSWERS 0',
  );
  await expect(page.getByLabel('Current question')).toHaveText('QUESTION 01');
  await expect(
    page.getByRole('textbox', { name: 'Your true count', exact: true }),
  ).toBeFocused();
  await page.reload();
  await page.getByRole('button', { name: /^COUNTING / }).click();
  await expect(
    page.getByRole('combobox', { name: 'Test', exact: true }),
  ).toHaveText('True Count');
  await chooseTest(page, 'Running Count');
  await expect(
    page.getByRole('slider', { name: 'Pace', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'START COUNTING', exact: true })
    .click();
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
});
