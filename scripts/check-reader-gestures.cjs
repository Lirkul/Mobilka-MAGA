const { chromium, expect: baseExpect } = require('@playwright/test');
const fs = require('node:fs/promises');
const expect = baseExpect.configure({ timeout: 5000 });

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const small = process.argv.includes('--small');
  const page = await browser.newPage({ viewport: small ? { width: 320, height: 568 } : { width: 393, height: 852 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = process.env.EXPO_WEB_URL || 'http://127.0.0.1:8082';
  const scroll = page.getByTestId('reader-scroll');
  const settings = page.getByRole('button', { name: 'Настройки чтения', exact: true });
  const metrics = () => scroll.evaluate(node => ({ top: node.scrollTop, height: node.clientHeight, total: node.scrollHeight }));
  async function centerTap() {
    const area = await page.getByTestId('reader-paper').boundingBox();
    await page.touchscreen.tap(area.x + area.width / 2, area.y + area.height / 2);
  }
  async function swipe(dx, dy) {
    const area = await page.getByTestId('reader-paper').boundingBox();
    const x = area.x + area.width * (dx < 0 ? 0.8 : dx > 0 ? 0.2 : 0.5);
    const y = area.y + area.height * 0.5;
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let n = 1; n <= 10; n++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * n / 10, y: y + dy * n / 10 }] });
      await page.waitForTimeout(16);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  }
  let phase = 'center tap must not move the text';
  try {
    await page.goto(`${base}/reader/book_001?chapterId=book_001_ch_01`);
    await expect(scroll).toBeVisible({ timeout: 60000 });
    await settings.click();
    for (let n = 0; n < 5; n++) await page.getByRole('button', { name: 'Увеличить шрифт', exact: true }).click();
    await page.getByRole('button', { name: 'ГОТОВО', exact: true }).click();
    await scroll.evaluate(node => { node.scrollTop = (node.scrollHeight - node.clientHeight) * 0.37; });
    await page.waitForTimeout(600);
    const before = await metrics();
    await centerTap();
    await expect(settings).toBeHidden();
    await page.waitForTimeout(250);
    expect(Math.abs((await metrics()).top - before.top), 'Hiding panels must keep the text at the same offset').toBeLessThan(2);
    await centerTap();
    await expect(settings).toBeVisible();
    expect(Math.abs((await metrics()).top - before.top), 'Showing panels must keep the text at the same offset').toBeLessThan(2);

    phase = 'horizontal swipes and vertical scrolling work together';
    await scroll.evaluate(node => { node.scrollTop = 0; });
    await page.waitForTimeout(200);
    const pageStart = await metrics();
    await swipe(-200, 3);
    await expect.poll(async () => (await metrics()).top).toBeGreaterThan(40);
    const afterPage = await metrics();
    expect(afterPage.top).toBeLessThanOrEqual(pageStart.height + 2);
    await expect(settings).toBeHidden();
    await page.waitForTimeout(350);
    await swipe(200, -2);
    await expect.poll(async () => (await metrics()).top).toBeLessThan(3);
    await swipe(0, -130);
    await expect.poll(async () => (await metrics()).top).toBeGreaterThan(20);
    await expect(settings).toBeHidden();
    await page.waitForTimeout(800);
    const stopped = await metrics();
    await page.waitForTimeout(400);
    expect(Math.abs((await metrics()).top - stopped.top), 'Free scrolling must not snap to a page').toBeLessThan(2);

    phase = 'taps after scrolling, mouse clicks, and long presses';
    await centerTap();
    await expect(settings).toBeVisible();
    await page.waitForTimeout(300);
    const center = await page.getByTestId('reader-paper').boundingBox();
    await page.mouse.click(center.x + center.width / 2, center.y + center.height / 2);
    await expect(settings).toBeHidden();
    const longPress = await page.context().newCDPSession(page);
    await longPress.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: center.x + center.width / 2, y: center.y + center.height / 2 }] });
    await page.waitForTimeout(450);
    await longPress.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await longPress.detach();
    await expect(settings).toBeHidden();
    await page.waitForTimeout(300);
    await centerTap();
    await expect(settings).toBeVisible();

    phase = 'settings, text, and saved position';
    await settings.click();
    await expect(page.getByRole('radio', { name: 'Прокрутка', exact: true })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'Постранично', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Уменьшить шрифт', exact: true }).click();
    await page.getByRole('button', { name: 'ГОТОВО', exact: true }).click();
    await expect(scroll).toBeVisible();
    const normalize = text => text.replace(/\s+/g, ' ').trim();
    const { chapters } = await import('../src/data/chapters.js');
    const chapter = chapters.find(item => item.id === 'book_001_ch_01');
    expect(normalize((await scroll.getByTestId('reader-page-paragraph').allTextContents()).join(' '))).toBe(normalize(chapter.text));
    await scroll.evaluate(node => { node.scrollTop = (node.scrollHeight - node.clientHeight) * 0.53; });
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const key = 'author-today:state:v1', state = JSON.parse(localStorage.getItem(key));
      state.settings.reader.readingMode = 'paged';
      localStorage.setItem(key, JSON.stringify(state));
    });
    await page.reload();
    await expect(scroll).toBeVisible();
    await expect.poll(async () => { const m = await metrics(); return Math.round(m.top / (m.total - m.height) * 100); }).toBe(53);
    expect(errors).toEqual([]);
    await fs.mkdir('.expo/verification/reader-gestures', { recursive: true });
    await page.screenshot({ path: `.expo/verification/reader-gestures/reader${small ? '-small' : ''}.png` });
    console.log('PASS: center taps keep the text still; horizontal page turns and free vertical scrolling coexist; gestures hide panels; all words and saved position survive.');
  } catch (error) {
    console.error(`FAIL: ${phase}`);
    console.error('URL:', page.url());
    await page.screenshot({ path: '.expo/verification/reader-gesture-failure.png' });
    if (await scroll.count()) console.error('Viewport:', await metrics());
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
