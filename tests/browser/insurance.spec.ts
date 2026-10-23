import { expect, test } from '@playwright/test';

for (const choice of ['Insurance', 'Decline'] as const) {
  test(`${choice} resolves insurance from the action panel without a popup`, async ({
    page,
  }, testInfo) => {
    if (choice === 'Decline')
      await page.setViewportSize({ width: 375, height: 900 });
    await page.addInitScript(() => {
      let seed = 2;
      Math.random = Object.assign(
        () => {
          seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
          return seed / 4294967296;
        },
        {
          reset: () => {
            seed = 2;
          },
        },
      );
    });
    await page.goto('/');
    await page.getByRole('button', { name: /^FREE PLAY / }).click();
    await page.evaluate(() =>
      (Math.random as typeof Math.random & { reset(): void }).reset(),
    );
    await page.getByRole('button', { name: 'START FREE PLAY' }).click();
    await page.getByRole('button', { name: 'Deal cards' }).click();
    const actions = page.getByRole('region', { name: 'Game actions' });
    const insurance = actions.getByRole('button', {
      name: 'Insurance',
      exact: true,
    });
    await expect(insurance).toBeEnabled();
    await expect(actions.getByRole('button')).toHaveCount(2);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.app')).not.toHaveAttribute('inert');
    await expect(
      page.getByRole('button', { name: 'Hit', exact: true }),
    ).toHaveCount(0);
    await expect(page.locator('.status')).toContainText('$12.50');
    for (const button of await page.locator('.felt-wagers button').all())
      await expect(button).toBeDisabled();
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'OK', exact: true })
      .click();
    await expect(insurance).toBeEnabled();
    await page.screenshot({
      path: testInfo.outputPath('inline-insurance.png'),
      fullPage: true,
    });
    await actions.getByRole('button', { name: choice, exact: true }).focus();
    await page.keyboard.press('Enter');
    const stand = actions.getByRole('button', { name: 'Stand', exact: true });
    await expect(stand).toBeEnabled();
    await expect(insurance).toHaveCount(0);
    await expect(page.getByLabel('Current bankroll')).toContainText(
      choice === 'Insurance' ? '$962.50' : '$975',
    );
    await stand.click();
    await expect(
      page.getByRole('button', { name: 'Deal again' }),
    ).toBeEnabled();
    await expect(page.getByLabel('Current bankroll')).toContainText(
      choice === 'Insurance' ? '$962.50' : '$975',
    );
  });
}

test('insurance is disabled when its side bet is unaffordable, while Decline still continues', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'blackjack98-v3',
      JSON.stringify({ options: { startingBankroll: 100 } }),
    );
    let seed = 2;
    Math.random = Object.assign(
      () => {
        seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
        return seed / 4294967296;
      },
      {
        reset: () => {
          seed = 2;
        },
      },
    );
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^FREE PLAY / }).click();
  await page.evaluate(() =>
    (Math.random as typeof Math.random & { reset(): void }).reset(),
  );
  await page.getByRole('button', { name: 'START FREE PLAY' }).click();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page
    .getByRole('button', { name: 'Add $100 to bet', exact: true })
    .click();
  await page.getByRole('button', { name: 'Deal cards' }).click();
  const decline = page.getByRole('button', { name: 'Decline', exact: true });
  await expect(decline).toBeEnabled();
  await expect(
    page.getByRole('button', { name: 'Insurance', exact: true }),
  ).toBeDisabled();
  await expect(page.locator('.status')).toContainText('Not enough bankroll');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await decline.click();
  await expect(
    page.getByRole('button', { name: 'Stand', exact: true }),
  ).toBeEnabled();
});
