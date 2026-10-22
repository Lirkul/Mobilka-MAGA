// Start Expo Web, then: node scripts/check-menus.cjs
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
  const button = (name) => page.getByRole('button', { name, exact: true });
  const heading = (name) => page.getByRole('heading', { name, exact: true });
  const shot = (name) => page.screenshot({ path: `.expo/verification/menus-${name}.png`, animations: 'disabled' });
  const left = async () => { await expect.poll(async () => await button('Открыть меню').count() + await button('Назад').count()).toBeGreaterThan(0); if (!await button('Открыть меню').count()) await button('Назад').click(); await button('Открыть меню').click(); await expect(page.getByTestId('left-drawer')).toBeVisible(); await expect(page.getByRole('dialog')).toBeVisible(); };
  const right = async () => { await expect.poll(async () => await button('Открыть меню пользователя').count() + await button('Назад').count()).toBeGreaterThan(0); if (!await button('Открыть меню пользователя').count()) await button('Назад').click(); await button('Открыть меню пользователя').click(); await expect(page.getByTestId('right-drawer')).toBeVisible(); await expect(page.getByRole('dialog')).toBeVisible(); };
  const shelf = async (label) => { await page.getByRole('button', { name: /^Выбрать полку:/ }).click(); await page.getByRole('radio', { name: label, exact: true }).click(); };
  let phase = 'start';
  const step = (name) => { phase = name; console.log(`CHECK: ${name}`); };
  try {
    step('left drawer layout, books and community branches');
    await page.goto(process.env.EXPO_WEB_URL || 'http://localhost:8081');
    await expect(heading('Популярное')).toBeVisible({ timeout: 60000 });
    await left();
    await expect(button('Книги')).toHaveAttribute('aria-expanded', 'false');
    await expect(button('Популярные')).toHaveCount(0);
    const bounds = await page.getByTestId('left-drawer').boundingBox();
    expect(bounds.x).toBe(0);
    expect(Math.round(bounds.width)).toBe(281);
    await shot('left-collapsed');
    await button('Книги').click();
    await expect(button('Книги')).toHaveAttribute('aria-expanded', 'true');
    for (const label of ['Популярные', 'Новинки', 'Скидки', 'Рекомендуемые', 'Подборки', 'Подборки АТ', 'Полный список жанров', 'Расширенный поиск']) await expect(button(label)).toBeVisible();
    await shot('left-books');
    await button('Сообщество').click();
    for (const label of ['ТОП авторов', 'ТОП пользователей', 'Иллюстрации', 'Форум АТ 2026']) await expect(button(label)).toBeVisible();
    await button('ТОП авторов').click();
    await expect(heading('ТОП авторов')).toBeVisible();
    await button('Назад к меню').click();
    await button('Сообщество').click();
    await button('Книги').click();
    await button('Общие настройки').scrollIntoViewIfNeeded();
    await shot('left-bottom');
    await button('Общие настройки').click();
    await expect(heading('Настройки')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    step('working audio and genre navigation');
    await left(); await button('Аудиокниги').click();
    await expect(heading('Подбор книг')).toBeVisible();
    await expect(page.locator('[data-testid^="book-result-"]:visible').first()).toBeVisible();
    const { books } = await import('../src/data/books.js');
    await expect(page.locator('[data-testid^="book-result-"]:visible')).toHaveCount(books.filter((book) => book.formats.includes('audio') && book.id !== 'book_012').length);
    await left(); await button('Книги').click(); await button('Полный список жанров').click();
    await expect(page.getByRole('checkbox', { name: 'Темное фэнтези', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /эрот/i })).toHaveCount(0);
    await button('ОТМЕНА').click();
    await expect(button('Искать книги, авторов и посты')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await left(); await button('Рекомендуемые').click();
    await expect(page.getByRole('tab', { name: 'Предпочтения', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('favorite-genres')).toBeVisible();

    step('right account drawer and Bespalko Egor');
    await right();
    await expect(page.getByText('Bespalko Egor', { exact: true })).toBeVisible();
    const accountBounds = await page.getByTestId('right-drawer').boundingBox();
    expect(Math.round(accountBounds.x + accountBounds.width)).toBe(393);
    await shot('user');
    for (const label of ['Моя библиотека', 'Приватность', 'Игнор-лист', 'Кошелек', 'Добавить', 'Мои подборки', 'Мой профиль', 'Учетная запись', 'Выйти']) await expect(button(label)).toBeVisible();
    await button('Кошелек').click();
    await expect(page.getByText('Баланс: 0 ₽', { exact: false })).toBeVisible();
    await button('Назад к меню').click();
    await button('Добавить').click(); await expect(button('Произведение')).toBeVisible(); await button('Добавить').click();
    await button('Учетная запись').click(); await expect(button('Bespalko Egor')).toBeVisible(); await button('Учетная запись').click();
    await button('Моя библиотека').click();

    step('library card, existing progress and direct reader');
    await expect(heading('Моя библиотека')).toBeVisible();
    const card = page.getByTestId('library-card-book_002');
    await expect(card).toBeVisible();
    await expect(card.getByText('24%', { exact: true })).toBeVisible();
    await expect(card.getByText('Пепельные врата #1', { exact: true })).toBeVisible();
    await expect(card.getByText('169 ₽', { exact: true })).toBeVisible();
    await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '24');
    await shot('library');
    await button('Доступ без сети: «Стражи Пепельных врат»').click();
    await expect(heading('Доступ без сети')).toBeVisible(); await button('ПОНЯТНО').click();
    await button('Читать «Стражи Пепельных врат»').click();
    await expect(heading('Глава 2. Тайный знак')).toBeVisible();
    await expect(page.getByText('24% главы', { exact: true })).toBeVisible();
    await button('Назад').click();
    await expect(card).toBeVisible();

    step('status change inside library and persistence');
    await button('Изменить статус книги «Стражи Пепельных врат»').click();
    await page.getByRole('radio', { name: 'Прочту позже', exact: true }).click();
    await expect(card).toHaveCount(0);
    await shelf('Отложено');
    await expect(card).toBeVisible();
    await page.reload();
    await shelf('Отложено');
    await expect(card).toBeVisible();
    await button('Изменить статус книги «Стражи Пепельных врат»').click();
    await page.getByRole('radio', { name: 'Читаю', exact: true }).click();
    await shelf('Читаю / слушаю');
    await expect(card).toBeVisible();

    step('demo sign-out preserves saved library and can sign back in');
    await right(); await button('Выйти').click(); await expect(heading('Выйти из аккаунта?')).toBeVisible(); await button('Выйти').click();
    await expect(page.getByText('Гость', { exact: true })).toBeVisible();
    await button('Закрыть меню пользователя').click({ position: { x: 8, y: 100 } });
    await page.reload(); await right();
    await expect(page.getByText('Гость', { exact: true })).toBeVisible();
    await button('Войти как Bespalko Egor').click();
    await expect(page.getByText('Bespalko Egor', { exact: true })).toBeVisible();
    await button('Моя библиотека').click();
    await expect(card).toBeVisible();

    step('small mobile and desktop bounds, Escape');
    for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport); await left(); await shot(`left-${viewport.width}`);
      await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
      await right(); await shot(`user-${viewport.width}`);
      await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
      await right(); await button('Моя библиотека').click(); await expect(card).toBeVisible();
      const box = await card.boundingBox(); expect(box.width).toBeLessThanOrEqual(Math.min(viewport.width, 480));
    }
    expect(errors).toEqual([]);
    console.log('PASS: left/right reference menus, branches, catalog/genres/recommendations, Bespalko Egor, library card/status/reader/progress, persistent demo sign-out, responsive layout; no browser errors.');
  } catch (error) {
    await shot('failure').catch(() => {}); console.error(`FAIL at: ${phase}`);
    if (errors.length) console.error('Browser errors:', errors);
    throw error;
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
