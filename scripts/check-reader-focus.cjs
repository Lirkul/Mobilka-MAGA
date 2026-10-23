// Start Expo Web, then: node scripts/check-reader-focus.cjs
const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 15000 });

async function main() {
  const { books } = await import('../src/data/books.js');
  const { chapters } = await import('../src/data/chapters.js');
  const book = books.find((item) => item.id === 'book_001');
  const ownChapters = chapters.filter((item) => item.bookId === book.id);
  const base = process.env.EXPO_WEB_URL || 'http://localhost:8085';
  await fs.mkdir('.expo/verification', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const button = (name) => page.getByRole('button', { name, exact: true });
  const scroll = () => page.getByTestId('reader-scroll');
  const currentChapter = async (index) => {
    await expect(scroll()).toContainText(ownChapters[index].text.split('\n\n')[0]);
    await expect(page.getByRole('heading', { name: ownChapters[index].title, exact: true })).toHaveCount(1);
  };
  const actualPercent = () => scroll().evaluate((node) => {
    const distance = node.scrollHeight - node.clientHeight;
    return distance > 0 ? Math.round(node.scrollTop / distance * 100) : 0;
  });
  const savedPosition = () => page.evaluate((bookId) => {
    const state = JSON.parse(localStorage.getItem('author-today:state:v1'));
    const progress = state?.progressByBook[bookId];
    return progress ? { chapterId: progress.chapterId, percent: progress.percent } : null;
  }, book.id);
  async function chooseFromContents(index) {
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button').filter({ hasText: ownChapters[index].title }).click();
    await currentChapter(index);
  }
  let phase = 'open the first chapter explicitly from the book';
  try {
    await page.goto(new URL(`/book/${book.id}`, base).href);
    await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible({ timeout: 60000 });
    await page.getByRole('button', { name: /^Оглавление · 6 глав/ }).click();
    await chooseFromContents(0);

    phase = 'next chapter, settings, and return without resetting the chapter';
    await button('Следующая глава').click();
    await currentChapter(1);
    await scroll().evaluate((node) => {
      const distance = node.scrollHeight - node.clientHeight;
      if (distance < 20) throw new Error('The regression needs a genuinely scrollable chapter.');
      node.scrollTop = distance * 0.6;
    });
    await expect.poll(actualPercent).toBe(60);
    await expect(page.getByText('60% главы', { exact: true })).toBeVisible();
    await button('Открыть меню').click();
    await page.getByTestId('left-drawer').getByRole('button', { name: 'Общие настройки', exact: true }).click();
    await expect(button('Задержка ответа')).toBeVisible();
    await button('Назад').click();
    await currentChapter(1);
    await expect(page).toHaveURL(new RegExp(`chapterId=${ownChapters[1].id}`));
    await expect.poll(actualPercent).toBe(60);
    await expect.poll(savedPosition).toEqual({ chapterId: ownChapters[1].id, percent: 60 });

    phase = 'refresh retains the actual chapter and scroll offset';
    await page.reload();
    await currentChapter(1);
    await expect.poll(actualPercent).toBe(60);
    await expect.poll(savedPosition).toEqual({ chapterId: ownChapters[1].id, percent: 60 });
    await page.screenshot({ path: '.expo/verification/reader-focus.png', animations: 'disabled' });

    phase = 'contents and previous update URL without adding history entries';
    // A full reload reconstructs the current Router screen, so test in-app history
    // with a fresh Book -> Reader transition rather than expecting the pre-F5 stack.
    await page.goto(new URL(`/book/${book.id}`, base).href);
    await page.getByRole('button', { name: /^Оглавление · 6 глав/ }).click();
    await chooseFromContents(0);
    await button('Следующая глава').click();
    await currentChapter(1);
    await expect(page).toHaveURL(new RegExp(`chapterId=${ownChapters[1].id}`));
    await button('Открыть оглавление').click();
    await chooseFromContents(2);
    await expect(page).toHaveURL(new RegExp(`chapterId=${ownChapters[2].id}`));
    await expect.poll(actualPercent).toBe(0);
    await button('Предыдущая глава').click();
    await currentChapter(1);
    await expect(page).toHaveURL(new RegExp(`chapterId=${ownChapters[1].id}`));
    await expect.poll(actualPercent).toBe(0);
    await button('Назад').click();
    await expect(page).toHaveURL(new RegExp(`/book/${book.id}$`));
    await expect(page.getByRole('heading', { name: book.title, exact: true })).toBeVisible();
    await expect(button('ПРОДОЛЖИТЬ ЧТЕНИЕ')).toBeVisible();
    await button('ПРОДОЛЖИТЬ ЧТЕНИЕ').click();
    await currentChapter(1);
    expect(errors).toEqual([]);
    console.log('PASS: next/previous/contents keep the URL current; settings return and F5 retain the chapter and real 60% scroll; chapter changes do not add history entries.');
  } catch (error) {
    await page.screenshot({ path: '.expo/verification/reader-focus-failure.png', animations: 'disabled' }).catch(() => {});
    console.error(`FAIL at: ${phase}`);
    if (errors.length) console.error('Browser errors:', errors);
    throw error;
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
