// tests/template-builder/3-form-and-preview.spec.js
import { test, expect } from '@playwright/test';

test.describe.serial('3. Form Mantığı, Şartlı Blok ve Önizleme', () => {
  let TEST_DOC_ID = '';
  const DOC_NAME = `Preview Form Test - ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    // Onboarding'i baştan engelle
    await page.addInitScript(() => {
      localStorage.setItem('template_builder_tour_seen', 'true');
    });
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

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('template_builder_tour_seen', 'true');
    });
    await page.goto(`/panel/duzenle/${TEST_DOC_ID}`);
    await page.getByRole('button', { name: 'Tasarım' }).click();

    // OL PANELDEKİ TÜM ESKİ KARTLARI SİL (Temizlik)
    const deleteButtons = page.locator('button[title="Sil"], button[aria-label="Sil"]');
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      // Her zaman ilkini sil çünkü sildikçe liste kısalıyor
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
    const nameInput = page.getByPlaceholder('Şablon adı…');
    await nameInput.fill('');
    await page.getByRole('button', { name: 'Kaydet' }).click();

    await expect(page.getByText('eksik alanları')).toBeVisible();
    await expect(nameInput).toHaveClass(/inpErr/);
  });

  test('Çoklu Değişken Doldurma ve Önizlemede PDF İndirme', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    const complexText = 'Satıcı: {{SATICI_ADI}} | Alıcı: {{ALICI_ADI}} | Tarih: {{SOZLESME_TARIHI}}';
    await editor.pressSequentially(complexText);
    await page.getByRole('button', { name: 'Tümünü Algıla' }).click();
    await page.getByRole('button', { name: 'Uygula' }).click();

    await page.getByPlaceholder('Şablon adı…').fill(DOC_NAME);
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByText('Buluta kaydedildi')).toBeVisible();

    await page.getByRole('button', { name: 'Önizleme' }).click();

    const testFormArea = page.locator('aside').filter({ hasText: 'Test formu' });
    const formInputs = testFormArea.locator('input');

    // Görünür olmasını bekle
    await formInputs.nth(0).waitFor({ state: 'visible' });
    
    await formInputs.nth(0).fill('Tech Corp');
    await formInputs.nth(1).fill('Görkem Yılmaz');
    // Geçerli HTML5 date formatı
    await formInputs.nth(2).fill('2026-04-14'); 
    await formInputs.nth(2).blur(); // React state'i güncellensin

    // Belgeyi oluşturmak için 2. adıma geç
    await page.getByRole('button', { name: 'Belgeyi İncele' }).click();
    await expect(page.getByText('Adım 2/2')).toBeVisible({ timeout: 5000 });

    const previewPaper = page.locator('main');
    await expect(previewPaper).toContainText('Tech Corp');
    await expect(previewPaper).toContainText('Görkem Yılmaz');
    await expect(previewPaper).toContainText('2026'); // Yıl kontrolü yeterli

    await page.getByRole('button', { name: 'İndir' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Onayla ve İndir' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('Şartlı blok eklenip önizlemede koşula göre gösterilmeli', async ({ page }) => {
    const editor = page.locator('.ProseMirror');

    // Radio alanı oluştur
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('Sözleşme Tipi');

    const lastCard = page.locator('[class*="fieldCard"]').last();
    await lastCard.locator('select').selectOption('radio');

    // Seçenek ekle
    await lastCard.getByRole('button', { name: 'Seçenek ekle' }).click();
    await page.getByPlaceholder('Seçenek 1').fill('Standart');
    await lastCard.getByRole('button', { name: 'Seçenek ekle' }).click();
    await page.getByPlaceholder('Seçenek 2').fill('Premium');

    // Şartlı blok ekle
    await page.getByRole('button', { name: 'Şartlı Blok' }).click();

    const condModalHeading = page.getByRole('heading', { name: 'Şartlı Blok Ekle' });
    const condModal = page.locator('[class*="modal"]').filter({ has: condModalHeading }).first();

    await expect(condModalHeading).toBeVisible({ timeout: 5000 });

    await condModal.locator('select').first().selectOption('sozlesme_tipi');
    await condModal.locator('select').last().selectOption('Premium');
    await condModal.getByRole('button', { name: 'Bloğu Ekle' }).click();

    // Şartlı metni düzenle
    const conditionalText = editor.locator('p', { hasText: 'Buraya şartlı metninizi yazın...' });
    await conditionalText.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await editor.pressSequentially('Premium üyelik avantajları...');

    // Kaydet ve önizlemeye geç
    await page.getByPlaceholder('Şablon adı…').fill(DOC_NAME);
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByText('Buluta kaydedildi')).toBeVisible(); 
    
    await page.getByRole('button', { name: 'Önizleme' }).click();

    const previewForm = page.locator('aside').filter({ hasText: 'Test formu' });
    await previewForm.waitFor({ state: 'visible' });

    // 1. TEST: Standart Seçimi
    await previewForm.locator('label', { hasText: 'Standart' }).click();
    
    const textElements = previewForm.locator('input:not([type="radio"]):not([type="checkbox"])');
    const textCount = await textElements.count();
    for (let i = 0; i < textCount; i++) {
        const el = textElements.nth(i);
        // Sadece ekranda görünen (şartlı bloklarla gizlenmemiş) inputları doldur
        if (await el.isVisible()) {
            const type = await el.getAttribute('type');
            if (type === 'date') await el.fill('2026-04-14');
            else await el.fill('Test Verisi');
            await el.press('Tab');
        }
    }
    await page.waitForTimeout(300); // React'in state'i kaydetmesini bekle

    // 2. Adıma geç ve kontrol et
    await page.getByRole('button', { name: 'Belgeyi İncele' }).click();
    await expect(page.getByText('Adım 2/2')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('Premium üyelik avantajları');

    // Forma dönmek için uyarı modalını geç
    await page.getByRole('button', { name: 'Forma Dön ve Düzenle' }).click();
    await page.getByRole('button', { name: 'Yine De Dön' }).click();

    // 2. TEST: Premium Seçimi
    await expect(page.getByText('Adım 1/2')).toBeVisible();
    await previewForm.locator('label', { hasText: 'Premium' }).click();
    
    // Tekrar 2. Adıma geç
    await page.getByRole('button', { name: 'Belgeyi İncele' }).click();
    await expect(page.locator('main')).toContainText('Premium üyelik avantajları');
  });

  test('Form alanları sürükle-bırak ile sıralanabilmeli', async ({ page }) => {
    // 1. Alanları Ekle
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('Birinci Alan');
    await page.keyboard.press('Tab'); // Input'tan çık (blur)
    
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('İkinci Alan');
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

      // 5px kuralını tetikle
      await page.mouse.move(startX, startY + 15, { steps: 3 });
      await page.waitForTimeout(200);

      // İkinci kartın EN ALT SINIRINA kadar sürükle
      await page.mouse.move(startX, box2.y + box2.height - 5, { steps: 15 });
      await page.waitForTimeout(400);

      await page.mouse.up();
    }

    // "toPass" Bloğu ile sıralama kontrolü
    await expect(async () => {
      const cards = page.locator('[class*="fieldCard"]');
      const texts = await cards.allInnerTexts();

      const indexBirinci = texts.findIndex(t => t.includes('Birinci Alan'));
      const indexIkinci = texts.findIndex(t => t.includes('İkinci Alan'));

      expect(indexBirinci).toBeGreaterThan(-1);
      expect(indexIkinci).toBeGreaterThan(-1);

      // Birinci alan sürüklendiği için İkinci alanın ALTINDA olmalı
      expect(indexBirinci).toBeGreaterThan(indexIkinci);
    }).toPass({ timeout: 5000 });
  });

  test('Paylaşım linki kopyalanabilmeli', async ({ page }) => {
    await page.getByRole('button', { name: 'Paylaş' }).click();

    const modalHeading = page.getByRole('heading', { name: 'Genel Bağlantı' });
    const modal = page.locator('[class*="modal"]').filter({ has: modalHeading }).first();

    await expect(modalHeading).toBeVisible();

    const copyBtn = modal.getByRole('button', { name: 'Kopyala' });
    await copyBtn.click();
    await expect(modal.getByRole('button', { name: 'Kopyalandı' })).toBeVisible();

    const linkInput = modal.locator('input[readonly]');
    await expect(linkInput).toHaveValue(/\/f\/[a-f0-9]+/);
  });

  test('Tema değiştirilebilmeli ve localStorage\'a kaydedilmeli', async ({ page }) => {
    await page.locator('#tb-theme-btn button').click();
    await page.locator('button:has-text("Orman")').click();

    await expect(page.locator('[data-theme="forest"]')).toBeVisible();

    const theme = await page.evaluate(() => localStorage.getItem('template_theme'));
    expect(theme).toBe('forest');

    await page.reload();
    await expect(page.locator('[data-theme="forest"]')).toBeVisible();
  });
});