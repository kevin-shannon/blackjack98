import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function configure(page: Page) {
  await page.clock.install();
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: /^COUNTING / }).click();
  await page.getByRole('slider', { name: 'Pace', exact: true }).press('End');
  await page
    .getByRole('slider', { name: 'Ask for count every', exact: true })
    .press('Home');
}
async function waitForCheck(page: Page) {
  const input = page.getByRole('textbox', { name: 'Your running count' });
  for (let tick = 0; tick < 60 && !(await input.isVisible()); tick++)
    await page.clock.runFor(500);
  await expect(input).toBeVisible();
  return input;
}
async function countOnTable(page: Page) {
  const ranks = await page
    .locator('.count-felt .playing-card')
    .evaluateAll((cards) =>
      cards.map((card) => card.getAttribute('aria-label')!.split(' ')[0]),
    );
  expect(ranks).not.toContain('Face-down');
  return ranks.reduce(
    (count, rank) =>
      count +
      (['2', '3', '4', '5', '6'].includes(rank)
        ? 1
        : ['10', 'J', 'Q', 'K', 'A'].includes(rank)
          ? -1
          : 0),
    0,
  );
}
test('plays complete hands, pauses for the count, and grades a mistaken and a correct answer', async ({
  page,
}) => {
  await configure(page);
  await page
    .getByRole('button', { name: 'START COUNTING', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Add $25 to bet' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Hit', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Peek count' })).toHaveCount(0);
  const input = await waitForCheck(page);
  await expect(input).toBeFocused();
  const firstCount = await countOnTable(page);
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
  await page.clock.fastForward(60000);
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
  await input.fill('not a number');
  await expect(
    page.getByRole('button', { name: 'Submit', exact: true }),
  ).toBeDisabled();
  await input.fill(String(firstCount + 1));
  await input.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Incorrect', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 1',
  );
  await page.clock.fastForward(60000);
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await waitForCheck(page);
  const secondCount = firstCount + (await countOnTable(page));
  await input.fill(String(secondCount));
  await input.press('Enter');
  await expect(
    page.getByRole('heading', { name: 'CORRECT', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Running Count accuracy')).toContainText(
    '50.0%',
  );
  await page.clock.runFor(1100);
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 03');
});

test('pauses playback in menus and commits settings with OK, Cancel, and Apply', async ({
  page,
}) => {
  await configure(page);
  await page
    .getByRole('button', { name: 'START COUNTING', exact: true })
    .click();
  await page.clock.runFor(1700);
  const cards = () =>
    page
      .locator('.count-felt .playing-card')
      .evaluateAll((cards) =>
        cards.map((card) => card.getAttribute('aria-label')),
      );
  const before = await cards();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.clock.fastForward(60000);
  expect(await cards()).toEqual(before);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const pace = page.getByRole('slider', { name: 'Pace', exact: true });
  const frequency = page.getByRole('slider', {
    name: 'Ask for count every',
    exact: true,
  });
  await pace.press('Home');
  await frequency.press('End');
  await page.clock.fastForward(60000);
  expect(await cards()).toEqual(before);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(pace).toHaveValue('10');
  await expect(frequency).toHaveValue('1');
  await pace.press('Home');
  await frequency.press('End');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Apply', exact: true }),
  ).toBeDisabled();
  await pace.press('End');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.clock.runFor(1900);
  expect(await cards()).toEqual(before);
  await page.clock.runFor(150);
  expect((await cards()).length).toBeGreaterThan(before.length);
  await page.reload();
  await page.getByRole('button', { name: /^COUNTING / }).click();
  await expect(pace).toHaveValue('1');
  await expect(frequency).toHaveValue('10');
});

test('keeps one resume option, clears the count session on switching modes, and resets with a new shoe', async ({
  page,
}) => {
  await configure(page);
  await page
    .getByRole('button', { name: 'START COUNTING', exact: true })
    .click();
  const input = await waitForCheck(page);
  await input.fill('99');
  await input.press('Enter');
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'RESUME GAME', exact: true }),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'RESUME GAME', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Incorrect', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New Session', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 1',
  );
  await page.getByRole('button', { name: 'New Session', exact: true }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
  await expect(page.getByRole('status')).toContainText(
    'Start the running count at 0',
  );
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page.getByRole('button', { name: /^BASIC STRATEGY / }).click();
  await page
    .getByRole('button', { name: 'START BASIC STRATEGY', exact: true })
    .click();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page.getByRole('button', { name: /^COUNTING / }).click();
  await page
    .getByRole('button', { name: 'START COUNTING', exact: true })
    .click();
  await expect(page.locator('.strategy-session-stats')).toContainText(
    'CORRECT 0 / 0',
  );
  await expect(page.getByLabel('Current round')).toHaveText('ROUND 01');
});

for (const width of [320, 375, 1280]) {
  test(`count questions fit the felt and accept keyboard input at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await configure(page);
    await page.screenshot({
      path: testInfo.outputPath('count-setup.png'),
      fullPage: true,
    });
    await page
      .getByRole('button', { name: 'START COUNTING', exact: true })
      .click();
    const input = await waitForCheck(page);
    await expect(input).toBeInViewport();
    const popup = await page
      .getByRole('region', { name: 'Count check', exact: true })
      .boundingBox();
    const felt = await page.locator('.count-felt').boundingBox();
    expect(popup!.x).toBeGreaterThanOrEqual(felt!.x);
    expect(popup!.x + popup!.width).toBeLessThanOrEqual(felt!.x + felt!.width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.screenshot({
      path: testInfo.outputPath('count-question.png'),
      fullPage: true,
    });
    await input.fill('99');
    await input.press('Enter');
    await expect(
      page.getByRole('button', { name: 'Continue', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Current round')).toHaveText('ROUND 02');
  });
}
