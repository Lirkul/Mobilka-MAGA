const { chromium, expect: baseExpect } = require('@playwright/test');
const expect = baseExpect.configure({ timeout: 7000 });

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const small = process.argv.includes('--small');
  const page = await browser.newPage({ viewport: small ? { width: 320, height: 568 } : { width: 393, height: 852 }, hasTouch: true });
  const base = process.env.EXPO_WEB_URL || 'http://127.0.0.1:8082';
  const scroll = () => page.getByTestId('reader-scroll');
  const settings = () => page.getByRole('button', { name: 'Настройки чтения', exact: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function swipe(direction, inspect = false) {
    const bounds = await page.getByTestId('reader-paper').boundingBox();
    const start = bounds.x + bounds.width * (direction > 0 ? 0.8 : 0.2), y = bounds.y + bounds.height * 0.5;
    const paragraph = scroll().getByTestId('reader-page-paragraph').first();
    const before = await paragraph.boundingBox();
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y }] });
    for (let n = 1; n <= 8; n++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start - direction * bounds.width * 0.55 * n / 8, y }] });
      await page.waitForTimeout(20);
    }
    if (inspect) {
      const during = await paragraph.boundingBox();
      expect((before.x - during.x) * direction, 'The actual text must follow the finger horizontally').toBeGreaterThan(30);
      await expect(settings()).toBeHidden();
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
    await page.waitForTimeout(350);
  }
  try {
    await page.goto(`${base}/reader/book_001?chapterId=book_001_ch_01`);
    await expect(scroll()).toBeVisible({ timeout: 60000 });
    await settings().click();
    for (let n = 0; n < 5; n++) await page.getByRole('button', { name: 'Увеличить шрифт', exact: true }).click();
    await page.getByRole('button', { name: 'ГОТОВО', exact: true }).click();
    await swipe(1, true);
    await expect.poll(() => scroll().evaluate(node => node.scrollTop)).toBeGreaterThan(30);
    await expect(settings()).toBeHidden();
    await swipe(-1, true);
    await expect.poll(() => scroll().evaluate(node => node.scrollTop)).toBeLessThan(2);
    await scroll().evaluate(node => { node.scrollTop = node.scrollHeight; });
    await page.waitForTimeout(200);
    await swipe(1);
    await expect(page).toHaveURL(/chapterId=book_001_ch_02/);
    await expect(scroll()).toBeVisible();
    await expect.poll(() => scroll().evaluate(node => node.scrollTop)).toBeLessThan(2);
    await expect(settings()).toBeHidden();
    await swipe(-1);
    await expect(page).toHaveURL(/chapterId=book_001_ch_01/);
    await expect.poll(() => scroll().evaluate(node => Math.abs(node.scrollTop - (node.scrollHeight - node.clientHeight)))).toBeLessThan(2);
    await page.waitForTimeout(600);
    await page.reload();
    await expect(scroll()).toBeVisible();
    await expect.poll(() => scroll().evaluate(node => Math.round(node.scrollTop / (node.scrollHeight - node.clientHeight) * 100))).toBe(100);
    await page.goto(`${base}/reader/book_002?chapterId=book_002_ch_02`);
    await expect(scroll()).toBeVisible();
    await scroll().evaluate(node => { node.scrollTop = node.scrollHeight; });
    await page.waitForTimeout(200);
    await swipe(1);
    await expect(page.getByText('Платная глава', { exact: true })).toBeVisible();
    await expect(scroll()).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log('PASS: real horizontal page motion, panels hide during drag, seamless next/previous chapters, durable chapter position, paid chapters remain locked.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
