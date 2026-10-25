import { expect, test } from '@playwright/test';

const cases = [
  {
    family: 'Pair',
    ranks: [6, 6, 6],
    width: 1280,
    row: '6,6',
    dealer: '6',
    action: 'P',
    wrong: 'Stand',
    h17: false,
    das: true,
    surrender: false,
  },
  {
    family: 'Hard',
    ranks: [10, 6, 13],
    width: 320,
    row: '16',
    dealer: '10',
    action: 'R',
    wrong: 'Hit',
    h17: true,
    das: false,
    surrender: true,
  },
  {
    family: 'Soft',
    ranks: [1, 7, 2],
    width: 375,
    row: 'A,7 (18)',
    dealer: '2',
    action: 'D',
    wrong: 'Hit',
    h17: true,
    das: true,
    surrender: false,
  },
  {
    family: 'Pair',
    ranks: [4, 4, 5],
    width: 1280,
    row: '4,4',
    dealer: '5',
    action: 'H',
    wrong: 'Stand',
    h17: false,
    das: false,
    surrender: false,
  },
];

for (const scenario of cases) {
  test(`${scenario.family} ${scenario.row} chart follows rules and highlights dealer ${scenario.dealer}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: scenario.width, height: 850 });
    await page.clock.install();
    await page.addInitScript((ranks) => {
      let index = 0;
      Math.random = Object.assign(
        () => ((ranks[index++ % ranks.length] - 1) * 4 + 0.5) / 52,
        {
          reset: () => {
            index = 0;
          },
        },
      );
    }, scenario.ranks);
    await page.goto('/');
    await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
    await page
      .getByRole('checkbox', { name: 'Dealer hits soft 17' })
      .setChecked(scenario.h17);
    await page
      .getByRole('checkbox', { name: 'Double after split' })
      .setChecked(scenario.das);
    await page
      .getByRole('checkbox', { name: 'Late surrender (LS)' })
      .setChecked(scenario.surrender);
    await page.evaluate(() =>
      (Math.random as typeof Math.random & { reset(): void }).reset(),
    );
    await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
    const show = page.getByRole('button', {
      name: 'Show strategy chart',
      exact: true,
    });
    await expect(show).toHaveCount(0);
    await page
      .getByRole('button', { name: scenario.wrong, exact: true })
      .click();
    await show.click();
    const dialog = page.getByRole('dialog', {
      name: 'Blackjack 98 — Basic Strategy Chart',
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('heading', {
        name: `${scenario.family} strategy`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(dialog.locator('.chart-rules')).toContainText(
      scenario.h17 ? 'H17' : 'S17',
    );
    await expect(dialog.locator('.chart-rules')).toContainText(
      scenario.das ? 'DAS' : 'No DAS',
    );
    await expect(dialog.locator('.chart-rules')).toContainText(
      scenario.surrender ? 'Late surrender' : 'No surrender',
    );
    const selected = dialog.locator('td[aria-current="true"]');
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveText(scenario.action);
    await expect(selected).toHaveAttribute(
      'aria-label',
      new RegExp(`versus dealer ${scenario.dealer}:`),
    );
    await expect(selected.locator('..').getByRole('rowheader')).toHaveText(
      scenario.row,
    );
    await expect(selected).toBeInViewport();
    await expect(page.locator('.app')).toHaveAttribute('inert');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(scenario.width);
    await page.clock.fastForward(60000);
    await expect(dialog).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('strategy-chart.png'),
      fullPage: true,
    });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(show).toBeFocused();
    await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
    await show.click();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('region', { name: 'Strategy chart table' }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('button', { name: 'Close', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      dialog.getByRole('region', { name: 'Strategy chart table' }),
    ).toBeFocused();
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(show).toBeFocused();
    await page.getByRole('button', { name: 'Next hand', exact: true }).click();
    await expect(page.getByLabel('Current round')).toHaveText('ROUND 02');
    await expect(show).toHaveCount(0);
  });
}

test('a timed-out hand can open the chart and remains in review until Next hand', async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
  await page.getByRole('checkbox', { name: 'Timed hands' }).check();
  await page.getByRole('slider', { name: 'Seconds per hand' }).press('Home');
  await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
  await page.clock.runFor(3100);
  await expect(
    page.getByRole('region', { name: 'Explanation', exact: true }),
  ).toContainText('Time expired');
  await page.getByRole('button', { name: 'Show strategy chart' }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Blackjack 98 — Basic Strategy Chart',
  });
  await expect(dialog.locator('td[aria-current="true"]')).toHaveText('P');
  await page.clock.fastForward(60000);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'TIMEOUTS 1',
  );
  await page.getByRole('button', { name: 'Next hand', exact: true }).click();
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 02');
});

test('Deviations explanations do not offer the Basic Strategy chart', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.4;
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^DEVIATIONS / }).click();
  await page.getByRole('button', { name: 'START DEVIATIONS' }).click();
  await page.getByRole('button', { name: 'Double', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Explanation', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Show strategy chart' }),
  ).toHaveCount(0);
});
