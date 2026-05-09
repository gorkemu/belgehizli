// tests\api\auth\account-lockout.spec.js
import { test, expect } from '@playwright/test';

test.describe('Auth API - Hesap Kilitleme (Account Lockout)', () => {
  const registerUrl = '/api/auth/register';
  const loginUrl = '/api/auth/login';
  
  const fakeIp = `192.168.20.${Math.floor(Math.random() * 255)}`;

  const testUser = {
    fullName: 'Lockout Test User',
    email: `lockout_${Date.now()}@test.com`,
    password: 'SuperGucluSifre123!'
  };

  test.beforeAll(async ({ request }) => {
    await request.post(registerUrl, { 
      headers: { 'X-Forwarded-For': fakeIp },
      data: testUser 
    });
  });

  test('Bir hesaba 5 kez hatalı giriş yapıldığında hesap kilitlenmeli (403 Forbidden)', async ({ request }) => {
    
    // 1. Aşama: 5 kez YANLIŞ şifre
    for (let i = 1; i <= 5; i++) {
      const response = await request.post(loginUrl, {
        headers: { 'X-Forwarded-For': fakeIp },
        data: {
          email: testUser.email,
          password: 'YanlisSifre123!' 
        }
      });
      expect(response.status()).toBe(401);
    }

    // 2. Aşama: DOĞRU şifreyle deneme (Kilitli olmalı)
    const lockedResponse = await request.post(loginUrl, {
      headers: { 'X-Forwarded-For': fakeIp },
      data: {
        email: testUser.email,
        password: testUser.password 
      }
    });

    expect(lockedResponse.status()).toBe(403);

    const body = await lockedResponse.json();
    // Dil bağımsız doğrulama: messageKey veya message kontrolü
    expect(body.messageKey).toBe('auth.accountLocked');
    // params içinde minutes değeri olmalı
    expect(body.params?.minutes).toBeGreaterThan(0);
  });
});