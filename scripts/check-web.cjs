// Start Expo Web first, then run: node scripts/check-web.cjs
// Override its URL with EXPO_WEB_URL when using a different port.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

const output = '.expo/verification';
const title = 'Город под чёрным солнцем';

async function main() {
  const { chapters } = await import('../src/data/chapters.js');
  const firstChapter = chapters.find((chapter) => chapter.id === 'book_001_ch_01');
  const secondChapter = chapters.find((chapter) => chapter.id === 'book_001_ch_02');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  let page;
  let phase = 'start';
  const errors = [];
  try {
    page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    const button = (name) => page.getByRole('button', { name, exact: true });
    const visibleText = (text) => page.getByText(text, { exact: true }).filter({ visible: true });
    const rows = () => page.locator('[data-testid^="book-result-"]:visible');
    const result = (id) => page.getByTestId(`book-result-${id}`).filter({ visible: true });
    const screenshot = (name) => page.screenshot({ path: `${output}/${name}.png`, animations: 'disabled' });
    const step = (name) => { phase = name; console.log(`CHECK: ${name}`); };
    const back = async () => { await button('Назад').click(); };
    const openPanel = async (label) => {
      await button(label).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(button('Искать книги, авторов и посты')).toBeVisible();
    };
    const search = async (query) => {
      await page.getByRole('textbox', { name: 'Поиск книг, авторов и постов' }).fill(query);
      await button('Искать книги, авторов и посты').click();
      await expect(visibleText(`Поиск: «${query}»`)).toBeVisible();
    };
    const assertBookIds = async (expected) => {
      await expect.poll(async () => rows().evaluateAll((elements) => elements.map((element) => element.dataset.testid.replace('book-result-', '')).sort())).toEqual([...expected].sort());
      await expect(visibleText(`Найдено книг: ${expected.length}`)).toBeVisible();
    };

    step('home and local PNG covers');
    await page.goto(process.env.EXPO_WEB_URL || 'http://localhost:8081');
    await expect(visibleText('Популярное')).toBeVisible({ timeout: 60000 });
    await expect(visibleText('Горячие новинки')).toBeVisible();
    await expect.poll(() => page.locator('img[src*="mock-covers"]').evaluateAll((images) => images.length >= 6 && images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
    await screenshot('home-mobile');

    step('empty query validation and title search');
    await openPanel('Открыть поиск и подбор книг');
    await button('Искать книги, авторов и посты').click();
    await expect(visibleText('Введите название, имя автора или текст поста.')).toBeVisible();
    await screenshot('search-mobile');
    await search(title);
    await expect(result('book_001')).toBeVisible();
    await expect(rows()).toHaveCount(1);
    await result('book_001').click();
    await expect(page).toHaveURL(/\/book\/book_001/);
    await expect(visibleText(title)).toBeVisible();
    await expect(button('В библиотеку')).toBeVisible();
    await screenshot('book-mobile');

    step('book to reader and next chapter');
    await button('ЧИТАТЬ').click();
    await expect(page).toHaveURL(/\/reader\/book_001/);
    await expect(visibleText(firstChapter.title)).toBeVisible();
    await expect(page.getByText(firstChapter.text.split('\n\n')[0], { exact: false }).filter({ visible: true })).toBeVisible();
    await button('Следующая глава').click();
    await expect(visibleText(secondChapter.title)).toBeVisible();
    await screenshot('reader-mobile');
    await back();
    await expect(button('ПРОДОЛЖИТЬ ЧТЕНИЕ')).toBeVisible();
    await back();
    await expect(visibleText('Результаты поиска')).toBeVisible();

    step('new author query updates the existing results screen');
    await openPanel('НОВЫЙ ПОИСК');
    await search('Арсений');
    await expect(page.getByTestId('author-result-author_01').filter({ visible: true })).toBeVisible();
    await page.getByTestId('author-result-author_01').filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/author\/author_01/);
    await expect(visibleText('Основная информация')).toBeVisible();
    await expect(visibleText('Арсений Норд').first()).toBeVisible();
    await expect(page.locator('img[src*="mock-avatars"]:visible')).toHaveCount(1);
    await screenshot('author-mobile');
    await back();

    step('post search and opening a post');
    await openPanel('НОВЫЙ ПОИСК');
    await search('ноябрь');
    await page.getByTestId('post-result-post_001').filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/post\/post_001/);
    await expect(visibleText('Новая глава и планы на ноябрь')).toBeVisible();
    await expect(button('Открыть автора Арсений Норд')).toBeVisible();
    await screenshot('post-mobile');
    await back();

    step('AND discovery through UI: two genres, ongoing, free');
    await openPanel('НОВЫЙ ПОИСК');
    await button('СБРОСИТЬ ВСЁ').click();
    await button('Жанр: Выбрать').click();
    await page.getByRole('checkbox', { name: 'Темное фэнтези', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Боевая фантастика', exact: true }).click();
    await button('ВЫБРАТЬ').click();
    await expect(button('Жанр: Темное фэнтези (+1)')).toBeVisible();
    await button('Дополнительные фильтры').click();
    await button('Статус: Любой').click();
    await page.getByRole('radio', { name: 'В процессе', exact: true }).click();
    await button('Доступ: Любой').click();
    await page.getByRole('radio', { name: 'Свободный', exact: true }).click();
    await button('ПОДОБРАТЬ').click();
    await assertBookIds(['book_001', 'book_019']);
    await screenshot('discovery-two-genres');

    step('library modal updates status and hides not interested from same discovery');
    await result('book_001').click();
    await page.getByRole('button', { name: /^(В библиотеку|Статус в библиотеке: .*)$/ }).filter({ visible: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(4);
    await page.getByRole('radio', { name: 'Читаю', exact: true }).click();
    await expect(button('Статус в библиотеке: Читаю')).toBeVisible();
    await back();
    await expect(result('book_001').getByText('Читаю', { exact: true })).toBeVisible();
    await result('book_001').click();
    await button('Статус в библиотеке: Читаю').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('radio', { name: 'Не интересно', exact: true }).click();
    await expect(button('Статус в библиотеке: Не интересно')).toBeVisible();
    await screenshot('book-not-interested');
    await back();
    await assertBookIds(['book_019']);
    await expect(result('book_001')).toHaveCount(0);

    step('edit existing filters and reset without a stale results screen');
    await openPanel('ФИЛЬТРЫ');
    await expect(button('Жанр: Темное фэнтези (+1)')).toBeVisible();
    await button('Дополнительные фильтры').click();
    await expect(button('Статус: В процессе')).toBeVisible();
    await expect(button('Доступ: Свободный')).toBeVisible();
    await button('Статус: В процессе').click();
    await page.getByRole('radio', { name: 'Завершено', exact: true }).click();
    await button('ПОДОБРАТЬ').click();
    await assertBookIds([]);
    await expect(visibleText('К сожалению, по вашему запросу ничего не найдено')).toBeVisible();
    await openPanel('ФИЛЬТРЫ');
    await button('СБРОСИТЬ ВСЁ').click();
    await expect(page.getByRole('textbox')).toHaveValue('');
    await expect(button('Жанр: Выбрать')).toBeVisible();
    await search('нет-такой-книги');
    await expect(visibleText('К сожалению, по вашему запросу ничего не найдено')).toBeVisible();

    step('small mobile, Escape, and desktop');
    await back();
    await expect(visibleText('Популярное')).toBeVisible();
    await page.setViewportSize({ width: 320, height: 568 });
    await openPanel('Открыть поиск и подбор книг');
    await screenshot('search-small');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await screenshot('home-desktop');
    expect(errors).toEqual([]);
    console.log('PASS: local covers; title, author, and post search; AND filters; filter editing; library status; exclusion; reader; mobile/desktop; no browser errors.');
  } catch (error) {
    if (page) await page.screenshot({ path: `${output}/failure.png`, animations: 'disabled' }).catch(() => {});
    console.error(`FAIL at: ${phase}`);
    if (errors.length) console.error('Browser errors:', errors);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
