// tests/template-builder/4-focus-editor.spec.js
import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
//  YARDIMCI: Proje + belge oluştur, Focus Editor'a git
// ─────────────────────────────────────────────────────────────────────────────
async function createProjectAndNavigate(page, docName) {
    await page.goto('/panel');
    await page.getByRole('button', { name: 'Yeni Belge Oluştur' }).click();
    await page.waitForURL(/\/panel\/projects/);
    await page.getByRole('button', { name: 'Yeni Belge' }).click();
    await page.getByPlaceholder('Örn: Kira Sözleşmesi').fill(docName);
    // Proje modu: "Özgür Yazım" veya herhangi bir seçenek
    await page.getByRole('button', { name: 'Oluştur ve Başla' }).click();
    await page.waitForURL(/\/panel\/projects\/.+/);

    // Focus Editor'a giden butonu bul
    const editorBtn = page.getByRole('button', { name: /Editörü Başlat|Aç|Editor/i }).first();
    if (await editorBtn.isVisible()) {
        await editorBtn.click();
    } else {
        // Alternatif: ilk belgeye direkt git
        const docLink = page.locator('a[href*="/panel/editor/"]').first();
        await docLink.click();
    }

    await page.waitForURL(/\/panel\/editor\/.+/);
    const match = page.url().match(/\/panel\/editor\/([a-f0-9]+)/i);
    return match ? match[1] : null;
}

