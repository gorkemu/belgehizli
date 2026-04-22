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
    // Her test öncesi onboarding'i kalıcı olarak engelle
    await page.addInitScript(() => {
      localStorage.setItem('template_builder_tour_seen', 'true');
    });
    await page.goto(`/panel/duzenle/${TEST_DOC_ID}`);
    await page.getByRole('button', { name: 'Tasarım' }).click();
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

    await formInputs.nth(0).fill('Tech Corp');
    await formInputs.nth(1).fill('Görkem Yılmaz');
    await formInputs.nth(2).fill('14.04.2026');

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

  test('Şartlı blok eklenip önizlemede koşula göre gösterilmeli', async ({ page }) => {
    const editor = page.locator('.ProseMirror');

    // Radio alanı oluştur
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('Sözleşme Tipi');

    // SON KARTIN içindeki select'i bul.
    const lastCard = page.locator('[class*="fieldCard"]').last();
    await lastCard.locator('select').selectOption('radio');

    // Seçenek ekle butonunu da son kartın içinden bul
    await lastCard.getByRole('button', { name: 'Seçenek ekle' }).click();
    await page.getByPlaceholder('Seçenek 1').fill('Standart');
    await lastCard.getByRole('button', { name: 'Seçenek ekle' }).click();
    await page.getByPlaceholder('Seçenek 2').fill('Premium');

    // Şartlı blok ekle
    await page.getByRole('button', { name: 'Şartlı Blok' }).click();

    const condModalHeading = page.getByRole('heading', { name: 'Şartlı Blok Ekle' });

    const condModal = page.locator('[class*="modal"]').filter({ has: condModalHeading }).first();

    // Önce başlığın görünür olmasını bekle
    await expect(condModalHeading).toBeVisible({ timeout: 5000 });

    await condModal.locator('select').first().selectOption('sozlesme_tipi');
    await condModal.locator('select').last().selectOption('Premium');
    await condModal.getByRole('button', { name: 'Bloğu Ekle' }).click();

    // Şartlı metni düzenle
    const conditionalText = editor.locator('p', { hasText: 'Buraya şartlı metninizi yazın...' });

    await conditionalText.click({ clickCount: 3 });

    // Seçili metni sil
    await page.keyboard.press('Backspace');

    // Yeni metni yaz (Böylece [EĞER] ve [ŞART SONU] etiketleri korunmuş olur)
    await editor.pressSequentially('Premium üyelik avantajları...');

    // Kaydet ve önizlemeye geç
    await page.getByPlaceholder('Şablon adı…').fill(DOC_NAME);
    await page.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByText('Buluta kaydedildi')).toBeVisible(); // Kaydedilmesini bekle!
    await page.getByRole('button', { name: 'Önizleme' }).click();

    // Standart seçiliyken metin görünmemeli
    const previewForm = page.locator('aside').filter({ hasText: 'Test formu' });
    await previewForm.locator('label', { hasText: 'Standart' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('main')).not.toContainText('Premium üyelik avantajları');

    // Premium seçiliyken görünmeli
    await previewForm.locator('label', { hasText: 'Premium' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('main')).toContainText('Premium üyelik avantajları');
  });

  test('Form alanları sürükle-bırak ile sıralanabilmeli', async ({ page }) => {
    // 1. Alanları Ekle
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('Birinci Alan');

    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('İkinci Alan');

    const card1 = page.locator('[class*="fieldCard"]').filter({ hasText: 'Birinci Alan' });
    const dragHandle1 = card1.locator('[class*="dragHandle"]');

    // Sadece ilk kartın koordinatını al
    const box = await dragHandle1.boundingBox();

    if (box) {
      // Tutamağın tam orta noktası
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;

      // 1. Fareyi tutamağa götür ve tıkla
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.waitForTimeout(200); // Uygulamanın tıklamayı algılaması için bekle

      // 2. 5 piksel kuralını aşmak için yavaşça aşağı çek
      await page.mouse.move(startX, startY + 10, { steps: 3 });
      await page.waitForTimeout(200); // DOM'un güncellenmesini (havaya kalkmasını) bekle

      // 3. Doğrudan 120 piksel aşağıya çek
      await page.mouse.move(startX, startY + 120, { steps: 10 });
      await page.waitForTimeout(200); // Çarpışma hesaplaması (Collision Detection) için bekle

      // 4. Fareyi bırak
      await page.mouse.up();
    }

    // Sürükleme animasyonunun ve React render'ının bitmesi için bekle
    await page.waitForTimeout(600);

    // Kontroller
    const allCards = page.locator('[class*="fieldCard"]');
    const totalCount = await allCards.count();

    // Sondan 2. kart "İkinci Alan", en sondaki kart "Birinci Alan" olmalı
    await expect(allCards.nth(totalCount - 2)).toContainText('İkinci Alan');
    await expect(allCards.nth(totalCount - 1)).toContainText('Birinci Alan');
  });

  test('Paylaşım linki kopyalanabilmeli', async ({ page }) => {
    await page.getByRole('button', { name: 'Paylaş' }).click();
    
    // Modalı "Heading" (Başlık) üzerinden bul
    const modalHeading = page.getByRole('heading', { name: 'Genel Bağlantı' });
    
    // İçinde bu başlığı barındıran İLK .modal div'ini seç
    const modal = page.locator('[class*="modal"]').filter({ has: modalHeading }).first();
    
    // Önce başlığın görünür olmasını bekle
    await expect(modalHeading).toBeVisible();

    const copyBtn = modal.getByRole('button', { name: 'Kopyala' });
    await copyBtn.click();
    await expect(modal.getByRole('button', { name: 'Kopyalandı' })).toBeVisible();

    const linkInput = modal.locator('input[readonly]');
    await expect(linkInput).toHaveValue(/\/f\/[a-f0-9]+/);
  });

  test('Tema değiştirilebilmeli ve localStorage\'a kaydedilmeli', async ({ page }) => {
    // Tema dropdown'ını aç
    await page.locator('#tb-theme-btn button').click();
    await page.locator('button:has-text("Orman")').click();

    await expect(page.locator('[data-theme="forest"]')).toBeVisible();

    const theme = await page.evaluate(() => localStorage.getItem('template_theme'));
    expect(theme).toBe('forest');

    await page.reload();
    await expect(page.locator('[data-theme="forest"]')).toBeVisible();
  });
});