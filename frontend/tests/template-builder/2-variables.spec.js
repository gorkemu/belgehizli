// tests/template-builder/2-variables.spec.js
import { test, expect } from '@playwright/test';

test.describe('2. Değişkenler ve Tetikleyiciler (Triggers)', () => {
  let TEST_DOC_ID = '';
  const DOC_NAME = `Variables Test - ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/panel');
    await page.getByRole('button', { name: 'Yeni Belge Oluştur' }).click();
    await page.waitForURL(/\/panel\/projects/);
    await page.getByRole('button', { name: 'Yeni Belge' }).click();
    await page.getByPlaceholder('Örn: Kira Sözleşmesi').fill(DOC_NAME);
    await page.getByText('Şablon Modu (Akıllı Form)').click();
    await page.getByRole('button', { name: 'Oluştur ve Başla' }).click();
    await page.waitForURL(/\/panel\/projects\/.+/);
    await page.getByRole('button', { name: 'Tasarımcıyı Başlat' }).click();
    await page.waitForURL(/\/panel\/duzenle\/.+/);
    const match = page.url().match(/\/panel\/duzenle\/([a-f0-9]+)/i);
    if (match && match[1]) TEST_DOC_ID = match[1];
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!TEST_DOC_ID) return;
    const page = await browser.newPage();
    await page.goto('/panel/projects');
    const projectCard = page.locator('div[class*="projectCard"]', { hasText: DOC_NAME }).first();
    await projectCard.getByTitle('Belgeyi Sil').click();
    await page.getByRole('button', { name: 'Kalıcı Olarak Sil' }).click(); 
    await page.waitForTimeout(500);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/panel/duzenle/${TEST_DOC_ID}`);
    await page.getByRole('button', { name: 'Tasarım' }).click();
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.press('Meta+a'); await editor.press('Control+a');
    await editor.press('Backspace');
  });

  test('Sol panelden manuel değişken eklenip Regex tetikleyicileri çalışmalı', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    const newFieldInput = page.getByPlaceholder('Örn: Adı Soyadı').last();
    await newFieldInput.fill('Firma Unvanı');
    await newFieldInput.blur(); 
    
    await editor.click();
    const fieldList = page.locator('#field-list');
    await fieldList.getByRole('button', { name: 'Ekle', exact: true }).last().click();
    await expect(editor).toContainText('{{firma_unvani}}');

    const triggerSelect = page.locator('select[title="Değişken Formatı (Tetikleyici)"]');
    await triggerSelect.selectOption('custom');
    await page.getByPlaceholder('Örn: //').fill('$$');
    await page.getByRole('button', { name: 'Seç' }).click();

    await expect(editor).toContainText(/\$\$firma_unvani/);

    await triggerSelect.selectOption('@');
    await expect(editor).toContainText(/@firma_unvani/);
  });

  test('Sihirli Algılama Modalından farklı formatlar seçilebilmeli', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.fill('Taraf 1: {{birinci_taraf}} \nTaraf 2: [ikinci_taraf]');

    await page.getByRole('button', { name: 'Tümünü Algıla' }).click();
    await page.getByRole('button', { name: 'Uygula' }).click();
    await expect(page.locator('text=değişken algılandı')).toBeVisible();

    await page.getByRole('button', { name: 'Tümünü Algıla' }).click();
    await page.locator('button', { hasText: 'Köşeli Parantez' }).click();
    await page.getByRole('button', { name: 'Uygula' }).click();
    await expect(page.locator('text=değişken algılandı')).toBeVisible();
    
    const fieldList = page.locator('#field-list');
    await expect(fieldList).toContainText('BIRINCI_TARAF'); 
    await expect(fieldList).toContainText('IKINCI_TARAF');
  });
});