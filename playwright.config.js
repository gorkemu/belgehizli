// playwright.config.js (Ana Dizinde)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // Tüm testlerin ana klasörü
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'], 
    ['json', { outputFile: 'test-results.json' }] 
  ],

  // Genel ayarlar
  use: {
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  // PROJELER İKİ TANE (E2E ve API)
  projects: [
    {
      name: 'e2e',
      testDir: './tests/e2e', // Sadece e2e klasörüne bakar
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173', // Frontend adresi
        storageState: 'storageState.json', // Login oturumu
      },
    },
    {
      name: 'api',
      testDir: './tests/api', // Sadece api klasörüne bakar
      use: {
        // API testlerinde tarayıcı (browser) açılmasına gerek yoktur
        baseURL: 'http://localhost:8080', // Backend adresi
      },
    },
  ],

  // E2E testleri için giriş yapma aşaması 
  globalSetup: './tests/e2e/global-setup.js',

  // SUNUCULARI ANA DİZİNDEN AYAĞA KALDIRMA
  // Playwright array kullanarak birden fazla sunucu başlatabilir
  webServer: [
    {
      // 1. Backend'i Başlat
      command: 'cd backend && npm run dev', 
      url: 'http://localhost:8080/api/ping', // Backend'in ayakta olduğunu bu URL'den anlar
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      // 2. Frontend'i Başlat
      command: process.env.CI ? 'cd frontend && npm run dev:ci' : 'cd frontend && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    }
  ],
});