async function deleteProject(page, docName) {
    await page.goto('/panel/projects');
    const card = page.locator('div[class*="projectCard"]', { hasText: docName }).first();
    if (await card.isVisible()) {
        await card.getByTitle('Belgeyi Sil').click();
        await page.getByRole('button', { name: 'Kalıcı Olarak Sil' }).click();
        await page.waitForTimeout(400);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEST SUITE 1 — Temel Editör ve Kayıt
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4a. Focus Editör — Temel Editör & Otomatik Kayıt', () => {
    let DOC_ID = '';
    const DOC_NAME = `FE Basic - ${Date.now()}`;

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        DOC_ID = await createProjectAndNavigate(page, DOC_NAME);
        await page.close();
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage();
        await deleteProject(page, DOC_NAME);
        await page.close();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await page.waitForLoadState('networkidle');
        const editor = page.locator('.ProseMirror');
        await expect(editor).toBeVisible({ timeout: 8000 });
        // Editörü temizle
        await editor.click();
        await editor.press('Meta+a');
        await editor.press('Control+a');
        await editor.press('Backspace');
    });

    test('Editörde metin yazılabilmeli', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('Merhaba Dünya! Bu bir test metnidir.', { delay: 15 });
        await expect(editor).toContainText('Merhaba Dünya!');
    });

    test('Belge adı değiştirildiğinde otomatik kayıt çalışmalı', async ({ page }) => {
        const titleInput = page.locator('#focus-title-input');
        await titleInput.fill('');
        await titleInput.pressSequentially(`${DOC_NAME} - Güncellendi`, { delay: 15 });
        await titleInput.blur();

        // Kaydediliyor göstergesi belirmeli
        await expect(page.locator('text=Kaydediliyor')).toBeVisible({ timeout: 5000 });
        // Ardından "Buluta kaydedildi" durumuna geçmeli
        await expect(page.locator('text=Buluta kaydedildi')).toBeVisible({ timeout: 8000 });
    });

    test('Geri Al / İleri Al (Undo/Redo) çalışmalı', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('İlk metin', { delay: 20 });
        await page.waitForTimeout(500);

        // Geri al
        await page.getByTitle('Geri Al').click();
        const content = await editor.innerText();
        expect(content.length).toBeLessThan(10); // Çoğu karakter silindi

        // İleri al
        await page.getByTitle('Yeniden Yap').click();
        await expect(editor).toContainText('İlk metin');
    });

    test('/ Slash komutu ile başlık eklenebilmeli', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('/bü', { delay: 25 });
        await page.waitForTimeout(300);
        await page.getByText('Büyük Başlık').click();
        await editor.pressSequentially('Proje Başlığı');
        await expect(editor.locator('h1')).toContainText('Proje Başlığı');
    });

    test('/ Slash komutu ile tablo eklenebilmeli', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('/tab', { delay: 25 });
        await page.waitForTimeout(300);
        await page.getByText('Tablo Ekle').click();
        await expect(editor.locator('table')).toBeVisible();
    });

    test('/ Slash komutu ile madde listesi eklenebilmeli', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('/mad', { delay: 25 });
        await page.waitForTimeout(300);
        await page.getByText('Madde İmleri').click();
        await editor.pressSequentially('Birinci madde');
        await expect(editor.locator('ul li')).toHaveCount(1);
    });

    test('Toolbar: Bold ve Italic biçimlendirme çalışmalı', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('Kalın metin testi', { delay: 15 });
        // Tümünü seç
        await editor.press('Meta+a');
        await editor.press('Control+a');
        await page.getByTitle(/Kalın/i).first().click();
        await expect(editor.locator('strong, b')).toBeVisible();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TEST SUITE 2 — Değişkenler ve Tetikleyiciler
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4b. Focus Editör — Değişkenler & Tetikleyiciler', () => {
    let DOC_ID = '';
    const DOC_NAME = `FE Variables - ${Date.now()}`;

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        DOC_ID = await createProjectAndNavigate(page, DOC_NAME);
        await page.close();
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage();
        await deleteProject(page, DOC_NAME);
        await page.close();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 8000 });
    });

    test('Kenar çubuğundan yeni değişken eklenebilmeli', async ({ page }) => {
        // Değişkenler sekmesine geç
        await page.getByText('Değişkenler').click();
        await page.waitForTimeout(200);

        // Yeni değişken formu
        const keyInput = page.getByPlaceholder(/Anahtar/i).last();
        const valInput = page.getByPlaceholder(/Değer/i).last();

        await keyInput.fill('firma_adi');
        await valInput.fill('Acme Corp');
        await page.getByRole('button', { name: /Kütüphaneye Ekle/i }).click();

        // Değişken listesinde görünmeli
        await expect(page.locator('text=firma_adi')).toBeVisible();
    });

    test('Değişken düzenleme (inline edit) çalışmalı', async ({ page }) => {
        await page.getByText('Değişkenler').click();
        await page.waitForTimeout(200);

        // Önce değişken ekle
        await page.getByPlaceholder(/Anahtar/i).last().fill('duzenlenecek');
        await page.getByPlaceholder(/Değer/i).last().fill('eskiDeger');
        await page.getByRole('button', { name: /Kütüphaneye Ekle/i }).click();
        await page.waitForTimeout(300);

        // Düzenle butonuna tıkla
        const varCard = page.locator('[class*="varCard"]', { hasText: 'duzenlenecek' }).first();
        await varCard.hover();
        await varCard.locator('button').first().click(); // Edit butonu

        // Değeri güncelle
        const valueInput = varCard.locator('input').last();
        await valueInput.fill('yeniDeger');
        await valueInput.press('Enter');

        await expect(page.locator('text=yeniDeger')).toBeVisible({ timeout: 3000 });
    });

    test('Değişken klavye kısayolu ile metne eklenebilmeli ({{ tetikleyicisi)', async ({ page }) => {
        await page.getByText('Değişkenler').click();
        // firma_adi değişkeninin eklenmiş olduğunu varsay (önceki testten ya da yeni ekle)
        await page.getByPlaceholder(/Anahtar/i).last().fill('test_var');
        await page.getByPlaceholder(/Değer/i).last().fill('TestDeğer');
        await page.getByRole('button', { name: /Kütüphaneye Ekle/i }).click();
        await page.waitForTimeout(300);

        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.pressSequentially('{{test', { delay: 30 });
        await page.waitForTimeout(400);

        // Autocomplete menüsü açılmalı
        const menu = page.locator('[class*="dropdownMenuFixed"]').last();
        await expect(menu).toBeVisible({ timeout: 3000 });
        await expect(menu).toContainText('test_var');

        // Enter ile seç
        await page.keyboard.press('Enter');
        await expect(editor).toContainText('{{test_var}}');
    });

    test('Tetikleyici formatı değiştirilebilmeli ({{ → @)', async ({ page }) => {
        await page.getByText('Değişkenler').click();
        await page.waitForTimeout(200);

        const triggerSelect = page.locator('[class*="triggerSelect"]').first();
        await triggerSelect.selectOption('@');
        await page.waitForTimeout(500);

        // Başarı bildirimi
        await expect(page.locator('text=Tetikleyici güncellendi')).toBeVisible({ timeout: 4000 });
    });

    test('Değişken silinebilmeli', async ({ page }) => {
        await page.getByText('Değişkenler').click();
        // Silinecek değişkeni ekle
        await page.getByPlaceholder(/Anahtar/i).last().fill('silinecek_var');
        await page.getByPlaceholder(/Değer/i).last().fill('GideceğimDeğer');
        await page.getByRole('button', { name: /Kütüphaneye Ekle/i }).click();
        await page.waitForTimeout(300);

        const varCard = page.locator('[class*="varCard"]', { hasText: 'silinecek_var' }).first();
        await varCard.hover();
        // Sil butonu (ikinci action butonu)
        await varCard.locator('button').last().click();

        // Onay modalı
        await page.getByRole('button', { name: /Evet.*Sil/i }).click();
        await expect(page.locator('text=silinecek_var')).not.toBeVisible({ timeout: 3000 });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TEST SUITE 3 — Bölümler (Sections) & Navigasyon
// ─────────────────────────────────────────────────────────────────────────────
test.describe.serial('4c. Focus Editör — Bölümler & Navigasyon', () => {
    let DOC_ID = '';
    const DOC_NAME = `FE Sections - ${Date.now()}`;

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        DOC_ID = await createProjectAndNavigate(page, DOC_NAME);
        await page.close();
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage();
        await deleteProject(page, DOC_NAME);
        await page.close();
    });

    test('Yeni bölüm eklenebilmeli ve listede görünmeli', async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 8000 });

        await page.getByText('İçindekiler').click();
        await page.waitForTimeout(200);

        const addBtn = page.locator('button[title*="Bölüm"]').first();
        await addBtn.click();
        await page.waitForTimeout(400);

        // Yeni bölüm girdi alanı odaklanmış olmalı
        const sectionInput = page.locator('[class*="sectionInput"]').last();
        await expect(sectionInput).toBeVisible({ timeout: 3000 });
        await sectionInput.fill('Yeni Test Bölümü');
        await sectionInput.press('Enter');

        // Listede görünmeli
        await expect(page.locator('text=Yeni Test Bölümü')).toBeVisible({ timeout: 3000 });
    });

    test('Bölüm yeniden adlandırılabilmeli (çift tıkla)', async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await page.getByText('İçindekiler').click();
        await page.waitForTimeout(200);

        const sectionRow = page.locator('[class*="sectionRow"]', { hasText: 'Yeni Test Bölümü' }).first();
        await expect(sectionRow).toBeVisible({ timeout: 4000 });

        // Çift tıkla — adı düzenle
        await sectionRow.dblclick();
        const input = sectionRow.locator('input');
        await expect(input).toBeVisible({ timeout: 2000 });
        await input.fill('Güncellenmiş Bölüm');
        await input.press('Enter');

        await expect(page.locator('text=Güncellenmiş Bölüm')).toBeVisible({ timeout: 3000 });
    });

    test('Bölüm silinebilmeli', async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await page.getByText('İçindekiler').click();
        await page.waitForTimeout(200);

        const sectionRow = page.locator('[class*="sectionRow"]', { hasText: 'Güncellenmiş Bölüm' }).first();
        await expect(sectionRow).toBeVisible({ timeout: 4000 });

        await sectionRow.hover();
        await sectionRow.locator('button').last().click(); // Sil butonu

        // Onay
        await page.getByRole('button', { name: /Evet.*Sil/i }).click();
        await expect(page.locator('text=Güncellenmiş Bölüm')).not.toBeVisible({ timeout: 4000 });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TEST SUITE 4 — Tema, Görünüm Modu ve Zen Modu
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4d. Focus Editör — Tema & UI Kontrolleri', () => {
    let DOC_ID = '';
    const DOC_NAME = `FE UI - ${Date.now()}`;

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        DOC_ID = await createProjectAndNavigate(page, DOC_NAME);
        await page.close();
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage();
        await deleteProject(page, DOC_NAME);
        await page.close();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 8000 });
    });

    test('Tema değiştirilebilmeli (Gece Yarısı)', async ({ page }) => {
        const themBtn = page.locator('#focus-theme-selector button').first();
        await themBtn.click();
        await page.waitForTimeout(200);

        // 🌙 temasını seç
        await page.getByText('Gece Yarısı').click();
        await page.waitForTimeout(300);

        // Root eleman data-theme değişmeli
        const root = page.locator('[data-theme]').first();
        await expect(root).toHaveAttribute('data-theme', 'dark');
    });

    test('Yazım → Önizleme geçişi çalışmalı', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.pressSequentially('Test içerik önizleme için.', { delay: 15 });
        await page.waitForTimeout(400);

        // Önizleme moduna geç
        const viewToggle = page.locator('#focus-view-toggle');
        await viewToggle.getByText('Önizleme').click();

        // previewDocument görünmeli, ProseMirror gizlenmeli
        await expect(page.locator('[class*="previewDocument"]')).toBeVisible();
        await expect(editor).not.toBeVisible();
    });

    test('Önizleme modunda değişkenler render edilmeli', async ({ page }) => {
        // Değişken ekle
        await page.getByText('Değişkenler').click();
        await page.getByPlaceholder(/Anahtar/i).last().fill('onizleme_var');
        await page.getByPlaceholder(/Değer/i).last().fill('Görkem');
        await page.getByRole('button', { name: /Kütüphaneye Ekle/i }).click();
        await page.waitForTimeout(300);

        // Editöre değişken yaz
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.pressSequentially('Merhaba {{onizleme_var}}!', { delay: 15 });
        await page.waitForTimeout(400);

        // Önizleme
        await page.locator('#focus-view-toggle').getByText('Önizleme').click();
        const preview = page.locator('[class*="previewDocument"]');
        await expect(preview).toContainText('Görkem');
        await expect(preview).not.toContainText('{{onizleme_var}}');
    });

    test('Kenar çubuğu gizlenip gösterilebilmeli', async ({ page }) => {
        const sidebar = page.locator('[class*="sidebar"]').first();
        const toggleBtn = page.locator('[class*="sidebarToggleBtn"]').first();

        // Başlangıçta açık olmalı
        await expect(sidebar).not.toHaveClass(/sidebarClosed/);

        // Kapat
        await toggleBtn.click();
        await page.waitForTimeout(350); // Transition süresi
        await expect(sidebar).toHaveClass(/sidebarClosed/);

        // Tekrar aç
        await toggleBtn.click();
        await page.waitForTimeout(350);
        await expect(sidebar).not.toHaveClass(/sidebarClosed/);
    });

    test('Zen modu açılıp kapanabilmeli', async ({ page }) => {
        await page.locator('#focus-zen-btn').click();
        await page.waitForTimeout(350);

        // Header gizlenmeli
        const header = page.locator('[class*="topHeader"]').first();
        await expect(header).toHaveClass(/topHeaderZen/);

        // Çıkış butonu görünmeli
        const exitBtn = page.locator('[class*="floatingZenExit"]');
        await expect(exitBtn).toBeVisible();
        await exitBtn.click();
        await page.waitForTimeout(350);
        await expect(header).not.toHaveClass(/topHeaderZen/);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TEST SUITE 5 — PDF İndirme Akışı
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4e. Focus Editör — PDF İndirme', () => {
    let DOC_ID = '';
    const DOC_NAME = `FE PDF - ${Date.now()}`;

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        DOC_ID = await createProjectAndNavigate(page, DOC_NAME);
        await page.close();
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage();
        await deleteProject(page, DOC_NAME);
        await page.close();
    });

    test('PDF indirme modalı açılmalı ve onaylanabilmeli', async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 8000 });

        // Editöre içerik yaz
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.pressSequentially('PDF test belgesi içeriği.', { delay: 15 });
        await page.waitForTimeout(400);

        // PDF butonuna tıkla
        await page.locator('[class*="pdfButton"]').click();

        // Modal açılmalı
        const modal = page.locator('h3', { hasText: 'PDF İndir' });
        await expect(modal).toBeVisible({ timeout: 3000 });

        // İndirme event'ini bekle
        const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
        await page.getByRole('button', { name: 'Onayla ve İndir' }).click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    });

    test('PDF modalı iptal edilebilmeli', async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 8000 });

        await page.locator('[class*="pdfButton"]').click();
        await expect(page.locator('h3', { hasText: 'PDF İndir' })).toBeVisible({ timeout: 3000 });

        await page.getByRole('button', { name: 'İptal' }).click();
        await expect(page.locator('h3', { hasText: 'PDF İndir' })).not.toBeVisible({ timeout: 2000 });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
