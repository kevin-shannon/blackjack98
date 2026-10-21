import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('reveals the running count only while held, including keyboard and lost focus', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.4;
    localStorage.setItem(
      'blackjack98-v3',
      JSON.stringify({ options: { askCount: true, countInterval: 1 } }),
    );
  });
  await start(page);
  const peek = page.getByRole('button', { name: 'Peek count', exact: true });
  const count = page.getByLabel('Running count', { exact: true });
  await expect(count).toHaveText('—');
  await page.getByRole('button', { name: 'DEAL CARDS' }).click();
  await expect(
    page.getByRole('button', { name: 'STAND', exact: true }),
  ).toBeEnabled();
  // Fixed shoe: player 8 + Q, dealer K showing; the hidden 7 is not exposed.
  await peek.scrollIntoViewIfNeeded();
  await peek.hover();
  await page.mouse.down();
  await expect(count).toHaveText('-2');
  await page.mouse.move(1, 1);
  await page.mouse.up();
  await expect(count).toHaveText('—');
  await peek.focus();
  await page.keyboard.down('Space');
  await expect(count).toHaveText('-2');
  await page.keyboard.up('Space');
  await expect(count).toHaveText('—');
  await page.keyboard.down('Enter');
  await expect(count).toHaveText('-2');
  await page.keyboard.up('Enter');
  await expect(count).toHaveText('—');
  await page.keyboard.down('Space');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(count).toHaveText('—');
  await page.keyboard.up('Space');
  await page.getByRole('button', { name: 'STAND', exact: true }).click();
  await expect(page.getByRole('button', { name: 'DEAL AGAIN' })).toBeEnabled();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByText('Ask for count', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Ask every', { exact: true })).toHaveCount(0);
});

