// tests/template-builder/2-variables.spec.js
import { test, expect } from '@playwright/test';

test.describe('2. Değişkenler ve Tetikleyiciler (Triggers)', () => {
  let TEST_DOC_ID = '';
  const DOC_NAME = `Variables Test - ${Date.now()}`;

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

  test.beforeEach(async ({ page }) => {
    await page.goto(`/panel/duzenle/${TEST_DOC_ID}`);

    // Onboarding'i kalıcı olarak devre dışı bırak
    await page.evaluate(() => {
      localStorage.setItem('template_builder_tour_seen', 'true');
    });

    // Sayfayı yeniden yükle ki React state'i localStorage'ı okusun
    await page.reload();

    // Tasarım moduna geç
    await page.getByRole('button', { name: 'Tasarım' }).click();

    // Editor'ü temizle
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.press('Meta+a');
    await editor.press('Control+a');
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

  test('Özel tetikleyici ile mevcut değişkenler dönüşmeli', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.fill('Merhaba {{isim}}');

    const triggerSelect = page.locator('select[title="Değişken Formatı (Tetikleyici)"]');
    await triggerSelect.selectOption('custom');
    await page.getByPlaceholder('Örn: //').fill('##');
    await page.getByRole('button', { name: 'Seç' }).click();

    await expect(editor).toContainText('##isim');
    await expect(editor).not.toContainText('{{isim}}');
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

  test('Çoklu eşleşme modalı: aynı kelime birden fazla yerde değiştirilebilmeli', async ({ page }) => {
    const editor = page.locator('.ProseMirror');

    // İçeriği yaz
    await editor.click();
    await editor.pressSequentially('Müşteri adı: Ahmet. Ahmet ile iletişime geçin.');
    await page.waitForTimeout(300);

    // Klavye ile hassas seçim
    await editor.press('Meta+a');
    await editor.press('Control+a');
    await page.keyboard.press('ArrowLeft', { delay: 50 });

    for (let i = 0; i < 13; i++) {
      await page.keyboard.press('ArrowRight', { delay: 20 });
    }

    await page.keyboard.down('Shift');
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight', { delay: 50 });
    }
    await page.keyboard.up('Shift');

    // Debounce için bekle
    await page.waitForTimeout(600);

    // Balon menüyü bekle ve tıkla
    const bubbleMenu = page.locator('[class*="combinedBubbleMenu"]');
    await expect(bubbleMenu).toBeVisible();

    await bubbleMenu.getByText('Soruya Dönüştür').click();

    const bubbleInput = bubbleMenu.getByPlaceholder('Soru Başlığı');
    await expect(bubbleInput).toBeVisible({ timeout: 5000 });

    // Input'un içini temizle (otomatik dolan metin olabilir) ve yenisini yaz
    await bubbleInput.fill('');
    await bubbleInput.fill('Müşteri İsmi');

    // Ekle butonuna tıkla
    await bubbleMenu.getByRole('button', { name: 'Ekle' }).click();

    // Çoklu eşleşme modalını bekle 
    const modalHeading = page.getByRole('heading', { name: 'Çoklu Eşleşme Bulundu' });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });

    const modalDialog = page.getByRole('dialog', { name: 'Çoklu Eşleşme Bulundu' }).first();

    // Doğrulamalar
    const checkboxes = page.locator('[class*="occurrenceItem"] input[type="checkbox"]');
    
    // Checkbox sayısını doğrula
    await expect(checkboxes).toHaveCount(2);
    
    // Değiştirme işlemini onayla
    await page.getByRole('button', { name: 'Seçili Olanları Değiştir' }).click();

    // Son Kontroller (Burada Ahmet kelimesi kullanıldığı için ahmet'in regex'i)
    const content = await editor.innerText();
    const matchCount = (content.match(/{{musteri_ismi}}/g) || []).length;
    expect(matchCount).toBe(2);

    await expect(page.locator('#field-list')).toContainText('Müşteri İsmi');
  });

  test('Değişken adı düzenlenebilmeli ve çakışma durumunda numaralandırılmalı', async ({ page }) => {
    // İlk değişkeni ekle
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('Ad');
    await page.getByPlaceholder('Örn: Adı Soyadı').last().blur();

    // İkinci değişkeni ekle, aynı isim otomatik oluşacak
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    const secondInput = page.getByPlaceholder('Örn: Adı Soyadı').last();
    await secondInput.fill('Ad');
    await secondInput.blur();

    const fieldCards = page.locator('[class*="fieldCard"]');
    
    await fieldCards.nth(1).getByRole('button', { name: 'Gelişmiş' }).click();

    // CSS Module uyumlu input seçimi
    const varNameInput = fieldCards.nth(1).locator('input[class*="monoInp"]');
    
    // Değerin 'ad_12' gibi otomatik numaralandığını doğrula
    await expect(varNameInput).toHaveValue(/^ad_\d+$/);
  });

  test('Değişken silindiğinde form alanı kaldırılmalı', async ({ page }) => {
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('Silinecek');
    await page.getByPlaceholder('Örn: Adı Soyadı').last().blur();

    // CSS Module uyumlu seçici
    const fieldCard = page.locator('[class*="fieldCard"]').first();
    
    await fieldCard.getByRole('button', { name: 'Sil' }).click();

    // Silindiğini doğrula
    await expect(page.locator('#field-list')).not.toContainText('Silinecek');
  });
});