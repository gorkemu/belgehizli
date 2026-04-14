import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // CI ortamında testlerin bilerek atlanmasını yasakla
  forbidOnly: !!process.env.CI,
  // CI ortamında hata alırsan 2 kere daha tekrar dene (Geçici sunucu dalgalanmalarına karşı)
  retries: process.env.CI ? 2 : 0,
  // CI ortamında sunucuyu yormamak için testleri tek koldan çalıştır
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  globalSetup: './tests/global-setup.js',

  use: {
    baseURL: 'http://localhost:5173',
    // 2. Kaydedilen oturum dosyasının yolu
    storageState: 'storageState.json',
    // Testler başarısız olursa video ve hata takibini kaydet 
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // GitHub Actions'ın uygulamayı testten önce ayağa kaldırması için
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // Sunucunun kalkması için 2 dakika süre tanı
  },
});