import { expect, test } from '@playwright/test';

for (const rules of [
  { rsa: false, seed: 149 },
  { rsa: true, seed: 1867 },
]) {
  test(`Free Play split Aces receive one card and respect RSA=${rules.rsa}`, async ({
    page,
  }) => {
    await page.addInitScript((initialSeed) => {
      if (!localStorage.getItem('blackjack98-v3')) {
        localStorage.setItem(
          'blackjack98-v3',
          JSON.stringify({ rules: { hitSplitAces: true } }),
        );
      }
      let seed = initialSeed;
      Math.random = Object.assign(
        () => {
          seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
          return seed / 4294967296;
        },
        {
          reset: () => {
            seed = initialSeed;
          },
        },
      );
    }, rules.seed);
    await page.goto('/');
    await page.getByRole('button', { name: /^FREE PLAY / }).click();
    const hsa = page.getByRole('checkbox', {
      name: 'Hit split Aces (HSA)',
    });
    const rsa = page.getByRole('checkbox', {
      name: 'Resplit Aces (RSA)',
    });
    await expect(hsa).toHaveCount(0);
    await expect(rsa).toBeEnabled();
    await rsa.setChecked(rules.rsa);
    await page.evaluate(() =>
      (Math.random as typeof Math.random & { reset(): void }).reset(),
    );
    await page.getByRole('button', { name: 'START FREE PLAY' }).click();
    await page.getByRole('button', { name: 'Add $25 to bet' }).click();
    await page.getByRole('button', { name: 'Deal cards' }).click();
    const split = page.getByRole('button', { name: 'Split', exact: true });
    await expect(split).toBeEnabled();
    await split.click();
    const hands = page.locator('.hand-slot');
    await expect(hands).toHaveCount(2);
    if (rules.rsa) {
      await expect(split).toBeEnabled();
      await expect(
        page.getByRole('button', { name: 'Hit', exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: 'Double', exact: true }),
      ).toBeDisabled();
      await split.click();
      await expect(hands).toHaveCount(3);
      await expect(
        page.getByRole('button', { name: 'Deal again' }),
      ).toBeEnabled();
      for (const hand of await hands.all())
        await expect(hand.locator('.playing-card')).toHaveCount(2);
    } else {
      await expect(
        page.getByRole('button', { name: 'Deal again' }),
      ).toBeEnabled();
      for (const hand of await hands.all())
        await expect(hand.locator('.playing-card')).toHaveCount(2);
    }
    await page.reload();
    await page.getByRole('button', { name: /^FREE PLAY / }).click();
    await expect(hsa).toHaveCount(0);
    await expect(rsa).toBeChecked({ checked: rules.rsa });
  });
}
