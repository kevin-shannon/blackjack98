import { expect, test } from '@playwright/test';

for (const mode of ['FREE PLAY', 'BASIC STRATEGY', 'DEVIATIONS']) {
  for (const width of [320, 375, 640, 1280]) {
    test(`${mode}: uniform setup buttons, compact title bar, and one action row at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        Math.random = () => 0.4;
      });
      await page.goto('/');
      await page.getByRole('button', { name: new RegExp(`^${mode} `) }).click();
      const setupButtons = page.locator('.setup-actions .action-btn');
      const setupBoxes = await Promise.all(
        (await setupButtons.all()).map((button) => button.boundingBox()),
      );
      expect(setupBoxes).toHaveLength(2);
      expect(setupBoxes[0]!.height).toBe(width <= 760 ? 44 : 36);
      expect(setupBoxes[1]!.height).toBe(setupBoxes[0]!.height);
      expect(
        await page
          .getByRole('dialog')
          .evaluate((element) => getComputedStyle(element, '::before').height),
      ).toBe('24px');
      if (mode === 'DEVIATIONS')
        await page.getByRole('radio', { name: 'Fab 4', exact: true }).check();
      else
        await page
          .getByRole('checkbox', { name: 'Late surrender (LS)' })
          .setChecked(width !== 640);
      await page.getByRole('button', { name: `START ${mode}` }).click();
      await expect(page.locator('.topbar')).toHaveCSS(
        'height',
        width <= 460 ? '30px' : '32px',
      );
      if (mode === 'FREE PLAY') {
        const title = (await page.locator('.heading-line h1').boundingBox())!;
        const rules = (await page
          .locator('.heading-line .rules')
          .boundingBox())!;
        expect(rules.y).toBeLessThan(title.y + title.height);
        expect(rules.x).toBeGreaterThan(title.x + title.width);
      }
      if (mode === 'FREE PLAY') {
        await page.getByRole('button', { name: 'Add $25 to bet' }).click();
        await page.getByRole('button', { name: 'Deal cards' }).click();
        await expect(
          page.getByRole('button', { name: 'Stand', exact: true }),
        ).toBeEnabled();
      }
      const buttons = page.locator('.action-panel .action-btn');
      await expect(buttons).toHaveCount(
        mode !== 'DEVIATIONS' && width === 640 ? 4 : 5,
      );
      const boxes = await Promise.all(
        (await buttons.all()).map((button) => button.boundingBox()),
      );
      for (const box of boxes) {
        expect(box!.y).toBe(boxes[0]!.y);
        expect(box!.height).toBe(width <= 760 ? 32 : 36);
        expect(box!.width).toBeGreaterThan(0);
      }
      expect(
        await buttons.evaluateAll((elements) =>
          elements.every(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        ),
      ).toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: testInfo.outputPath('responsive-actions.png'),
        fullPage: true,
      });
    });
  }
}