//  TEST SUITE 6 — Klavye Kısayolları & Erişilebilirlik
// ─────────────────────────────────────────────────────────────────────────────
test.describe('4f. Focus Editör — Klavye & Erişilebilirlik', () => {
    let DOC_ID = '';
    const DOC_NAME = `FE Keyboard - ${Date.now()}`;

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        DOC_ID = await createProjectAndNavigate(page, DOC_NAME);
        await page.close();
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage();
        await deleteProject(page, DOC_NAME);
        await page.close();
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`/panel/editor/${DOC_ID}`);
        await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 8000 });
        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.press('Meta+a');
        await editor.press('Control+a');
        await editor.press('Backspace');
    });

    test('Ctrl+B kalın biçimlendirme yapmalı', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('Kalın test', { delay: 20 });
        await editor.press('Meta+a');
        await editor.press('Control+a');
        await editor.press('Meta+b');
        await editor.press('Control+b');
        await expect(editor.locator('strong, b')).toBeVisible();
    });

    test('Ctrl+Z ile geri alma çalışmalı', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('Silinecek metin', { delay: 20 });
        await page.waitForTimeout(500);
        await editor.press('Meta+z');
        await editor.press('Control+z');
        await page.waitForTimeout(200);
        const text = await editor.innerText();
        expect(text.trim().length).toBeLessThan('Silinecek metin'.length);
    });

    test('Slash menüsü Escape ile kapanmalı', async ({ page }) => {
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('/he', { delay: 25 });
        await page.waitForTimeout(300);

        const menu = page.locator('[class*="dropdownMenuFixed"]').filter({ hasText: 'KOMUTLAR' });
        await expect(menu).toBeVisible({ timeout: 3000 });

        await editor.press('Escape');
        await page.waitForTimeout(200);
        await expect(menu).not.toBeVisible();
    });

    test('Değişken autocomplete menüsü klavye ile kullanılabilmeli', async ({ page }) => {
        // Önce değişken ekle
        await page.getByText('Değişkenler').click();
        await page.getByPlaceholder(/Anahtar/i).last().fill('klavye_var');
        await page.getByPlaceholder(/Değer/i).last().fill('Klavye Testi');
        await page.getByRole('button', { name: /Kütüphaneye Ekle/i }).click();
        await page.waitForTimeout(300);

        const editor = page.locator('.ProseMirror');
        await editor.click();
        await editor.pressSequentially('{{kla', { delay: 30 });
        await page.waitForTimeout(400);

        const menu = page.locator('[class*="dropdownMenuFixed"]').filter({ hasText: 'DEĞİŞKENLER' });
        await expect(menu).toBeVisible({ timeout: 3000 });

        // Tab ile seç
        await editor.press('Tab');
        await expect(editor).toContainText('{{klavye_var}}');
    });
});