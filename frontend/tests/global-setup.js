// tests/global-setup.js
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

async function globalSetup(config) {
  const { baseURL, storageState } = config.projects[0].use;

  console.log('Tarayıcı başlatılıyor...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`Giriş sayfasına gidiliyor: ${baseURL}/giris-yap`);
  await page.goto(`${baseURL}/giris-yap`);

  await page.waitForLoadState('domcontentloaded');

  console.log('Form dolduruluyor...');
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL);
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD);

  console.log('Giriş yap butonuna tıklanıyor...');
  
  await page.locator('button', { hasText: 'Giriş Yap' }).click();

  console.log('Panelin açılması bekleniyor...');
  await page.waitForURL(`${baseURL}/panel`, { timeout: 15000 });

  console.log('Çerezler ve oturum kaydediliyor...');
  await page.context().storageState({ path: storageState });

  await browser.close();
  console.log('Global Setup Başarıyla Tamamlandı! ✅');
}

export default globalSetup;