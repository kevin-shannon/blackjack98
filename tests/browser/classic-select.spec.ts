import { expect, test } from '@playwright/test';

for (const width of [375, 1280]) {
  test(`classic payout dropdown supports pointer, keyboard, and settings drafts at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: /^FREE PLAY / }).click();
    await expect(
      page.getByText(
        'Choose your rules and gameplay options, then start the session.',
      ),
    ).toHaveCount(0);
    await expect(page.locator('.setup-actions button')).toHaveText([
      'BACK',
      'START FREE PLAY',
    ]);
    const payout = page.getByRole('combobox', { name: 'Blackjack payout' });
    const list = page.getByRole('listbox', { name: 'Blackjack payout' });
    await payout.click();
    await expect(list.getByRole('option')).toHaveText(['3:2', '6:5']);
    await expect(list).toHaveCSS('border-radius', '0px');
    await expect(list.locator('.active')).toHaveCSS(
      'background-color',
      'rgb(0, 0, 128)',
    );
    await page.screenshot({
      path: testInfo.outputPath('classic-payout.png'),
      fullPage: true,
    });
    await list.getByRole('option', { name: '6:5' }).click();
    await expect(list).toHaveCount(0);
    await expect(payout).toHaveText('6:5');
    await payout.press('ArrowDown');
    await payout.press('Home');
    await payout.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(payout).toHaveText('6:5');
    await expect(page.getByRole('dialog')).toBeVisible();
    await payout.press('Enter');
    await payout.press('Home');
    await payout.press('Enter');
    await expect(payout).toHaveText('3:2');
    await payout.click();
    await page.locator('.setup-topline .dialog-cap').click();
    await expect(list).toHaveCount(0);
    await page
      .getByRole('button', { name: 'START FREE PLAY', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Table Rules', exact: true })
      .click();
    const original = await page.evaluate(() =>
      localStorage.getItem('blackjack98-v3'),
    );
    await payout.press('6');
    await payout.press('Enter');
    await expect(payout).toHaveText('6:5');
    expect(
      await page.evaluate(() => localStorage.getItem('blackjack98-v3')),
    ).toBe(original);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page
      .getByRole('button', { name: 'Table Rules', exact: true })
      .click();
    await expect(payout).toHaveText('3:2');
    await payout.click();
    await list.getByRole('option', { name: '6:5' }).click();
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(payout).toHaveText('6:5');
    await payout.click();
    await payout.press('Tab');
    await expect(list).toHaveCount(0);
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(
      page.getByText('BLACKJACK PAYS 6:5', { exact: true }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: /^FREE PLAY / }).click();
    await expect(payout).toHaveText('6:5');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