test('count peek supports a touch hold and hides on release or cancellation', async ({
  browser,
}) => {
  const context = await browser.newContext({
    isMobile: true,
    hasTouch: true,
    viewport: { width: 375, height: 800 },
  });
  const page = await context.newPage();
  await start(page);
  const peek = page.getByRole('button', { name: 'Peek count', exact: true });
  const count = page.getByLabel('Running count', { exact: true });
  await peek.scrollIntoViewIfNeeded();
  const box = (await peek.boundingBox())!;
  const client = await context.newCDPSession(page);
  const touch = () =>
    client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
  await touch();
  await expect(count).toHaveText('0');
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(count).toHaveText('—');
  await touch();
  await expect(count).toHaveText('0');
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchCancel',
    touchPoints: [],
  });
  await expect(count).toHaveText('—');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await context.close();
});
async function start(page: Page) {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await page.getByRole('button', { name: 'START FREE PLAY' }).click();
}
async function finishRound(page: Page) {
  for (let step = 0; step < 15; step++) {
    if (await page.getByRole('button', { name: 'DEAL AGAIN' }).isVisible())
      return;
    const insurance = page.getByRole('button', {
      name: 'NO THANKS',
      exact: true,
    });
    const stand = page.getByRole('button', { name: 'STAND', exact: true });
    if (await insurance.isVisible()) await insurance.click();
    else if (await stand.isEnabled()) await stand.click();
    else
      await expect(
        page
          .getByRole('button', { name: 'DEAL AGAIN' })
          .or(insurance)
          .or(stand.and(page.locator(':enabled'))),
      ).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'DEAL AGAIN' })).toBeVisible();
}
test('starts, adjusts wagers, completes rounds, and resets without browser errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  await expect(page.getByLabel('Current bankroll')).toContainText('$1,000');
  await page.getByRole('button', { name: '$100', exact: true }).click();
  await expect(page.getByLabel('Bet amount')).toHaveValue('25');
  await page
    .getByRole('button', { name: 'Increase wager by $100', exact: true })
    .click();
  await expect(page.getByLabel('Bet amount')).toHaveValue('125');
  await page.getByLabel('Bet amount').fill('45');
  await page.getByLabel('Bet amount').press('Tab');
  await expect(page.getByLabel('Bet amount')).toHaveValue('45');
  for (let round = 0; round < 3; round++) {
    await page
      .getByRole('button', { name: round ? 'DEAL AGAIN' : 'DEAL CARDS' })
      .click();
    await finishRound(page);
  }
  await page.getByRole('button', { name: 'New Session', exact: true }).click();
  await page.getByRole('button', { name: 'RESET', exact: true }).click();
  await expect(page.getByLabel('Current bankroll')).toContainText('$1,000');
  await expect(page.locator('.status')).toHaveText(
    'Choose your wager to begin.',
  );
  expect(errors).toEqual([]);
});
test('keeps setup controls mounted, discards drafts on Back, and persists committed settings', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  const decks = page.getByLabel('Number of decks');
  await decks.focus();
  await decks.press('Home');
  await decks.press('ArrowRight');
  await expect(decks).toHaveValue('2');
  await expect(decks).toBeFocused();
  await page.getByRole('button', { name: 'BACK' }).click();
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await expect(decks).toHaveValue('6');
  await decks.focus();
  await decks.press('Home');
  await page.getByRole('checkbox', { name: 'Timed hands' }).check();
  await expect(page.getByLabel('Seconds per action')).toBeEnabled();
  await page.getByRole('button', { name: 'START FREE PLAY' }).click();
  await page.reload();
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await expect(decks).toHaveValue('1');
  await expect(
    page.getByRole('checkbox', { name: 'Timed hands' }),
  ).toBeChecked();
});
test('supports keyboard menus and traps dialog focus', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName(
    'Blackjack 98 — Help',
  );
  const ok = page.getByRole('button', { name: 'OK', exact: true });
  await ok.focus();
  await ok.press('Tab');
  await expect(ok).toBeFocused();
  await ok.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveAccessibleName(
    'Blackjack 98 — Main Menu',
  );
  await page.getByRole('button', { name: 'RESUME GAME' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('fits narrow screens and scrolls setup while keeping start accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await start(page);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeInViewport();
  await page.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await page.getByRole('button', { name: 'Game Menu', exact: true }).click();
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await expect(
    page.getByRole('button', { name: 'START FREE PLAY' }),
  ).toBeInViewport();
});
test('captures legacy and React screens for visual review when the original HTML is supplied', async ({
  browser,
}, testInfo) => {
  const legacyPath = process.env.BLACKJACK_LEGACY_HTML;
  test.skip(
    !legacyPath,
    'Set BLACKJACK_LEGACY_HTML to the original v14 file for comparison captures.',
  );
  const legacy = await readFile(legacyPath!, 'utf8');
  for (const width of [1280, 375]) {
    for (const version of ['legacy', 'react']) {
      const page = await browser.newPage({
        viewport: { width, height: width === 375 ? 800 : 1100 },
      });
      await page.addInitScript(() => {
        Math.random = () => 0.4;
      });
      if (version === 'legacy')
        await page.route('**/__legacy.html', (route) =>
          route.fulfill({ contentType: 'text/html', body: legacy }),
        );
      await page.goto(
        version === 'legacy'
          ? 'http://127.0.0.1:5173/__legacy.html'
          : 'http://127.0.0.1:5173/',
      );
      const capture = async (name: string) => {
        await page.screenshot({
          path: testInfo.outputPath(`${version}-${width}-${name}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      };
      await page.getByRole('heading', { name: 'MAIN MENU' }).click();
      await capture('menu');
      await page
        .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
        .click();
      await page.getByRole('heading', { name: 'SET UP YOUR TABLE' }).click();
      await capture('setup');
      await page.getByRole('button', { name: 'START FREE PLAY' }).click();
      await capture('table');
      await page.getByRole('button', { name: 'DEAL CARDS' }).click();
      await expect(
        page.getByRole('button', { name: 'STAND', exact: true }),
      ).toBeEnabled();
      await page.locator('.brandname').click();
      await capture('playing');
      await page.getByRole('button', { name: 'STAND', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'DEAL AGAIN' }),
      ).toBeEnabled();
      await page.locator('.brandname').click();
      await capture('settled');
      await page.close();
    }
  }
});

test('selects stakes presets, locks their sliders, and applies limits to the next session', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  const bankroll = page.getByRole('slider', {
    name: 'Starting bankroll',
    exact: true,
  });
  const min = page.getByRole('slider', { name: 'Min bet', exact: true });
  const max = page.getByRole('slider', { name: 'Max bet', exact: true });
  for (const [label, amounts] of [
    ['Small Fry', ['$500', '$5', '$250']],
    ['Average Joe', ['$2,500', '$25', '$1,000']],
    ['High Roller', ['$10,000', '$100', '$5,000']],
  ] as const) {
    await page.getByRole('radio', { name: label, exact: true }).check();
    for (const [index, slider] of [bankroll, min, max].entries()) {
      await expect(slider).toBeDisabled();
      await expect(slider).toHaveAttribute('aria-valuetext', amounts[index]);
    }
  }
  await page.getByRole('button', { name: 'CLOSE', exact: true }).click();
  await expect(page.getByLabel('Current bankroll')).toContainText('$1,000');
  await page.getByRole('button', { name: 'New Session', exact: true }).click();
  await page.getByRole('button', { name: 'RESET', exact: true }).click();
  await expect(page.getByLabel('Current bankroll')).toContainText('$10,000');
  await expect(page.getByLabel('Bet amount')).toHaveValue('100');
  await page.getByLabel('Bet amount').fill('9999');
  await page.getByLabel('Bet amount').press('Tab');
  await expect(page.getByLabel('Bet amount')).toHaveValue('5000');
  await expect(page.locator('.table-bottomline')).toContainText('MIN $100');
  await page.reload();
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await expect(
    page.getByRole('radio', { name: 'High Roller', exact: true }),
  ).toBeChecked();
});

test('custom stakes use discrete values, persist, and fit three sliders side by side on a phone', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await page.getByRole('radio', { name: 'Average Joe', exact: true }).check();
  await page
    .getByRole('radio', { name: 'Average Joe', exact: true })
    .press('ArrowRight');
  await expect(
    page.getByRole('radio', { name: 'High Roller', exact: true }),
  ).toBeChecked();
  await page.getByRole('radio', { name: 'Custom', exact: true }).check();
  const bankroll = page.getByRole('slider', {
    name: 'Starting bankroll',
    exact: true,
  });
  const min = page.getByRole('slider', { name: 'Min bet', exact: true });
  const max = page.getByRole('slider', { name: 'Max bet', exact: true });
  await bankroll.focus();
  await bankroll.press('Home');
  for (let i = 0; i < 5; i++) await bankroll.press('ArrowRight');
  await expect(bankroll).toHaveAttribute('aria-valuetext', '$750');
  await min.focus();
  await min.press('Home');
  for (let i = 0; i < 4; i++) await min.press('ArrowRight');
  await expect(min).toHaveAttribute('aria-valuetext', '$75');
  await max.focus();
  await max.press('Home');
  for (let i = 0; i < 5; i++) await max.press('ArrowRight');
  await expect(max).toHaveAttribute('aria-valuetext', '$1,500');
  const boxes = await Promise.all(
    [bankroll, min, max].map((slider) => slider.boundingBox()),
  );
  expect(boxes.every((box) => box && Math.abs(box.y - boxes[0]!.y) < 1)).toBe(
    true,
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375);
  await page.screenshot({
    path: testInfo.outputPath('custom-stakes-mobile.png'),
  });
  await page.getByRole('button', { name: 'START FREE PLAY' }).click();
  await expect(page.getByLabel('Current bankroll')).toContainText('$750');
  await expect(page.getByLabel('Bet amount')).toHaveValue('75');
  await page.reload();
  await page
    .getByRole('button', { name: 'FREE PLAY Classic blackjack' })
    .click();
  await expect(
    page.getByRole('radio', { name: 'Custom', exact: true }),
  ).toBeChecked();
  await expect(bankroll).toHaveAttribute('aria-valuetext', '$750');
  await expect(min).toHaveAttribute('aria-valuetext', '$75');
  await expect(max).toHaveAttribute('aria-valuetext', '$1,500');
});
