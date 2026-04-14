// tests/template-builder/1-core-editor.spec.js
import { test, expect } from '@playwright/test';

test.describe('1. Çekirdek Editör İşlevleri', () => {
  let TEST_DOC_ID = '';
  // Teste özel benzersiz isim üret
  const DOC_NAME = `Core Editor Test - ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/panel');
    await page.getByRole('button', { name: 'Yeni Belge Oluştur' }).click();
    await page.waitForURL(/\/panel\/projects/);
    await page.getByRole('button', { name: 'Yeni Belge' }).click();
    
    // Benzersiz ismi doldur
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

    // Benzersiz isme sahip kartı bul
    const projectCard = page.locator('div[class*="projectCard"]', { hasText: DOC_NAME }).first();
    
    // O kartın içindeki çöp kutusu ikonuna tıkla
    await projectCard.getByTitle('Belgeyi Sil').click();

    // "Belgeyi Sil" modalında "Kalıcı Olarak Sil" butonuna tıkla
    await page.getByRole('button', { name: 'Klıcı Olarak Sil' }).click();

    await page.waitForTimeout(500); // Silme işleminin bitmesini bekle
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

  test('Slash (/) komutları ve klavye etkileşimleri kusursuz çalışmalı', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    
    await editor.pressSequentially('/ba', { delay: 20 });
    await page.waitForTimeout(200);
    await page.getByText('Büyük Başlık').click();
    await editor.pressSequentially('GİZLİLİK SÖZLEŞMESİ');
    await page.keyboard.press('Enter', { delay: 50 });

    await editor.pressSequentially('/mad', { delay: 20 });
    await page.waitForTimeout(200);
    await page.getByText('Madde İmleri').click();
    
    await editor.click();
    await editor.pressSequentially('Madde 1', { delay: 20 });
    await page.keyboard.press('Enter', { delay: 50 });
    await page.waitForTimeout(200); 
    await editor.pressSequentially('Madde 2', { delay: 20 });
    await page.keyboard.press('Enter', { delay: 50 });
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter', { delay: 50 }); 

    await editor.pressSequentially('Özel Not: {{gizli_n', { delay: 20 });
    await editor.press('Backspace'); await editor.press('Backspace'); 
    await editor.pressSequentially('_not}}');
    await page.keyboard.press('Enter', { delay: 50 });

    await editor.pressSequentially('/say', { delay: 20 });
    await page.waitForTimeout(300); 
    await page.keyboard.press('Enter'); 
    
    await expect(editor.locator('h1').filter({ hasText: 'GİZLİLİK SÖZLEŞMESİ' })).toBeVisible();
    await expect(editor.locator('ul li')).toHaveCount(2);
    await expect(editor).toContainText('{{gizli_not}}');
  });

  test('Metin formatlama araçları (Bold, Italic) çalışmalı', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.fill('Bu çok önemli bir metindir.');
    await editor.click();
    await page.keyboard.press('Shift+ArrowLeft', { delay: 50 });
    await page.keyboard.press('Shift+ArrowLeft', { delay: 50 });
    await page.getByTitle('Kalın').click();
    await expect(editor.locator('strong, b')).toBeVisible();
  });
});