// Reuse the running Expo Web server; EXPO_WEB_URL selects its port.
const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 15000 });

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const base = process.env.EXPO_WEB_URL || 'http://localhost:8085';
  const out = '.expo/verification/dz2-after'; await fs.mkdir(out, { recursive: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const button = name => page.getByRole('button', { name, exact: true });
  const check = name => page.getByRole('checkbox', { name, exact: true });
  const rows = () => page.locator('[data-testid^="book-result-"]');
  const shot = name => page.screenshot({ path: `${out}/${name}.png`, animations: 'disabled' });
  const ids = async expected => expect.poll(() => rows().evaluateAll(nodes => nodes.map(n => n.dataset.testid.replace('book-result-', '')).sort())).toEqual(expected);
  const images = async () => expect.poll(() => page.locator('img').evaluateAll(nodes => nodes.length > 0 && nodes.every(n => n.complete && n.naturalWidth > 0))).toBe(true);
  let phase = 'start';
  try {
    phase = 'all filter dialogs, draft cancel, Escape and outside dismissal';
    await page.goto(base); await expect(page.getByText('Популярное', { exact: true })).toBeVisible({ timeout: 60000 });
    await button('Открыть поиск и подбор книг').click(); await shot('panel');
    await button('Жанр: Выбрать').click();
    await check('Темное фэнтези').click(); await check('Боевая фантастика').click(); await shot('genres');
    await button('ОТМЕНА').click();
    await expect(button('Жанр: Выбрать')).toBeVisible();
    await button('Жанр: Выбрать').click(); await check('Темное фэнтези').click(); await check('Боевая фантастика').click(); await button('ВЫБРАТЬ').click();
    await button('Формат: Электронная и аудио').click(); await shot('format');
    await page.getByRole('radio', { name: 'Электронная книга', exact: true }).click();
    await button('Сортировать: По популярности').click(); await shot('sort'); await page.keyboard.press('Escape');
    await expect(button('Сортировать: По популярности')).toBeVisible();
    await button('Исключить жанры: Выбрать').click(); await check('Фэнтези').click(); await button('Закрыть выбор фильтра').click({ position: { x: 4, y: 4 } });
    await expect(button('Исключить жанры: Выбрать')).toBeVisible();
    await button('Дополнительные фильтры').click(); await shot('additional');
    const extra = ['Статус: Любой', 'Форма: Любая', 'Статус цикла: Не важно', 'Порядок в цикле: Любой', 'Скачивание: Не важно', 'Доступ: Любой', 'Последнее обновление: Не важно', 'Опубликовано: Не важно', 'Прочитанное: Показывать', 'С помощью нейросети: Не важно', 'Теги: Выбрать'];
    for (const label of extra) { await button(label).click(); await expect(page.getByRole(label.startsWith('Теги') ? 'checkbox' : 'radio').first()).toBeVisible(); await page.keyboard.press('Escape'); await expect(button(label)).toBeVisible(); }
    await button('Статус: Любой').click(); await page.getByRole('radio', { name: 'В процессе', exact: true }).click();
    await button('Доступ: Любой').click(); await page.getByRole('radio', { name: 'Свободный', exact: true }).click();
    await button('ПОДОБРАТЬ').click(); await ids(['book_001', 'book_019']); await images(); await shot('results');

    phase = 'result actions, book tabs, contents, reader settings, and Back';
    await button('Изменить статус книги «Город под чёрным солнцем»').click();
    await page.getByRole('radio', { name: 'Читаю', exact: true }).click(); await ids(['book_001', 'book_019']);
    await button('Открыть произведение «Город под чёрным солнцем»').click();
    await expect(page.getByRole('heading', { name: 'Город под чёрным солнцем', exact: true })).toBeVisible(); await images(); await shot('book');
    await button('Отзывы о произведении').click(); await expect(page.getByRole('tab', { name: 'Отзывы', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Тэги', exact: true }).click(); await expect(page.getByRole('tab', { name: 'Тэги', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'О книге', exact: true }).click();
    await page.getByRole('button', { name: /^Оглавление · 6 глав/ }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape');
    await button('ЧИТАТЬ').click(); await expect(page.getByTestId('reader-scroll')).toBeVisible(); await shot('reader');
    await button('Настройки чтения').click(); await shot('reader-settings'); await button('Увеличить шрифт').click(); await page.getByRole('radio', { name: 'Тёмная', exact: true }).click(); await button('ГОТОВО').click();
    await expect(button('Закрыть настройки чтения')).toHaveCount(0);
    await button('Открыть оглавление').click(); await expect(page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Оглавление', exact: true }) })).toBeVisible(); await page.keyboard.press('Escape'); await expect(button('Закрыть оглавление')).toHaveCount(0);
    await button('Назад').click(); await expect(button('ПРОДОЛЖИТЬ ЧТЕНИЕ')).toBeVisible(); await button('Назад').click(); await ids(['book_001', 'book_019']);

    phase = 'independent title search by Enter and by search button';
    await button('Открыть поиск и подбор книг').click();
    await page.getByRole('textbox', { name: 'Поиск книг, авторов и постов' }).fill('Двор теней');
    await page.getByRole('textbox', { name: 'Поиск книг, авторов и постов' }).press('Enter');
    await expect(page.getByText('Поиск: «Двор теней»', { exact: true })).toBeVisible(); await ids(['book_016']);
    await button('НОВЫЙ ПОИСК').click(); await page.getByRole('textbox', { name: 'Поиск книг, авторов и постов' }).fill('Город под чёрным солнцем'); await button('Искать книги, авторов и посты').click(); await ids(['book_001']);

    phase = '320/393/1440 layouts and library popup';
    for (const width of [320, 393, 1440]) {
      await page.setViewportSize({ width, height: 852 }); await page.goto(new URL('/results?mode=discover', base).href); await expect(rows().first()).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      for (const action of ['Назад', 'Открыть меню', 'Открыть поиск и подбор книг', 'Открыть меню пользователя', 'ФИЛЬТРЫ', 'Открыть параметры подбора', 'Обновить результаты']) { const box = await button(action).boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width + 1); }
      await images(); await shot(`results-${width}`); await button('ФИЛЬТРЫ').click(); await button('Формат: Электронная и аудио').click(); await shot(`format-${width}`); await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.goto(new URL('/library?shelf=all', base).href); await expect(page.getByRole('heading', { name: 'Моя библиотека', exact: true })).toBeVisible(); await images(); await shot(`library-${width}`);
      await page.getByRole('button', { name: /^Выбрать полку:/ }).click(); await expect(page.getByRole('radio')).toHaveCount(8); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
    console.log('PASS: all filter dialogs, draft/cancel/Back, exact AND pair, independent title search, result actions, book/reader navigation, responsive headers and library; no browser errors.');
  } catch (error) { await shot('failure').catch(() => {}); console.error(`FAIL at: ${phase}`); throw error; }
  finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
