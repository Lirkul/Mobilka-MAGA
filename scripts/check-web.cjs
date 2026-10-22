// Run against an already running Expo Web server: node scripts/check-web.cjs
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') { errors.push(message.text()); console.error(message.text()); } });
    await page.goto(process.env.EXPO_WEB_URL || 'http://localhost:8081');
    await expect(page.getByText('Популярное', { exact: true })).toBeVisible({ timeout: 60000 });
    await expect(page.getByText('Горячие новинки', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: /Обложка книги/ })).toHaveCount(6);
    await expect.poll(() => page.locator('img').evaluateAll((images) => images.length === 6 && images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
    await fs.mkdir('.expo/verification', { recursive: true });
    await page.screenshot({ path: '.expo/verification/home-mobile.png', animations: 'disabled' });
    await page.getByRole('button', { name: 'Открыть поиск и подбор книг' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Подберите книги по интересам')).toBeVisible();
    await page.screenshot({ path: '.expo/verification/search-mobile.png', animations: 'disabled' });
    await page.getByRole('button', { name: 'ПОДОБРАТЬ', exact: true }).click();
    await expect(page.getByText('По выбранным фильтрам найдено: 1')).toBeVisible();
    await page.getByRole('textbox', { name: 'Поиск по названию книги' }).fill('таксист');
    await page.getByRole('button', { name: 'Искать по названию', exact: true }).click();
    await expect(page.getByText('По названию «таксист» найдено: 1')).toBeVisible();
    await page.getByRole('button', { name: 'СБРОСИТЬ ВСЁ', exact: true }).click();
    await expect(page.getByRole('textbox')).toHaveValue('');
    await page.getByRole('button', { name: 'Искать по названию', exact: true }).click();
    await expect(page.getByText('Введите название книги.')).toBeVisible();
    await page.getByRole('textbox').fill('нет-такой-книги');
    await page.getByRole('button', { name: 'Искать по названию', exact: true }).click();
    await expect(page.getByText('По названию «нет-такой-книги» найдено: 0')).toBeVisible();
    await page.getByRole('button', { name: 'СБРОСИТЬ ВСЁ', exact: true }).click();
    await page.getByRole('button', { name: 'Жанр: Выбрать', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Городское фэнтези', exact: true }).click();
    await page.getByRole('button', { name: 'ВЫБРАТЬ', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Жанр: Городское фэнтези', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'ПОДОБРАТЬ', exact: true }).click();
    await expect(page.getByText('По выбранным фильтрам найдено: 2')).toBeVisible();
    await page.getByRole('button', { name: 'СБРОСИТЬ ВСЁ', exact: true }).click();
    await page.getByRole('button', { name: 'Дополнительные фильтры' }).click();
    await expect(page.getByRole('button', { name: 'Статус: Любой', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Статус: Любой', exact: true }).click();
    await page.getByRole('radio', { name: 'Завершено', exact: true }).click();
    await page.getByRole('button', { name: 'ПОДОБРАТЬ', exact: true }).click();
    await expect(page.getByText('По выбранным фильтрам найдено: 3')).toBeVisible();
    await page.getByRole('button', { name: 'СБРОСИТЬ ВСЁ', exact: true }).click();
    await page.getByRole('button', { name: 'Закрыть поиск', exact: true }).click({ position: { x: 10, y: 10 } });
    await expect(page.locator('input')).toHaveCount(0);
    await page.getByRole('button', { name: 'Открыть поиск и подбор книг' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('input')).toHaveCount(0);
    await expect(page.getByText('Популярное', { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 320, height: 568 });
    await page.getByRole('button', { name: 'Открыть поиск и подбор книг' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'СБРОСИТЬ ВСЁ', exact: true }).click();
    await page.screenshot({ path: '.expo/verification/search-small.png', animations: 'disabled' });
    await page.keyboard.press('Escape');
    await expect(page.locator('input')).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: '.expo/verification/home-desktop.png', animations: 'disabled' });
    expect(errors).toEqual([]);
    console.log('PASS: home, local covers, title search, filter selection, discovery, reset, additional filters, Escape, 320px and desktop; no browser errors.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
