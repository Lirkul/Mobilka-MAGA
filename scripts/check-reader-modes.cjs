const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 15000 });
async function main() {
  const { chapters } = await import('../src/data/chapters.js');
  const chapter = chapters.find(item => item.id === 'book_001_ch_01');
  const base = process.env.EXPO_WEB_URL || 'http://localhost:8085';
  await fs.mkdir('.expo/verification/reader-modes', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const small = process.argv.includes('--small');
  const page = await browser.newPage({ viewport: small ? { width: 320, height: 568 } : { width: 393, height: 852 }, hasTouch: true });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const button = name => page.getByRole('button', { name, exact: true });
  const radio = name => page.getByRole('radio', { name, exact: true });
  const position = () => page.evaluate(() => JSON.parse(localStorage.getItem('author-today:state:v1')).progressByBook.book_001);
  const scroll = () => page.getByTestId('reader-scroll');
  const actual = () => scroll().evaluate(node => Math.round(node.scrollTop / (node.scrollHeight - node.clientHeight) * 100));
  const pageLabel = () => page.getByText(/^\d+ из \d+$/, { exact: true });
  async function settledPage() {
    await expect.poll(async () => {
      const content = await page.getByTestId('reader-active-page-content').boundingBox();
      const viewport = await page.getByTestId('reader-pager').boundingBox();
      return Math.abs(content.x - viewport.x - 10);
    }).toBeLessThan(1);
  }
  async function swipe(direction, touch = false) {
    const area = await page.getByTestId('reader-paper').boundingBox();
    const y = area.y + area.height * 0.55, start = area.x + area.width * (direction > 0 ? 0.82 : 0.18), end = area.x + area.width * (direction > 0 ? 0.18 : 0.82);
    if (touch) {
      const session = await page.context().newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y }] });
      for (let n = 1; n <= 12; n++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start + (end - start) * n / 12, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await session.detach();
    } else {
      await page.mouse.move(start, y); await page.mouse.down(); await page.mouse.move(end, y, { steps: 12 }); await page.mouse.up();
    }
  }
  let phase = 'free scrolling';
  try {
    await page.goto(`${base}/reader/book_001?chapterId=${chapter.id}`);
    await expect(page.getByRole('heading', { name: chapter.title, exact: true })).toBeVisible({ timeout: 60000 });
    await scroll().evaluate(node => { node.scrollTop = (node.scrollHeight - node.clientHeight) * 0.37; });
    await expect.poll(actual).toBe(37);
    await page.waitForTimeout(700); await expect.poll(actual).toBe(37);
    await scroll().evaluate(node => { node.scrollTop = 0; }); await expect.poll(actual).toBe(0);
    phase = 'horizontal page turns, one page per swipe';
    await button('Настройки чтения').click();
    for (let n = 0; n < 5; n++) await button('Увеличить шрифт').click();
    await radio('Постранично').click(); await button('ГОТОВО').click();
    await expect(page.getByTestId('reader-active-page-content')).toBeVisible();
    await expect(pageLabel()).toHaveText(/^1 из \d+$/);
    expect(Number((await pageLabel().innerText()).split(' из ')[1])).toBeGreaterThanOrEqual(3);
    await swipe(1); await expect(pageLabel()).toHaveText(/^2 из \d+$/);
    await expect(button('Назад')).toBeVisible();
    await swipe(-1, true); await expect(pageLabel()).toHaveText(/^1 из \d+$/);
    await swipe(1, true); await expect(pageLabel()).toHaveText(/^2 из \d+$/);
    phase = 'pagination fits the screen and preserves every word';
    await button('Предыдущая страница').click(); await expect(pageLabel()).toHaveText(/^1 из \d+$/);
    const count = Number((await pageLabel().innerText()).split(' из ')[1]);
    const text = [];
    for (let index = 0; index < count; index++) {
      const active = page.getByTestId('reader-active-page-content');
      await expect(active).toBeVisible();
      await settledPage();
      const body = await active.boundingBox(), viewport = await page.getByTestId('reader-pager').boundingBox();
      expect(body.height).toBeLessThanOrEqual(viewport.height + 1);
      text.push(...await active.getByTestId('reader-page-paragraph').allTextContents());
      if (index < count - 1) { await button('Следующая страница').click(); await expect(pageLabel()).toHaveText(`${index + 2} из ${count}`); }
    }
    const normalize = text => text.replace(/\s+/g, ' ').trim();
    expect(normalize(text.join(' '))).toBe(normalize(chapter.text));
    await expect(button('Следующая страница')).toBeDisabled();
    await settledPage(); await page.screenshot({ path: `.expo/verification/reader-modes/paged${small ? '-small' : ''}.png`, animations: 'disabled' });
    phase = 'page and mode survive F5, scroll mode stops at any position';
    await button('Предыдущая страница').click();
    await expect.poll(async () => (await position()).percent).toBeCloseTo((count - 2) / (count - 1) * 100, 10);
    const saved = await position(), label = await pageLabel().innerText();
    await page.reload(); await expect(pageLabel()).toHaveText(label);
    await expect.poll(async () => (await position()).percent).toBe(saved.percent);
    await button('Настройки чтения').click(); await expect(radio('Постранично')).toBeChecked(); await radio('Прокрутка').click(); await button('ГОТОВО').click();
    await expect(scroll()).toBeVisible(); await expect.poll(actual).toBe(Math.round(saved.percent));
    await scroll().evaluate(node => { node.scrollTop = (node.scrollHeight - node.clientHeight) * 0.37; });
    await expect.poll(actual).toBe(37); await page.waitForTimeout(700); await expect.poll(actual).toBe(37);
    await expect.poll(async () => (await position()).percent).toBe(37);
    await page.reload(); await expect(scroll()).toBeVisible(); await expect.poll(actual).toBe(37);
    await page.screenshot({ path: `.expo/verification/reader-modes/scroll${small ? '-small' : ''}.png`, animations: 'disabled' });
    expect(errors).toEqual([]);
    console.log('PASS: free scroll stops at 37%; mouse/touch swipe one horizontal page, text fits with no lost/duplicated words; mode/page/scroll survive F5 and switching modes.');
  } catch (error) { console.error(`FAIL at ${phase}`); await page.screenshot({ path: '.expo/verification/reader-modes/failure.png' }).catch(() => {}); throw error; }
  finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
