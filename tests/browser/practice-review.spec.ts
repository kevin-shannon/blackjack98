import { expect, test } from '@playwright/test';

test.use({ hasTouch: true });

const modes = [
  {
    name: 'Basic Strategy',
    menu: /^BASIC STRATEGY /,
    start: 'START BASIC STRATEGY',
    wrong: 'Stand',
    expected: 'Split',
    key: 'blackjack98-basic-strategy-v1',
  },
  {
    name: 'Deviations',
    menu: /^DEVIATIONS /,
    start: 'START DEVIATIONS',
    wrong: 'Double',
    expected: 'Hit',
    key: 'blackjack98-deviations-v1',
  },
];
for (const mode of modes) {
  test(`${mode.name}: mistakes show a window over the felt and wait for a manual next hand`, async ({
    page,
  }, testInfo) => {
    await page.clock.install();
    await page.addInitScript(() => {
      Math.random = () => 0.4;
    });
    await page.goto('/');
    await page.getByRole('button', { name: mode.menu }).click();
    await expect(
      page.getByRole('checkbox', { name: 'Skip explanations' }),
    ).not.toBeChecked();
    await page.getByRole('button', { name: mode.start }).click();
    await expect(
      page.locator('.strategy-action-panel .panel-title'),
    ).toHaveCount(0);
    await expect(
      page.locator('.strategy-action-panel .panel-helper'),
    ).toHaveCount(0);
    await expect(page.locator('.strategy-explanation')).toHaveCount(0);
    const table = page.getByRole('region', {
      name: `${mode.name} table`,
      exact: true,
    });
    const beforeTable = await table.boundingBox();
    await expect(page.locator('.strategy-felt .status')).toHaveCount(0);
    await page.getByRole('button', { name: mode.wrong, exact: true }).click();
    const review = page.getByRole('region', {
      name: 'Explanation',
      exact: true,
    });
    await expect(review).toBeVisible();
    await expect(
      review.getByRole('heading', { name: mode.expected, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: mode.expected, exact: true }),
    ).toHaveClass(/strategy-correct-action/);
    await expect(
      page.getByRole('button', { name: 'Next hand', exact: true }),
    ).toBeFocused();
    const beforeCards = await page
      .locator('.playing-card')
      .evaluateAll((cards) =>
        cards.map((card) => card.getAttribute('aria-label')),
      );
    await page.clock.fastForward(60000);
    await expect(page.locator('.strategy-session-stats')).toContainText(
      'CORRECT 0 / 1',
    );
    expect(
      await page
        .locator('.playing-card')
        .evaluateAll((cards) =>
          cards.map((card) => card.getAttribute('aria-label')),
        ),
    ).toEqual(beforeCards);
    const windowBox = await review.boundingBox();
    const nextHand = page.getByRole('button', {
      name: 'Next hand',
      exact: true,
    });
    const pointerTarget = await nextHand.evaluate((button) => {
      const box = button.getBoundingClientRect();
      const target = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      return {
        receivesClick: button.contains(target),
        coveringElement: target?.className,
      };
    });
    expect(pointerTarget).toMatchObject({ receivesClick: true });
    const tableBox = await table.boundingBox();
    expect(tableBox!.width).toBe(beforeTable!.width);
    const feltBox = await page.locator('.strategy-felt').boundingBox();
    expect(windowBox!.x).toBeGreaterThan(feltBox!.x);
    expect(windowBox!.y).toBeGreaterThan(feltBox!.y);
    expect(windowBox!.x + windowBox!.width).toBeLessThan(
      feltBox!.x + feltBox!.width,
    );
    expect(windowBox!.y + windowBox!.height).toBeLessThan(
      feltBox!.y + feltBox!.height,
    );
    expect(
      Math.abs(
        windowBox!.x + windowBox!.width / 2 - (feltBox!.x + feltBox!.width / 2),
      ),
    ).toBeLessThan(1);
    for (const card of await page.locator('.playing-card').all()) {
      const cardBox = await card.boundingBox();
      expect(
        windowBox!.x + windowBox!.width <= cardBox!.x ||
          windowBox!.x >= cardBox!.x + cardBox!.width ||
          windowBox!.y + windowBox!.height <= cardBox!.y ||
          windowBox!.y >= cardBox!.y + cardBox!.height,
      ).toBe(true);
    }
    await page.screenshot({
      path: testInfo.outputPath('review-desktop.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await nextHand.click();
    await expect(review).toHaveCount(0);
    await expect(
      page.getByLabel('Current round', { exact: true }),
    ).toContainText('ROUND 02');
    await page.getByRole('button', { name: mode.wrong, exact: true }).click();
    await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
    await page.clock.fastForward(60000);
    await page
      .getByRole('button', { name: 'RESUME GAME', exact: true })
      .click();
    await expect(review).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Next hand', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(review).toHaveCount(0);
    await expect(
      page.getByLabel('Current round', { exact: true }),
    ).toContainText('ROUND 03');
    await expect(
      page.getByRole('button', { name: mode.expected, exact: true }),
    ).toBeEnabled();
  });

  test(`${mode.name}: Skip explanations saves separately and advances after a mistake`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.addInitScript(() => {
      Math.random = () => 0.4;
    });
    await page.goto('/');
    await page.getByRole('button', { name: mode.menu }).click();
    await page.getByRole('checkbox', { name: 'Skip explanations' }).check();
    await page.getByRole('button', { name: mode.start }).click();
    await page.getByRole('button', { name: mode.wrong, exact: true }).click();
    await expect(
      page.getByRole('region', { name: 'Explanation', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: mode.expected, exact: true }),
    ).toHaveClass(/strategy-correct-action/);
    await page.clock.runFor(1000);
    await expect(
      page.getByRole('button', { name: mode.expected, exact: true }),
    ).toBeDisabled();
    await page.clock.runFor(200);
    await expect(
      page.getByRole('button', { name: mode.expected, exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByLabel('Current round', { exact: true }),
    ).toContainText('ROUND 02');
    expect(
      await page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).options.skipExplanations,
        mode.key,
      ),
    ).toBe(true);
    const otherKey = modes.find((other) => other.name !== mode.name)!.key;
    expect(
      await page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key) || '{}').options
            ?.skipExplanations ?? false,
        otherKey,
      ),
    ).toBe(false);
    await page.reload();
    await page.getByRole('button', { name: mode.menu }).click();
    await expect(
      page.getByRole('checkbox', { name: 'Skip explanations' }),
    ).toBeChecked();
  });

  test(`${mode.name}: phone explanation sits on the felt without blocking cards`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.clock.install();
    await page.addInitScript(() => {
      Math.random = () => 0.4;
    });
    await page.goto('/');
    await page.getByRole('button', { name: mode.menu }).click();
    await page.getByRole('button', { name: mode.start }).click();
    await page.getByRole('button', { name: mode.wrong, exact: true }).click();
    const review = page.getByRole('region', {
      name: 'Explanation',
      exact: true,
    });
    const reviewBox = await review.boundingBox();
    const feltBox = await page.locator('.strategy-felt').boundingBox();
    expect(reviewBox!.x).toBeGreaterThan(feltBox!.x);
    expect(reviewBox!.y).toBeGreaterThan(feltBox!.y);
    expect(reviewBox!.x + reviewBox!.width).toBeLessThan(
      feltBox!.x + feltBox!.width,
    );
    expect(reviewBox!.y + reviewBox!.height).toBeLessThan(
      feltBox!.y + feltBox!.height,
    );
    expect(
      Math.abs(
        reviewBox!.x + reviewBox!.width / 2 - (feltBox!.x + feltBox!.width / 2),
      ),
    ).toBeLessThan(1);
    for (const card of await page.locator('.playing-card').all()) {
      const cardBox = await card.boundingBox();
      expect(
        reviewBox!.x + reviewBox!.width <= cardBox!.x ||
          reviewBox!.x >= cardBox!.x + cardBox!.width ||
          reviewBox!.y + reviewBox!.height <= cardBox!.y ||
          reviewBox!.y >= cardBox!.y + cardBox!.height,
      ).toBe(true);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(375);
    await page.screenshot({
      path: testInfo.outputPath('review-mobile.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Next hand', exact: true }).tap();
    await expect(review).toHaveCount(0);
    await expect(
      page.getByLabel('Current round', { exact: true }),
    ).toContainText('ROUND 02');
  });
}
