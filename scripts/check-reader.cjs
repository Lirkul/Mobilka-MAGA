// Run against Expo Web: EXPO_WEB_URL=http://localhost:8082 node scripts/check-reader.cjs
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

async function main() {
  const baseUrl = process.env.EXPO_WEB_URL || 'http://localhost:8081';
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  // Each run gets isolated browser storage and initializes the teaching defaults.
  const context = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  try {
    await fs.mkdir('.expo/verification', { recursive: true });
    await page.goto(new URL('/book/book_001', baseUrl).href);
    await expect(page.getByRole('heading', { name: 'Город под чёрным солнцем' })).toBeVisible({ timeout: 60000 });
    await page.getByRole('button', { name: 'В библиотеку', exact: true }).click();
    await expect(page.getByRole('radio')).toHaveCount(4);
    await page.getByRole('radio', { name: 'Читаю', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Статус в библиотеке: Читаю' })).toBeVisible();
    await page.screenshot({ path: '.expo/verification/book-mobile.png', animations: 'disabled' });

    await page.getByRole('button', { name: 'ЧИТАТЬ', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Глава 1. Тропа', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Следующая глава' }).click();
    await expect(page.getByRole('heading', { name: 'Глава 2. Тайный знак', exact: true })).toBeVisible();
    await page.getByTestId('reader-scroll').evaluate((node) => {
      node.scrollTop = Math.round((node.scrollHeight - node.clientHeight) * 0.6);
    });
    await expect(page.getByText('60% главы', { exact: true })).toBeVisible();

    // Return immediately: this also catches a stale chapter passed from the book card
    // while the latest asynchronous progress write is still finishing.
    await page.getByRole('button', { name: 'Назад', exact: true }).last().click();
    await expect(page.getByRole('button', { name: 'ПРОДОЛЖИТЬ ЧТЕНИЕ' })).toBeVisible();
    await page.getByRole('button', { name: 'ПРОДОЛЖИТЬ ЧТЕНИЕ' }).click();
    await expect(page.getByRole('heading', { name: 'Глава 2. Тайный знак', exact: true })).toBeVisible();
    await expect(page.getByText('60% главы', { exact: true })).toBeVisible();
    await expect.poll(() => page.getByTestId('reader-scroll').evaluate((node) => (
      Math.round(node.scrollTop / (node.scrollHeight - node.clientHeight) * 100)
    ))).toBe(60);
    await page.screenshot({ path: '.expo/verification/reader-mobile.png', animations: 'disabled' });

    await page.getByRole('button', { name: 'Открыть оглавление' }).click();
    await page.getByRole('button', { name: /Глава 4. Ночная встреча/ }).click();
    await expect(page.getByRole('heading', { name: 'Глава 4. Ночная встреча', exact: true })).toBeVisible();

    await page.goto(new URL('/reader/book_002?chapterId=book_002_ch_03', baseUrl).href);
    await expect(page.getByText('Платная глава', { exact: true })).toBeVisible();
    await expect(page.getByTestId('reader-scroll')).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log('PASS: status modal, chapter navigation, 60% scroll restoration after return/resume, table of contents, paid chapter; no browser errors.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
