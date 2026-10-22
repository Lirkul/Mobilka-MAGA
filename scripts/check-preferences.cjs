// Start Expo Web, then: node scripts/check-preferences.cjs
const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 15000 });

async function main() {
  await fs.mkdir('.expo/verification', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const tab = (name) => page.getByRole('tab', { name, exact: true });
  const card = () => page.getByTestId('favorite-genres');
  const genre = (name) => card().getByRole('checkbox', { name, exact: true });
  const button = (name) => page.getByRole('button', { name, exact: true });
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('author-today:state:v1')));
  let phase = 'start';
  const step = (name) => { phase = name; console.log(`CHECK: ${name}`); };
  try {
    step('real preferences tab and full reference layout');
    await page.goto(process.env.EXPO_WEB_URL || 'http://localhost:8081');
    await expect(page.getByText('Популярное', { exact: true })).toBeVisible({ timeout: 60000 });
    await tab('Предпочтения').click();
    await expect(tab('Предпочтения')).toHaveAttribute('aria-selected', 'true');
    await expect(card().getByRole('checkbox')).toHaveCount(20);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: /эрот/i })).toHaveCount(0);
    await expect(genre('Фэнтези')).toBeEnabled();
    await expect(page.getByText('Рекомендуемое', { exact: true })).toBeVisible();
    await page.screenshot({ path: '.expo/verification/preferences-mobile.png', animations: 'disabled' });

    step('selection, ranking and persistence after F5');
    await genre('Детектив').click();
    await expect(genre('Детектив')).toBeChecked();
    await expect.poll(async () => (await saved()).settings.favoriteGenres).toEqual(['detective']);
    await expect(page.getByText('Рекомендуемое', { exact: true })).toBeVisible();
    const recommendations = page.getByRole('heading', { name: 'Рекомендуемое', exact: true }).locator('../..');
    await expect(recommendations.getByRole('button', { name: /^Открыть книгу/ }).first()).toHaveAttribute('aria-label', 'Открыть книгу «Двор теней»');
    await page.reload();
    await tab('Предпочтения').click();
    await expect(genre('Детектив')).toBeChecked();

    step('collapse, fewer genres and selected items retained');
    await button('Меньше жанров').click();
    await expect(card().getByRole('checkbox')).toHaveCount(7);
    await expect(genre('Детектив')).toBeChecked();
    await button('Любимые жанры').click();
    await expect(card().getByRole('checkbox')).toHaveCount(0);
    await button('Любимые жанры').click();
    await button('Больше жанров').click();
    await expect(card().getByRole('checkbox')).toHaveCount(20);

    step('gear, cancel, apply and Escape');
    await button('Настроить любимые жанры').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('checkbox')).toHaveCount(20);
    await expect(dialog.getByRole('checkbox', { name: /эрот/i })).toHaveCount(0);
    await dialog.getByRole('checkbox', { name: 'Фэнтези', exact: true }).click();
    await button('ОТМЕНА').click();
    await expect(genre('Фэнтези')).not.toBeChecked();
    await button('Настроить любимые жанры').click();
    await dialog.getByRole('checkbox', { name: 'Фэнтези', exact: true }).click();
    await button('ВЫБРАТЬ').click();
    await expect(dialog).toHaveCount(0);
    await expect(genre('Фэнтези')).toBeChecked();
    await button('Настроить любимые жанры').click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    step('all-books tab and text search remain separate');
    await tab('Все книги').click();
    await expect(card()).toHaveCount(0);
    await expect(page.getByText('Популярное', { exact: true })).toBeVisible();
    await button('Открыть поиск и подбор книг').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(button('Жанр: Выбрать')).toBeVisible();
    await page.getByRole('textbox', { name: 'Поиск книг, авторов и постов' }).fill('Город под чёрным солнцем');
    await button('Искать книги, авторов и посты').click();
    await expect(page.getByTestId('book-result-book_001')).toBeVisible();
    await button('Назад').click();
    await tab('Предпочтения').click();
    await expect(genre('Детектив')).toBeChecked();
    await expect(genre('Фэнтези')).toBeChecked();

    step('persistent reset, mobile sizes and desktop');
    await button('Сбросить любимые жанры').click();
    await expect.poll(async () => (await saved()).settings.favoriteGenres).toEqual([]);
    await expect(card().getByRole('checkbox', { checked: true })).toHaveCount(0);
    await page.reload();
    await tab('Предпочтения').click();
    await expect(card().getByRole('checkbox', { checked: true })).toHaveCount(0);
    for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      const bounds = await card().boundingBox();
      const chips = await card().getByRole('checkbox').all();
      for (const chip of chips) {
        const box = await chip.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(bounds.x);
        expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      }
      await page.screenshot({ path: `.expo/verification/preferences-${viewport.width}.png`, animations: 'disabled' });
    }
    expect(errors).toEqual([]);
    console.log('PASS: 20 safe genres, independent tab/search, persistence/reset, ranked recommendations, collapse, settings modal, responsive layout; no browser errors.');
  } catch (error) {
    await page.screenshot({ path: '.expo/verification/preferences-failure.png', animations: 'disabled' }).catch(() => {});
    console.error(`FAIL at: ${phase}`);
    if (errors.length) console.error('Browser errors:', errors);
    throw error;
  } finally {
    await browser.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
