// Start Expo Web, then: node scripts/check-library.cjs
const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 15000 });

async function main() {
  await fs.mkdir('.expo/verification', { recursive: true });
  const base = process.env.EXPO_WEB_URL || 'http://localhost:8081';
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const button = (name) => page.getByRole('button', { name, exact: true });
  const heading = (name) => page.getByRole('heading', { name, exact: true });
  const rows = () => page.locator('[data-testid^="library-card-"]');
  const screenshot = (name) => page.screenshot({ path: `.expo/verification/library-${name}.png`, animations: 'disabled' });
  const visit = (path) => page.goto(new URL(path, base).href);
  const openShelves = async () => { await page.getByRole('button', { name: /^Выбрать полку:/ }).click(); await expect(page.getByRole('dialog')).toBeVisible(); };
  const selectShelf = async (name) => { await openShelves(); await page.getByRole('radio', { name, exact: true }).click(); await expect(page.getByRole('dialog')).toHaveCount(0); };
  const assertIds = async (ids) => { await expect.poll(() => rows().evaluateAll((nodes) => nodes.map((node) => node.dataset.testid.replace('library-card-', '')).sort())).toEqual([...ids].sort()); };
  let phase = 'start';
  const step = (name) => { phase = name; console.log(`CHECK: ${name}`); };
  try {
    step('reference toolbar and eight shelves with real counters');
    await visit('/library');
    await expect(rows()).toHaveCount(1, { timeout: 60000 });
    await expect(heading('Моя библиотека')).toBeVisible();
    for (const label of ['Поиск в библиотеке', 'Фильтры библиотеки', 'Сортировка библиотеки']) await expect(button(label)).toBeVisible();
    await openShelves();
    await expect(page.getByRole('radio')).toHaveCount(8);
    await expect(page.getByRole('radio', { name: 'Читаю / слушаю', exact: true })).toBeChecked();
    for (const [key, count] of Object.entries({ all: 3, reading: 1, planned: 1, finished: 1, paid: 0, liked: 0, reactions: 0, not_interested: 1 })) await expect(page.getByTestId(`shelf-count-${key}`)).toHaveText(String(count));
    await screenshot('shelves-mobile');
    await page.getByRole('radio', { name: 'Все', exact: true }).click();
    await assertIds(['book_002', 'book_005', 'book_008']);
    await screenshot('all-mobile');
    await selectShelf('Не интересно'); await assertIds(['book_012']);
    await page.reload(); await expect(button('Выбрать полку: Не интересно')).toBeVisible(); await assertIds(['book_012']);
    for (const label of ['Оплачено', 'Понравилось', 'Реакции']) { await selectShelf(label); await expect(page.getByText('На этой полке пока нет книг.', { exact: true })).toBeVisible(); }

    step('library search by title and author, normalization, clearing and empty state');
    await selectShelf('Все');
    await button('Поиск в библиотеке').click();
    const search = page.getByRole('textbox', { name: 'Поиск в моей библиотеке' });
    await search.fill('СТРАЖИ'); await assertIds(['book_002']);
    await search.fill('Арсений'); await assertIds(['book_002']);
    await search.fill('несуществующая книга'); await expect(page.getByText('По выбранным условиям книг не найдено.', { exact: true })).toBeVisible();
    await button('Сбросить поиск и фильтры библиотеки').click(); await assertIds(['book_002', 'book_005', 'book_008']);
    await button('Закрыть поиск в библиотеке').click();

    step('sorting keeps the same books');
    await button('Сортировка библиотеки').click(); await expect(heading('Сортировка')).toBeVisible();
    await page.getByRole('radio', { name: 'По прогрессу чтения', exact: true }).click();
    await expect(rows().first()).toHaveAttribute('data-testid', 'library-card-book_008');
    await button('Сортировка библиотеки').click(); await page.getByRole('radio', { name: 'По названию', exact: true }).click();
    const { books } = await import('../src/data/books.js');
    const expected = books.filter((book) => ['book_002', 'book_005', 'book_008'].includes(book.id)).sort((a, b) => a.title.localeCompare(b.title, 'ru')).map((book) => `library-card-${book.id}`);
    await expect.poll(() => rows().evaluateAll((nodes) => nodes.map((node) => node.dataset.testid))).toEqual(expected);

    step('library AND filters return book_001 and book_019');
    for (const id of ['book_001', 'book_019']) {
      await visit(`/book/${id}`); await button('В библиотеку').click();
      await page.getByRole('radio', { name: 'Читаю', exact: true }).click();
      await expect(button('Статус в библиотеке: Читаю')).toBeVisible();
    }
    await visit('/library?shelf=all'); await expect(rows()).toHaveCount(5);
    await button('Фильтры библиотеки').click();
    await button('Жанр: Выбрать').click();
    await page.getByRole('checkbox', { name: 'Темное фэнтези', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Боевая фантастика', exact: true }).click();
    await button('ВЫБРАТЬ').click();
    await button('Статус: Любой').click(); await page.getByRole('radio', { name: 'В процессе', exact: true }).click();
    await button('Доступ: Любой').click(); await page.getByRole('radio', { name: 'Свободный', exact: true }).click();
    await button('ПРИМЕНИТЬ').click(); await assertIds(['book_001', 'book_019']);
    await openShelves(); await expect(page.getByTestId('shelf-count-all')).toHaveText('5'); await expect(page.getByTestId('shelf-count-reading')).toHaveText('3'); await page.keyboard.press('Escape');
    await button('Фильтры библиотеки').click(); await button('Исключить жанры: Выбрать').click();
    await page.getByRole('checkbox', { name: 'Боевая фантастика', exact: true }).click(); await button('ВЫБРАТЬ').click(); await button('ПРИМЕНИТЬ').click();
    await expect(page.getByText('По выбранным условиям книг не найдено.', { exact: true })).toBeVisible();
    await button('Сбросить поиск и фильтры библиотеки').click(); await expect(rows()).toHaveCount(5);

    step('filter cancel and reset; library stays usable offline');
    await button('Фильтры библиотеки').click(); await button('Формат: Электронная и аудио').click(); await page.getByRole('radio', { name: 'Аудиокнига', exact: true }).click(); await button('ОТМЕНА').click();
    await expect(rows()).toHaveCount(5);
    await visit('/settings'); await page.getByRole('switch', { name: 'Имитация отсутствия интернета' }).click(); await expect(page.getByText('Сеть отключена', { exact: true })).toBeVisible();
    await visit('/library?shelf=all'); await expect(rows()).toHaveCount(5); await openShelves();
    await expect(page.getByTestId('shelf-count-all')).toHaveText('5'); await page.keyboard.press('Escape');

    step('320px and desktop, popup bounds and outside dismissal');
    for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport); await openShelves();
      const box = await page.getByRole('radiogroup', { name: 'Полки библиотеки' }).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(viewport.width); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      await screenshot(`shelves-${viewport.width}`);
      await button('Закрыть список библиотеки').click({ position: { x: 5, y: 5 } }); await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
    console.log('PASS: reference toolbar, 8 shelves/counts, persistent selection, local search/AND filters/sorting, empty/cancel/reset, offline, responsive popup; no browser errors.');
  } catch (error) {
    await screenshot('failure').catch(() => {}); console.error(`FAIL at: ${phase}`); if (errors.length) console.error('Browser errors:', errors); throw error;
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
