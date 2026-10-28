const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 15000 });

async function main() {
  const { chapters } = await import('../src/data/chapters.js');
  const own = chapters.filter(chapter => chapter.bookId === 'book_001').sort((a, b) => a.number - b.number);
  const length = own.reduce((total, chapter) => total + chapter.text.length, 0);
  const firstEnd = Math.round(own[0].text.length / length * 100);
  const secondMiddle = Math.round((own[0].text.length + own[1].text.length / 2) / length * 100);
  const base = process.env.EXPO_WEB_URL || 'http://localhost:8085';
  await fs.mkdir('.expo/verification/book-progress', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const button = name => page.getByRole('button', { name, exact: true });
  const heading = name => page.getByRole('heading', { name, exact: true });
  const scroll = () => page.getByTestId('reader-scroll');
  const card = () => page.getByTestId('library-card-book_001');
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('author-today:state:v1')).progressByBook.book_001);
  const actualPercent = () => scroll().evaluate(node => Math.round(node.scrollTop / (node.scrollHeight - node.clientHeight) * 100));
  async function moveTo(percent) {
    await scroll().evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await scroll().evaluate((node, value) => { node.scrollTop = (node.scrollHeight - node.clientHeight) * value / 100; }, percent);
    await expect.poll(actualPercent).toBe(percent);
    await expect.poll(async () => (await saved())?.percent).toBe(percent);
  }
  let phase = 'first chapter';
  try {
    await page.goto(`${base}/reader/book_001?chapterId=${own[0].id}`);
    await expect(heading(own[0].title)).toBeVisible({ timeout: 60000 });
    await moveTo(100);
    phase = 'end of the first chapter is not the end of the book';
    await page.goto(`${base}/library?shelf=reading`);
    await expect(card()).toBeVisible();
    await expect(card().getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(firstEnd));
    await page.screenshot({ path: '.expo/verification/book-progress/library.png', animations: 'disabled' });
    await button('Читать «Город под чёрным солнцем»').click();
    await expect(heading(own[0].title)).toBeVisible();
    await expect.poll(actualPercent).toBe(100);
    await expect(page.getByText(`${firstEnd}% книги`, { exact: true })).toBeVisible();
    phase = 'next chapter keeps the book percentage, while the position starts at zero';
    await button('Следующая глава').click(); await expect(heading(own[1].title)).toBeVisible();
    await expect.poll(actualPercent).toBe(0);
    await expect(page.getByText(`${firstEnd}% книги`, { exact: true })).toBeVisible();
    await moveTo(50); await expect(page.getByText(`${secondMiddle}% книги`, { exact: true })).toBeVisible();
    await page.reload(); await expect(heading(own[1].title)).toBeVisible(); await expect.poll(actualPercent).toBe(50);
    await expect(page.getByText(`${secondMiddle}% книги`, { exact: true })).toBeVisible();
    phase = 'home, library and results agree';
    await page.goto(base);
    await expect(button('Продолжить чтение «Город под чёрным солнцем»').getByText(`${secondMiddle}%`, { exact: true })).toBeVisible();
    await page.goto(`${base}/library?shelf=reading`); await expect(card().getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(secondMiddle));
    await page.goto(`${base}/results?mode=search&q=${encodeURIComponent('Город под чёрным солнцем')}`);
    await expect(page.getByTestId('book-result-book_001').getByText(`Прочитано: ${secondMiddle}% книги`, { exact: true })).toBeVisible();
    phase = '100 percent only at the end of the final chapter';
    await page.goto(`${base}/reader/book_001?chapterId=${own.at(-1).id}`);
    await expect(heading(own.at(-1).title)).toBeVisible(); await moveTo(100);
    await expect(page.getByText('100% книги', { exact: true })).toBeVisible();
    await page.goto(`${base}/library?shelf=reading`); await expect(card().getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(errors).toEqual([]);
    console.log(`PASS: first chapter end = ${firstEnd}% of book, second chapter middle = ${secondMiddle}%, last chapter end = 100%; home/results/library/reader agree; F5 restores exact chapter position.`);
  } catch (error) { await page.screenshot({ path: '.expo/verification/book-progress/failure.png' }).catch(() => {}); console.error(`FAIL at ${phase}`); throw error; }
  finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
