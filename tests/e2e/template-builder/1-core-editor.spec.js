// tests/template-builder/1-core-editor.spec.js
import { test, expect } from '@playwright/test';

test.describe('1. Çekirdek Editör İşlevleri', () => {
  let TEST_DOC_ID = '';
  const DOC_NAME = `Core Editor Test - ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'tr');
    });
    const page = await context.newPage();
    
    await page.goto('/tr/panel');
    await page.getByRole('button', { name: 'Yeni Şablon Oluştur' }).click();
    
    await page.waitForURL(/.*\/panel\/projects/);
    await page.getByRole('button', { name: 'Yeni Şablon' }).click();
    await page.getByPlaceholder('Örn: İş Sözleşmesi').fill(DOC_NAME);
    await page.getByRole('button', { name: 'Oluştur ve Başla' }).click();
    
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
    
    await projectCard.locator('button[class*="menuTrigger"]').click();
    await page.locator('div[class*="menuDropdown"]').locator('button', { hasText: /Sil|Delete/i }).click();
    
    await page.getByRole('button', { name: /Kalıcı Olarak Sil|Delete Permanently/i }).click();
    await page.waitForTimeout(500);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'tr');
    });

    await page.goto(`/tr/panel/duzenle/${TEST_DOC_ID}`);
    await page.getByRole('button', { name: 'Tasarım' }).click();
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.press('Meta+a'); await editor.press('Control+a');
    await editor.press('Backspace');
    
    await page.evaluate(() => localStorage.setItem('template_builder_tour_seen', 'true'));
    await page.reload();
    await page.getByRole('button', { name: 'Tasarım' }).click();
    await editor.click();
  });

  test('Slash (/) komutları: Madde İmleri doğru çalışmalı', async ({ page }) => {
    const editor = page.locator('.ProseMirror');

    await editor.pressSequentially('/mad', { delay: 20 });
    await page.getByTestId('slash-menu').getByText('Madde İmleri').click();

    await editor.pressSequentially('Madde 1');
    await page.keyboard.press('Enter');

    await expect(editor.locator('ul li')).toHaveCount(2, { timeout: 3000 });

    await editor.pressSequentially('Madde 2');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); 

    await expect(editor.locator('ul li')).toHaveCount(2);
    await expect(editor.locator('ul li').first()).toContainText('Madde 1');
  });

  test('Metin formatlama araçları (Bold, Italic, Renk, Hizalama) çalışmalı', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.fill('Bu metin formatlanacak.');

    await editor.dblclick({ position: { x: 10, y: 10 } });
    await page.getByTitle('Kalın').click();
    await expect(editor.locator('strong, b')).toBeVisible();

    await page.getByTitle('İtalik').click();
    await expect(editor.locator('em, i')).toBeVisible();

    await page.getByTitle('Ortala').click();
    await expect(editor.locator('p[style*="text-align: center"]')).toBeVisible();

    await page.getByTitle('Yazı Rengi').click();
    await page.locator('button[style*="background-color: rgb(37, 99, 235)"]').click();
    await expect(editor.locator('span[style*="color: rgb(37, 99, 235)"]')).toBeVisible();

    await page.getByTitle('Vurgu Rengi').click();
    await page.locator('button[style*="background-color: rgb(254, 240, 138)"]').click();
    await expect(editor.locator('mark')).toBeVisible();
  });

  test('Undo / Redo işlemleri doğru çalışmalı', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.fill('İlk metin');
    await editor.press('Enter');
    await editor.pressSequentially('İkinci satır');

    await page.getByTitle('Geri al').click();
    await expect(editor).not.toContainText('İkinci satır');

    await page.getByTitle('İleri al').click();
    await expect(editor).toContainText('İkinci satır');
  });

  test('Başlık seviyeleri ve liste iç içe geçme çalışmalı', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();

    await page.getByTitle('Kalın').waitFor({ state: 'visible' });

    const headingSelect = page.getByRole('combobox').filter({ hasText: 'Normal' });
    await headingSelect.selectOption('2');

    await editor.pressSequentially('Bölüm 1');
    await page.keyboard.press('Enter');

    await headingSelect.selectOption('0');
    await editor.pressSequentially('Normal metin');
    await page.keyboard.press('Enter');

    await page.getByTitle('Numaralı Liste').click();
    await editor.pressSequentially('Madde A');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await editor.pressSequentially('Alt madde');

    await expect(editor.locator('h2')).toContainText('Bölüm 1');
    await expect(editor.locator('ol li')).toHaveCount(2);
    await expect(editor.locator('ol ol li')).toHaveCount(1);
  });

  test('Font boyutu ve satır yüksekliği değiştirilebilmeli', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.fill('Font test metni');
    await editor.dblclick();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    const fontSizeSelect = page.getByRole('combobox').filter({ hasText: 'Boyut' });
    await fontSizeSelect.waitFor({ state: 'visible' });
    await fontSizeSelect.selectOption('20px');
    await expect(editor.locator('span[style*="font-size: 20px"]')).toBeVisible();

    const lineHeightSelect = page.getByRole('combobox').filter({ hasText: 'Satır' });
    await lineHeightSelect.selectOption('1.8');
    await expect(editor.locator('p[style*="line-height: 1.8"]')).toBeVisible();
  });

  test('Slash menüsünde ok tuşları ile gezinme ve Enter ile seçim', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.pressSequentially('/');

    const slashMenu = page.getByTestId('slash-menu');
    await expect(slashMenu).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const heading2 = editor.locator('h2');
    await expect(heading2).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(200);
    await page.keyboard.insertText('Test Başlığı');

    await expect(heading2).toBeVisible({ timeout: 5000 });
    await expect(heading2).toContainText('Test Başlığı');
  });

  test('Değişken menüsü tetikleyici ile açılıp seçim yapılabilmeli', async ({ page }) => {
    await page.getByRole('button', { name: 'Yeni alan ekle' }).click();
    await page.getByPlaceholder('Örn: Adı Soyadı').last().fill('Müşteri Adı');
    await page.getByPlaceholder('Örn: Adı Soyadı').last().blur();

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await editor.pressSequentially('Sayın {{');

    const varMenu = page.getByTestId('variable-menu');
    await expect(varMenu).toBeVisible({ timeout: 3000 });

    await varMenu.locator('[class*="slashItem"]', { hasText: 'Müşteri Adı' }).click();

    await expect(varMenu).not.toBeVisible();
    await expect(editor).toContainText('{{musteri_adi}}');
  });
});