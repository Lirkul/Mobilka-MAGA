const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 15000 });

async function main() {
  const { chapters } = await import('../src/data/chapters.js');
  const secondChapter = chapters.find(chapter => chapter.id === 'book_001_ch_02');
  const base = process.env.EXPO_WEB_URL || 'http://localhost:8085';
  const out = '.expo/verification/video-scenario'; await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const button = name => page.getByRole('button', { name, exact: true });
  const radio = name => page.getByRole('radio', { name, exact: true });
  const check = name => page.getByRole('checkbox', { name, exact: true });
  const shot = name => page.screenshot({ path: `${out}/${name}.png`, animations: 'disabled' });
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('author-today:state:v1')));
  const scroll = () => page.getByTestId('reader-scroll');
  const actualPercent = () => scroll().evaluate(node => Math.round(node.scrollTop / (node.scrollHeight - node.clientHeight) * 100));
  async function drag(testId, fraction) {
    const node = page.getByTestId(testId); await node.scrollIntoViewIfNeeded(); const box = await node.boundingBox();
    await page.mouse.move(box.x + 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2, { steps: 8 }); await page.mouse.up();
  }
  async function trace(testId, property, action) {
    await page.evaluate(({ testId, property }) => {
      window.__motion = { done: false, samples: [] }; const start = performance.now();
      const sample = () => { const node = document.querySelector(`[data-testid="${testId}"]`); if (node) window.__motion.samples.push(node.getBoundingClientRect()[property]); if (performance.now() - start < 550) requestAnimationFrame(sample); else window.__motion.done = true; }; requestAnimationFrame(sample);
    }, { testId, property });
    await action(); await page.waitForFunction(() => window.__motion.done);
    const values = await page.evaluate(() => window.__motion.samples);
    expect(values.length).toBeGreaterThan(3); expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(15);
    console.log(`MOTION ${testId}: ${Math.min(...values).toFixed(1)} .. ${Math.max(...values).toFixed(1)}`);
  }
  let phase = 'start';
  try {
    await page.goto(base); await expect(page.getByText('Популярное', { exact: true })).toBeVisible({ timeout: 60000 });
    phase = 'drawer, bottom panel, and expansion movement';
    await trace('left-drawer', 'x', () => button('Открыть меню').click()); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    await trace('search-panel', 'y', () => button('Открыть поиск и подбор книг').click());
    await trace('additional-filter-fields', 'height', () => button('Дополнительные фильтры').click());
    await button('Дополнительные фильтры').click();

    phase = 'genre parent selection from the recorded video';
    await button('Жанр: Выбрать').click(); await check('Фантастика').click();
    await expect(check('Боевая фантастика')).toBeChecked(); await expect(check('Боевая фантастика')).toBeDisabled();
    await expect(check('Научная фантастика')).toBeChecked(); await shot('genre-parent'); await button('ВЫБРАТЬ').click();
    await expect(button('Жанр: Фантастика')).toBeVisible(); await button('ПОДОБРАТЬ').click();
    await expect(page.locator('[data-testid^="book-result-"]').first()).toBeVisible();
    expect(JSON.parse(new URL(page.url()).searchParams.get('filters')).genres).toEqual(['Фантастика']);

    phase = 'independent included genres remain AND';
    await button('ФИЛЬТРЫ').click(); await button('Жанр: Фантастика').click(); await check('Фантастика').click(); await check('Темное фэнтези').click(); await check('Боевая фантастика').click(); await button('ВЫБРАТЬ').click();
    await button('Дополнительные фильтры').click(); await button('Статус: Любой').click(); await radio('В процессе').click(); await button('Доступ: Любой').click(); await radio('Свободный').click(); await button('ПОДОБРАТЬ').click();
    await expect.poll(() => page.locator('[data-testid^="book-result-"]').evaluateAll(nodes => nodes.map(node => node.dataset.testid))).toEqual(['book-result-book_019', 'book-result-book_001']);
    await shot('results'); await button('Открыть книгу «Город под чёрным солнцем»').click();

    phase = 'book, status bottom sheet and annotation';
    await expect(button('В библиотеку')).toBeVisible(); await trace('library-status-panel', 'y', () => button('В библиотеку').click()); await shot('status'); await radio('Читаю').click();
    await expect(button('Статус в библиотеке: Читаю')).toBeVisible();
    await button('Развернуть аннотацию').click(); await expect(button('Свернуть аннотацию')).toBeVisible(); await button('Свернуть аннотацию').click();
    await button('Статистика произведения').click(); await expect(page.getByRole('heading', { name: 'Статистика произведения', exact: true })).toBeVisible(); await button('ЗАКРЫТЬ').click();
    await shot('book'); await button('ЧИТАТЬ').click(); await expect(page.getByTestId('reader-loading')).toBeVisible(); await button('Следующая глава').click(); await expect(page.getByRole('heading', { name: secondChapter.title, exact: true })).toBeVisible();
    await drag('reader-position', 0.6); await expect.poll(actualPercent).toBe(60); await expect(page.getByText('26% книги', { exact: true })).toBeVisible();

    phase = 'reader brightness, five backgrounds, fonts and modes';
    await trace('reader-settings-panel', 'y', () => button('Настройки чтения').click()); await shot('reader-settings');
    for (const label of ['Белая', 'Светлая', 'Сепия', 'Тёмная', 'Чёрная']) { await radio(label).click(); await expect(radio(label)).toBeChecked(); }
    await radio('Сепия').click(); await expect(page.getByTestId('reader-paper')).toHaveCSS('background-color', 'rgb(209, 200, 164)');
    await drag('reader-brightness', 0.3); await expect.poll(async () => (await saved()).settings.reader.brightness).toBe(30); await expect(page.getByTestId('reader-dimmer')).toHaveCSS('opacity', '0.455');
    await page.getByRole('switch', { name: 'Регулировать яркость жестами', exact: true }).click();
    await button('Выбрать шрифт').click(); await radio('С засечками').click();
    await radio('По левому краю').click(); await radio('Постранично').click(); await expect(radio('Постранично')).toBeChecked(); await button('ГОТОВО').click();
    await expect(page.getByTestId('reader-active-page-content')).toBeVisible();
    await expect(scroll()).toHaveCount(0);
    if (await button('Предыдущая страница').isEnabled()) { await button('Предыдущая страница').click(); await expect(page.getByText(/^1 из \d+$/)).toBeVisible(); }
    await button('Настройки чтения').click(); await radio('Прокрутка').click();
    await button('Увеличить шрифт').click(); await expect(page.getByText('Размер шрифта: 20', { exact: true })).toBeVisible();
    await button('Дополнительные настройки чтения').click(); await drag('reader-brightness', 0.5); await button('ГОТОВО').click(); await expect(button('Закрыть настройки чтения')).toHaveCount(0);
    await expect.poll(async () => { const reader = (await saved()).settings.reader; return { font: reader.font, alignment: reader.alignment, readingMode: reader.readingMode, fontSize: reader.fontSize }; }).toEqual({ font: 'serif', alignment: 'left', readingMode: 'scroll', fontSize: 20 });
    await expect(scroll().getByText(secondChapter.text.split('\n\n')[0], { exact: false })).toHaveCSS('text-align', 'left');

    phase = 'left-edge brightness gesture, fullscreen, and durable seek';
    const gesture = await page.getByTestId('reader-brightness-gesture').boundingBox();
    await page.mouse.move(gesture.x + 10, gesture.y + gesture.height * 0.65); await page.mouse.down(); await page.mouse.move(gesture.x + 10, gesture.y + gesture.height * 0.4, { steps: 8 }); await page.mouse.up();
    await expect.poll(async () => (await saved()).settings.reader.brightness).toBeGreaterThan(50);
    await scroll().click({ position: { x: 180, y: 120 } }); await expect(button('Назад')).toHaveCount(0); await expect(page.getByTestId('reader-position')).toHaveCount(0); await shot('fullscreen');
    await scroll().click({ position: { x: 180, y: 120 } }); await expect(button('Назад')).toBeVisible(); await drag('reader-position', 0.6); await expect.poll(actualPercent).toBe(60);
    await expect.poll(async () => (await saved()).progressByBook.book_001.percent).toBe(60);
    await page.reload(); await expect(page.getByRole('heading', { name: secondChapter.title, exact: true })).toBeVisible(); await expect.poll(actualPercent).toBe(60); await shot('reader-restored');
    await button('Настройки чтения').click(); await expect(radio('Сепия')).toBeChecked(); await expect(radio('По левому краю')).toBeChecked(); await expect(page.getByText('С засечками', { exact: true })).toBeVisible(); await button('ГОТОВО').click();
    expect(errors).toEqual([]);
    console.log('PASS: recorded genre parent flow, AND leaves, real panel motion, status sheet, seeking, five themes, font/alignment/mode, brightness gesture, fullscreen, and F5 preserve chapter/scroll/settings.');
  } catch (error) { await shot('failure').catch(() => {}); console.error(`FAIL at ${phase}`); throw error; }
  finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
