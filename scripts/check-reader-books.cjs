// Start Expo Web, then: node scripts/check-reader-books.cjs
const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 15000 });

async function main() {
  const { books } = await import('../src/data/books.js');
  const { chapters } = await import('../src/data/chapters.js');
  const chapter = (bookId, number) => chapters.find((item) => item.bookId === bookId && item.number === number);
  const opening = (bookId, number) => chapter(bookId, number).text.split('\n\n')[0];
  const base = process.env.EXPO_WEB_URL || 'http://localhost:8081';
  await fs.mkdir('.expo/verification', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const button = (name) => page.getByRole('button', { name, exact: true });
  const heading = (name) => page.getByRole('heading', { name, exact: true });
  const visit = (path) => page.goto(new URL(path, base).href);
  const scroll = () => page.getByTestId('reader-scroll');
  async function scrollTo(percent) {
    // Text can mount before React Native reports the new chapter's layout.
    await scroll().evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await scroll().evaluate((node, value) => {
      const distance = node.scrollHeight - node.clientHeight;
      if (distance <= 0) throw new Error('Expected a scrollable chapter.');
      node.scrollTop = distance * value / 100;
    }, percent);
    await expect(page.getByText(`${percent}% главы`, { exact: true })).toBeVisible();
  }
  async function readFirst(bookId) {
    await page.getByRole('button', { name: /^Оглавление · 6 глав/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button').filter({ hasText: chapter(bookId, 1).title }).click();
    await expect(heading(chapter(bookId, 1).title)).toBeVisible();
    await expect(scroll()).toContainText(opening(bookId, 1));
  }
  let phase = 'start';
  try {
    for (const book of books) {
      phase = `first two chapters of ${book.id}`;
      console.log(`CHECK: ${phase}`);
      await visit(`/book/${book.id}`);
      await expect(heading(book.title)).toBeVisible({ timeout: 60000 });
      await readFirst(book.id);
      await expect(page).toHaveURL(new RegExp(`/reader/${book.id}`));
      await button('Следующая глава').click();
      await expect(heading(chapter(book.id, 2).title)).toBeVisible();
      await expect(scroll()).toContainText(opening(book.id, 2));
      await expect(scroll()).not.toContainText(opening(book.id, 1));
      await button('Предыдущая глава').click();
      await expect(scroll()).toContainText(opening(book.id, 1));
      if (['book_001', 'book_004', 'book_006', 'book_016', 'book_019'].includes(book.id)) await page.screenshot({ path: `.expo/verification/reader-${book.id}.png`, animations: 'disabled' });
    }

    phase = 'book-to-author-to-another-book navigation without page reload';
    console.log(`CHECK: ${phase}`);
    await visit('/book/book_001'); await readFirst('book_001');
    await button('Следующая глава').click();
    await expect(scroll()).toContainText(opening('book_001', 2));
    await scrollTo(60);
    await button('Назад').click();
    await button('Автор: Арсений Норд').click();
    await page.getByRole('tab', { name: 'Произведения', exact: true }).click();
    await button('Открыть книгу «Стражи Пепельных врат»').click();
    await expect(heading('Стражи Пепельных врат')).toBeVisible(); await readFirst('book_002');
    await expect(scroll()).not.toContainText(opening('book_001', 2));
    await button('Следующая глава').click(); await expect(scroll()).toContainText(opening('book_002', 2));
    await scrollTo(30);
    await button('Назад').click();
    await expect(button('ПРОДОЛЖИТЬ ЧТЕНИЕ')).toBeVisible(); await button('ПРОДОЛЖИТЬ ЧТЕНИЕ').click();
    await expect(scroll()).toContainText(opening('book_002', 2));
    await expect(page.getByText('30% главы', { exact: true })).toBeVisible();
    await expect.poll(() => scroll().evaluate((node) => Math.round(node.scrollTop / (node.scrollHeight - node.clientHeight) * 100))).toBe(30);
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('author-today:state:v1')).progressByBook);
    expect(progress.book_001.chapterId).toBe('book_001_ch_02'); expect(progress.book_001.percent).toBe(60);
    expect(progress.book_002.chapterId).toBe('book_002_ch_02'); expect(progress.book_002.percent).toBe(30);

    phase = 'paid chapter is not rendered';
    console.log(`CHECK: ${phase}`);
    await button('Следующая глава').click();
    await expect(page.getByText('Платная глава', { exact: true })).toBeVisible();
    await expect(scroll()).toHaveCount(0);
    await expect(page.getByText(opening('book_002', 3), { exact: false })).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log('PASS: 20 books have their own text and chapter navigation; cross-book SPA navigation, separate progress/resume, paid text hidden; no browser errors.');
  } catch (error) {
    await page.screenshot({ path: '.expo/verification/reader-books-failure.png', animations: 'disabled' }).catch(() => {});
    console.error(`FAIL at: ${phase}`); if (errors.length) console.error('Browser errors:', errors); throw error;
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
