import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function chooseOption(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

for (const width of [375, 1280]) {
  test(`hand-type choices filter Normal and Tricky practice and persist at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      let seed = 42;
      Math.random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    });
    await page.goto('/');
    await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
    const handTypes = page.getByRole('combobox', {
      name: 'Hand type',
      exact: true,
    });
    await expect(handTypes).toHaveText('All');
    await expect(page.locator('label[for="strategy-difficulty"]')).toHaveCSS(
      'color',
      'rgb(0, 0, 0)',
    );
    await handTypes.click();
    await expect(page.getByRole('listbox').getByRole('option')).toHaveText([
      'Hard',
      'Soft',
      'Pairs',
      'All',
    ]);
    await page.screenshot({
      path: testInfo.outputPath('hand-type-setup.png'),
      fullPage: true,
    });
    await handTypes.press('Escape');
    const difficultySelect = page.getByRole('combobox', {
      name: 'Difficulty',
      exact: true,
    });
    await difficultySelect.press('t');
    await difficultySelect.press('Enter');
    await expect(difficultySelect).toHaveText('Tricky');
    await page.getByRole('button', { name: 'START BASIC STRATEGY' }).click();
    for (const difficulty of ['Normal', 'Tricky']) {
      for (const handType of ['Hard', 'Soft', 'Pairs', 'All']) {
        await page
          .getByRole('button', { name: 'Options', exact: true })
          .click();
        await chooseOption(page, 'Difficulty', difficulty);
        await chooseOption(page, 'Hand type', handType);
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        const ranks = await page
          .locator('.strategy-hand .playing-card')
          .evaluateAll((cards) =>
            cards.map((card) => card.getAttribute('aria-label')!.split(' ')[0]),
          );
        expect(ranks).toHaveLength(2);
        const values = ranks.map((rank) =>
          rank === 'A'
            ? 11
            : ['J', 'Q', 'K'].includes(rank)
              ? 10
              : Number(rank),
        );
        const paired = values[0] === values[1];
        if (handType !== 'All') {
          expect(paired).toBe(handType === 'Pairs');
          if (!paired) expect(ranks.includes('A')).toBe(handType === 'Soft');
        }
        if (handType === 'Hard' || handType === 'Soft')
          await expect(
            page.getByRole('button', { name: 'Split', exact: true }),
          ).toBeDisabled();
        else if (handType === 'Pairs')
          await expect(
            page.getByRole('button', { name: 'Split', exact: true }),
          ).toBeEnabled();
      }
    }
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await chooseOption(page, 'Hand type', 'Pairs');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(handTypes).toHaveText('All');
    await chooseOption(page, 'Hand type', 'Pairs');
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
    await expect(handTypes).toHaveText('Pairs');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}
