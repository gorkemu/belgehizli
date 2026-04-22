// tests/template-builder/3-form-and-preview.spec.js
import { test, expect } from '@playwright/test';

test.describe.serial('3. Form Mantığı, Şartlı Blok ve Önizleme', () => {
  let TEST_DOC_ID = '';
  const DOC_NAME = `Preview Form Test - ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/panel');
    await page.getByRole('button', { name: 'Yeni Şablon Oluştur' }).click();
    await page.waitForURL(/\/panel\/projects/);
    await page.getByRole('button', { name: 'Yeni Şablon' }).click();
    await page.getByPlaceholder('Örn: İş Sözleşmesi').fill(DOC_NAME);
    await page.getByRole('button', { name: 'Oluştur ve Başla' }).click();
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
    await projectCard.getByTitle('Sil').click();
    await page.getByRole('button', { name: 'Kalıcı Olarak Sil' }).click(); 
    await page.waitForTimeout(500);
    await page.close();
  });

  test('Hatalı / Boş form kaydetmeye çalışıldığında sistem uyarmalı', async ({ page }) => {
    await page.goto(`/panel/duzenle/${TEST_DOC_ID}`);
    await page.getByRole('button', { name: 'Tasarım' }).click();

    const nameInput = page.getByPlaceholder('Şablon adı…');
    await nameInput.fill(''); 
    await page.getByRole('button', { name: 'Kaydet' }).click();

    await expect(page.locator('text=eksik alanları')).toBeVisible();
    await expect(nameInput).toHaveClass(/inpErr/); 
  });

  test('Çoklu Değişken Doldurma ve Önizlemede PDF İndirme', async ({ page }) => {
    await page.goto(`/panel/duzenle/${TEST_DOC_ID}`);
    
    // Eğitim turunun (Driver.js) açılmasını engelle
    await page.evaluate(() => {
      localStorage.setItem('template_builder_tour_seen', 'true');
    });
    // Sayfayı yenile ki React state'i bu değeri en baştan okusun
    await page.reload();

    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible();
    await editor.click();
    await editor.press('Meta+a'); await editor.press('Control+a'); await editor.press('Backspace');

    const complexText = 'Satıcı: {{SATICI_ADI}} | Alıcı: {{ALICI_ADI}} | Tarih: {{SOZLESME_TARIHI}}';
    await editor.pressSequentially(complexText);
    await page.getByRole('button', { name: 'Tümünü Algıla' }).click();
    await page.getByRole('button', { name: 'Uygula' }).click();

    await page.getByRole('button', { name: 'Şartlı Blok' }).click();
    await expect(page.locator('h3', { hasText: 'Şartlı Blok Ekle' })).toBeVisible();
    await page.getByRole('button', { name: 'Vazgeç' }).click();

    await page.getByPlaceholder('Şablon adı…').fill(DOC_NAME);
    await page.waitForTimeout(600); 

    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.locator('text=Buluta kaydedildi')).toBeVisible();
    await page.getByRole('button', { name: 'Önizleme' }).click();

    const testFormArea = page.locator('aside', { hasText: 'Test formu' });
    const formInputs = testFormArea.locator('input');
    
    await formInputs.nth(0).click();
    await formInputs.nth(0).pressSequentially('Tech Corp', { delay: 50 });
    await formInputs.nth(0).press('Tab'); 

    await formInputs.nth(1).click();
    await formInputs.nth(1).pressSequentially('Görkem Yılmaz', { delay: 50 });
    await formInputs.nth(1).press('Tab');

    await formInputs.nth(2).click();
    await formInputs.nth(2).pressSequentially('14.04.2026', { delay: 50 });
    await formInputs.nth(2).press('Tab');

    await page.waitForTimeout(600);

    const previewPaper = page.locator('main');
    await expect(previewPaper).toContainText('Tech Corp');
    await expect(previewPaper).toContainText('Görkem Yılmaz');
    await expect(previewPaper).toContainText('14.04.2026');

    await page.getByRole('button', { name: 'İndir' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Onayla ve İndir' }).click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});