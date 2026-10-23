import { expect, test } from '@playwright/test';

for (const width of [1280, 375, 320]) {
  test(`felt chips add wagers and lock during play at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      Math.random = () => 0.4;
    });
    await page.goto('/');
    await page.getByRole('button', { name: /^FREE PLAY / }).click();
    await page.getByRole('radio', { name: 'Average Joe', exact: true }).check();
    await page.getByRole('button', { name: 'START FREE PLAY' }).click();
    const controls = page.getByRole('region', { name: 'Bet controls' });
    const bet = page.getByLabel('Bet amount', { exact: true });
    const clear = controls.getByRole('button', { name: 'Clear', exact: true });
    const chip = (value: number) =>
      controls.getByRole('button', {
        name: `Add $${value} to bet`,
        exact: true,
      });
    await expect(page.locator('.bet-panel')).toHaveCount(0);
    await expect(page.getByLabel('Current round')).toHaveCount(0);
    await clear.click();
    await expect(bet).toHaveText('$0');
    await expect(clear).toBeDisabled();
    await chip(5).click();
    await expect(bet).toHaveText('$5');
    await expect(
      page.getByRole('button', { name: 'Deal cards' }),
    ).toBeDisabled();
    await chip(25).click();
    await expect(bet).toHaveText('$30');
    const boxes = await Promise.all(
      [5, 25, 50, 100, 500].map(async (value) => {
        const image = chip(value).locator('img');
        await expect(image).toHaveJSProperty('naturalWidth', 32);
        await expect(image).toHaveJSProperty('naturalHeight', 32);
        await expect(image).toHaveCSS('width', '48px');
        return (await chip(value).boundingBox())!;
      }),
    );
    expect(boxes[0].x).toBe(boxes[2].x);
    expect(boxes[1].x).toBe(boxes[3].x);
    expect(boxes[1].y).toBe(boxes[2].y);
    expect(boxes[3].y).toBe(boxes[4].y);
    expect(boxes[0].y).toBeLessThan(boxes[1].y);
    expect(boxes[1].y).toBeLessThan(boxes[3].y);
    const bankBox = (await page.getByLabel('Current bankroll').boundingBox())!;
    const betBox = (await bet.boundingBox())!;
    expect(betBox.y).toBeGreaterThanOrEqual(bankBox.y + bankBox.height);
    const felt = (await page.locator('.freeplay-felt').boundingBox())!;
    const heightWithoutWagers = await page
      .locator('.freeplay-felt')
      .evaluate((element) => {
        const controls = element.querySelector<HTMLElement>('.felt-wagers')!;
        controls.style.display = 'none';
        const height = element.getBoundingClientRect().height;
        controls.style.removeProperty('display');
        return height;
      });
    expect(felt.height).toBe(heightWithoutWagers);
    await expect(page.locator('.table-bottomline')).toHaveCSS(
      'min-height',
      'auto',
    );
    const corner = (await controls.boundingBox())!;
    expect(corner.x + corner.width).toBeLessThan(felt.x + felt.width);
    expect(corner.y + corner.height).toBeLessThan(felt.y + felt.height);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath('felt-wagers.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Deal cards' }).click();
    for (const button of await controls.getByRole('button').all())
      await expect(button).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Stand', exact: true }),
    ).toBeEnabled();
    await expect(bet).toHaveText('$30');
    const dealerCard = (await page
      .locator('.dealer-area .playing-card')
      .first()
      .boundingBox())!;
    const playerCard = (await page
      .locator('.hand-slot .playing-card')
      .first()
      .boundingBox())!;
    expect(dealerCard.width).toBe(playerCard.width);
    expect(dealerCard.height).toBe(playerCard.height);
    await page.screenshot({
      path: testInfo.outputPath('wager-locked.png'),
      fullPage: true,
    });
    const hand = (await page.locator('.hand-slot').boundingBox())!;
    const playingFelt = (await page.locator('.freeplay-felt').boundingBox())!;
    expect(
      Math.abs(
        hand.x + hand.width / 2 - (playingFelt.x + playingFelt.width / 2),
      ),
    ).toBeLessThan(1);
    await page.getByRole('button', { name: 'Stand', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Deal again' }),
    ).toBeEnabled();
    await expect(chip(100)).toBeEnabled();
    await chip(100).focus();
    await page.keyboard.press('Enter');
    await expect(bet).toHaveText('$130');
    await clear.click();
    await chip(500).click();
    await expect(bet).toHaveText('$500');
  });
}
