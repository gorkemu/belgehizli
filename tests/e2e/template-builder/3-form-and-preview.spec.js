// tests/template-builder/3-form-and-preview.spec.js
import { test, expect } from '@playwright/test';

test.describe.serial('3. Form Mantığı, Şartlı Blok ve Önizleme', () => {
  let TEST_DOC_ID = '';
  const DOC_NAME = `Preview Form Test - ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    // Dili Türkçe'ye sabitle
    await context.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'tr');
      localStorage.setItem('template_builder_tour_seen', 'true');
    });
    const page = await context.newPage();

    await page.goto('/tr/panel');
    await page.getByRole('button', { name: /Yeni Şablon Oluştur/ }).click();

    await page.waitForURL(/.*\/panel\/projects/);
    await page.getByRole('button', { name: /Yeni Şablon/ }).click();
    await page.getByPlaceholder(/Örn: İş Sözleşmesi/).fill(DOC_NAME);
    await page.getByRole('button', { name: /Oluştur ve Başla/ }).click();

    await page.waitForURL(/.*\/panel\/duzenle\/.+/);
    const match = page.url().match(/.*\/panel\/duzenle\/([a-f0-9]+)/i);
    if (match && match[1]) TEST_DOC_ID = match[1];
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!TEST_DOC_ID) return;
    const page = await browser.newPage();

    await page.goto('/tr/panel/projects');
    const projectCard = page.locator('div[class*="projectCard"]', { hasText: DOC_NAME }).first();
    
    // 3 Noktalı menüye tıkla, ardından açılan menüden Sil'i seç
    await projectCard.locator('button[class*="menuTrigger"]').click();
    await page.locator('div[class*="menuDropdown"]').locator('button', { hasText: /Sil|Delete/i }).click();
    
    await page.getByRole('button', { name: /Kalıcı Olarak Sil|Delete Permanently/i }).click();
    await page.waitForTimeout(500);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Dili ve onboarding'i garantiye al
    await page.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'tr');
      localStorage.setItem('template_builder_tour_seen', 'true');
    });

    await page.goto(`/tr/panel/duzenle/${TEST_DOC_ID}`);
    await page.getByRole('button', { name: /Tasarım/ }).click();

    // Sol paneldeki tüm eski kartları sil (temizlik)
    const deleteButtons = page.locator('button[title="Sil"], button[aria-label="Sil"]');
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
    }

    // Editörü temizle
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.press('Meta+a');
    await editor.press('Control+a');
    await editor.press('Backspace');
  });

  test('Hatalı / Boş form kaydetmeye çalışıldığında sistem uyarmalı', async ({ page }) => {
    const nameInput = page.getByPlaceholder(/Şablon adı…/);
    await nameInput.fill('');
    await page.getByRole('button', { name: /Kaydet/ }).click();

    await expect(page.getByText(/eksik alanları/)).toBeVisible();
    await expect(nameInput).toHaveClass(/inpErr/);
  });

  test('Çoklu Değişken Doldurma ve Önizlemede PDF İndirme', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    const complexText = 'Satıcı: {{SATICI_ADI}} | Alıcı: {{ALICI_ADI}} | Tarih: {{SOZLESME_TARIHI}}';
    await editor.pressSequentially(complexText);
    await page.getByRole('button', { name: /Tümünü Algıla/ }).click();
    await page.getByRole('button', { name: /Uygula/ }).click();

    await page.getByPlaceholder(/Şablon adı…/).fill(DOC_NAME);
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /Kaydet/ }).click();
    await expect(page.getByText(/Buluta kaydedildi/)).toBeVisible();

    await page.getByRole('button', { name: /Önizleme/ }).click();

    const testFormArea = page.locator('aside').filter({ hasText: /Test formu/ });
    const formInputs = testFormArea.locator('input');

    await formInputs.nth(0).waitFor({ state: 'visible' });

    await formInputs.nth(0).fill('Tech Corp');
    await formInputs.nth(1).fill('Görkem Yılmaz');
    await formInputs.nth(2).fill('2026-04-14');
    await formInputs.nth(2).blur();

    await page.getByRole('button', { name: /Belgeyi İncele/ }).click();
    await expect(page.getByText(/Adım 2\/2/)).toBeVisible({ timeout: 5000 });

    const previewPaper = page.locator('main');
    await expect(previewPaper).toContainText('Tech Corp');
    await expect(previewPaper).toContainText('Görkem Yılmaz');
    await expect(previewPaper).toContainText('2026');

    await page.getByRole('button', { name: /İndir/ }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Onayla ve İndir/ }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('Şartlı blok eklenip önizlemede koşula göre gösterilmeli', async ({ page }) => {
    const editor = page.locator('.ProseMirror');

    await page.getByRole('button', { name: /Yeni alan ekle/ }).click();
    await page.getByPlaceholder(/Örn: Adı Soyadı/).last().fill('Sözleşme Tipi');

    const lastCard = page.locator('[class*="fieldCard"]').last();
    await lastCard.locator('select').selectOption('radio');

    await lastCard.getByRole('button', { name: /Seçenek ekle/ }).click();
    await page.getByPlaceholder(/Seçenek 1/).fill('Standart');
    await lastCard.getByRole('button', { name: /Seçenek ekle/ }).click();
    await page.getByPlaceholder(/Seçenek 2/).fill('Premium');

    await page.getByRole('button', { name: /Şartlı Blok/ }).click();

    const condModalHeading = page.getByRole('heading', { name: /Şartlı Blok Ekle/ });
    const condModal = page.locator('[class*="modal"]').filter({ has: condModalHeading }).first();

    await expect(condModalHeading).toBeVisible({ timeout: 5000 });

    await condModal.locator('select').first().selectOption('sozlesme_tipi');
    await condModal.locator('select').last().selectOption('Premium');
    await condModal.getByRole('button', { name: /Bloğu Ekle/ }).click();

    const conditionalText = editor.locator('p', { hasText: /Buraya şartlı metninizi yazın/ });
    await conditionalText.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await editor.pressSequentially('Premium üyelik avantajları...');

    await page.getByPlaceholder(/Şablon adı…/).fill(DOC_NAME);
    await page.getByRole('button', { name: /Kaydet/ }).click();
    await expect(page.getByText(/Buluta kaydedildi/)).toBeVisible();

    await page.getByRole('button', { name: /Önizleme/ }).click();

    const previewForm = page.locator('aside').filter({ hasText: /Test formu/ });
    await previewForm.waitFor({ state: 'visible' });

    await previewForm.locator('label', { hasText: 'Standart' }).click();

    const textElements = previewForm.locator('input:not([type="radio"]):not([type="checkbox"])');
    const textCount = await textElements.count();
    for (let i = 0; i < textCount; i++) {
      const el = textElements.nth(i);
      if (await el.isVisible()) {
        const type = await el.getAttribute('type');
        if (type === 'date') await el.fill('2026-04-14');
        else await el.fill('Test Verisi');
        await el.press('Tab');
      }
    }
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: /Belgeyi İncele/ }).click();
    await expect(page.getByText(/Adım 2\/2/)).toBeVisible();
    await expect(page.locator('main')).not.toContainText('Premium üyelik avantajları');

    await page.getByRole('button', { name: /Forma Dön ve Düzenle/ }).click();
    await page.getByRole('button', { name: /Yine De Dön/ }).click();

    await expect(page.getByText(/Adım 1\/2/)).toBeVisible();
    await previewForm.locator('label', { hasText: 'Premium' }).click();

    await page.getByRole('button', { name: /Belgeyi İncele/ }).click();
    await expect(page.locator('main')).toContainText('Premium üyelik avantajları');
  });

  test('Form alanları sürükle-bırak ile sıralanabilmeli', async ({ page }) => {
    await page.getByRole('button', { name: /Yeni alan ekle/ }).click();
    await page.getByPlaceholder(/Örn: Adı Soyadı/).last().fill('Birinci Alan');
    await page.keyboard.press('Tab');

    await page.getByRole('button', { name: /Yeni alan ekle/ }).click();
    await page.getByPlaceholder(/Örn: Adı Soyadı/).last().fill('İkinci Alan');
    await page.keyboard.press('Tab');

    const card1 = page.locator('[class*="fieldCard"]').filter({ hasText: 'Birinci Alan' });
    const card2 = page.locator('[class*="fieldCard"]').filter({ hasText: 'İkinci Alan' });

    const handle1 = card1.locator('[class*="dragHandle"]');

    await handle1.scrollIntoViewIfNeeded();
    await card2.scrollIntoViewIfNeeded();

    const box1 = await handle1.boundingBox();
    const box2 = await card2.boundingBox();

    if (box1 && box2) {
      const startX = box1.x + box1.width / 2;
      const startY = box1.y + box1.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.waitForTimeout(200);

      await page.mouse.move(startX, startY + 15, { steps: 3 });
      await page.waitForTimeout(200);

      await page.mouse.move(startX, box2.y + box2.height - 5, { steps: 15 });
      await page.waitForTimeout(400);

      await page.mouse.up();
    }

    await expect(async () => {
      const cards = page.locator('[class*="fieldCard"]');
      const texts = await cards.allInnerTexts();

      const indexBirinci = texts.findIndex(t => t.includes('Birinci Alan'));
      const indexIkinci = texts.findIndex(t => t.includes('İkinci Alan'));

      expect(indexBirinci).toBeGreaterThan(-1);
      expect(indexIkinci).toBeGreaterThan(-1);
      expect(indexBirinci).toBeGreaterThan(indexIkinci);
    }).toPass({ timeout: 5000 });
  });

  test('Paylaşım linki kopyalanabilmeli', async ({ page }) => {
    await page.getByRole('button', { name: /Paylaş/ }).click();

    const modalHeading = page.getByRole('heading', { name: /Genel Bağlantı/ });
    const modal = page.locator('[class*="modal"]').filter({ has: modalHeading }).first();

    await expect(modalHeading).toBeVisible();

    const copyBtn = modal.getByRole('button', { name: /Kopyala/ });
    await copyBtn.click();
    await expect(modal.getByRole('button', { name: /Kopyalandı/ })).toBeVisible();

    const linkInput = modal.locator('input[readonly]');
    await expect(linkInput).toHaveValue(/\/f\/[a-f0-9]+/);
  });

  test('Tema değiştirilebilmeli ve localStorage\'a kaydedilmeli', async ({ page }) => {
    // Tema menüsünü aç
    await page.locator('#tb-theme-btn button').click();

    // "Orman" temasını seç
    await page.locator('button:has-text("Orman")').click();

    // 1. DOM Kontrolü: <html> etiketinde data-theme="forest" var mı?
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');

    // 2. LocalStorage Kontrolü: Yeni anahtarımız 'app-theme'
    const theme = await page.evaluate(() => localStorage.getItem('app-theme'));
    expect(theme).toBe('forest');

    // 3. Kalıcılık (Persistance) Kontrolü: Sayfa yenilendikten sonra tema kalıyor mu?
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
  });
});