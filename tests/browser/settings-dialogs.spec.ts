import { expect, test } from '@playwright/test';

test('Free Play orders rules by frequency and preserves saved choices over the new defaults', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto('/');
  await page.getByRole('button', { name: /^FREE PLAY / }).click();
  const rules = page.locator('.setup-modal .win-group').first();
  const checkboxes = rules.getByRole('checkbox');
  await expect(checkboxes).toHaveCount(4);
  const names = await rules
    .locator('.checkbox-copy strong')
    .evaluateAll((elements) =>
      elements.map((element) => element.firstChild!.textContent),
    );
  expect(names).toEqual([
    'Double after split (DAS)',
    'Dealer hits soft 17 (H17)',
    'Resplit Aces (RSA)',
    'Late surrender (LS)',
  ]);
  await expect(rules.locator('.rule-frequency')).toHaveText([
    'Very common',
    'Fairly common',
    'Uncommon',
    'Uncommon',
  ]);
  for (const [index, checked] of [true, true, false, false].entries())
    await expect(checkboxes.nth(index)).toBeChecked({ checked });
  await page.getByRole('checkbox', { name: 'Dealer hits soft 17' }).uncheck();
  await page.getByRole('button', { name: 'START FREE PLAY' }).click();
  await page.reload();
  await page.getByRole('button', { name: /^FREE PLAY / }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Dealer hits soft 17' }),
  ).not.toBeChecked();
});

for (const mode of ['BASIC STRATEGY', 'DEVIATIONS', 'FREE PLAY']) {
  test(`${mode}: OK, Cancel, and Apply commit only pending settings`, async ({
    page,
  }, testInfo) => {
    if (mode === 'FREE PLAY')
      await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: new RegExp(`^${mode} `) }).click();
    await page.getByRole('button', { name: `START ${mode}` }).click();
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const timed = dialog.getByRole('checkbox', { name: 'Timed hands' });
    const apply = dialog.getByRole('button', { name: 'Apply', exact: true });
    const persisted = () => page.evaluate(() => JSON.stringify(localStorage));
    const original = await persisted();
    await expect(apply).toBeDisabled();
    await timed.check();
    await expect(apply).toBeEnabled();
    expect(await persisted()).toBe(original);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(timed).not.toBeChecked();
    await timed.check();
    await apply.click();
    await expect(dialog).toBeVisible();
    await expect(apply).toBeDisabled();
    expect(await persisted()).not.toBe(original);
    const applied = await persisted();
    await timed.uncheck();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await persisted()).toBe(applied);
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(timed).toBeChecked();
    await timed.uncheck();
    await dialog.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(timed).not.toBeChecked();
    await expect(apply).toBeDisabled();
    await timed.check();
    await timed.press('Escape');
    await expect(dialog).toHaveCount(0);
    await page.getByRole('button', { name: 'Options', exact: true }).click();
    await expect(timed).not.toBeChecked();
    await page.screenshot({
      path: testInfo.outputPath('settings-actions.png'),
      fullPage: true,
    });
    const buttons = dialog.locator('.settings-actions .action-btn');
    const boxes = await Promise.all(
      (await buttons.all()).map((button) => button.boundingBox()),
    );
    expect(boxes).toHaveLength(3);
    expect(boxes[0]!.y).toBe(boxes[1]!.y);
    expect(boxes[1]!.y).toBe(boxes[2]!.y);
    expect(boxes[2]!.width).toBeLessThanOrEqual(76);
    expect(boxes[0]!.height).toBe(mode === 'FREE PLAY' ? 44 : 28);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page
      .getByRole('button', { name: 'Table Rules', exact: true })
      .click();
    const rule =
      mode === 'DEVIATIONS'
        ? dialog.getByRole('radio', { name: 'H17', exact: false })
        : dialog.getByRole('checkbox', { name: 'Dealer hits soft 17' });
    const beforeRules = await persisted();
    const initiallyChecked = await rule.isChecked();
    await rule.setChecked(!initiallyChecked);
    expect(await persisted()).toBe(beforeRules);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page
      .getByRole('button', { name: 'Table Rules', exact: true })
      .click();
    await expect(rule).toBeChecked({ checked: initiallyChecked });
    await rule.setChecked(!initiallyChecked);
    await apply.click();
    await expect(dialog).toBeVisible();
    await expect(apply).toBeDisabled();
    expect(await persisted()).not.toBe(beforeRules);
    await dialog.getByRole('button', { name: 'OK', exact: true }).click();
    await page
      .getByRole('button', { name: 'Table Rules', exact: true })
      .click();
    await expect(rule).toBeChecked({ checked: !initiallyChecked });
  });
}
