// tests/api/auth/account-lockout.spec.js
import { test, expect } from '@playwright/test';

test.describe('Auth API - Hesap Kilitleme (Account Lockout)', () => {
  const registerUrl = '/api/auth/register';
  const loginUrl = '/api/auth/login';
  
  // Testlerin çakışmaması için her test koşusunda benzersiz bir kullanıcı üretiyoruz
  const testUser = {
    fullName: 'Lockout Test User',
    email: `lockout_${Date.now()}@test.com`,
    password: 'SuperGucluSifre123!'
  };

  test.beforeAll(async ({ request }) => {
    // Test başlamadan önce hedef kullanıcıyı sisteme kayıt ediyoruz
    await request.post(registerUrl, { data: testUser });
  });

  test('Bir hesaba 5 kez hatalı giriş yapıldığında hesap kilitlenmeli (403 Forbidden)', async ({ request }) => {
    
    // 1. Aşama: 5 kez KASTEN YANLIŞ şifre ile giriş yapıyoruz
    for (let i = 1; i <= 5; i++) {
      const response = await request.post(loginUrl, {
        data: {
          email: testUser.email,
          password: 'YanlisSifre123!' // Kasten yanlış
        }
      });
      // Şifre yanlış olduğu için 401 dönmeli
      expect(response.status()).toBe(401); 
    }

    // 2. Aşama: Hesap kilitlendi! Şimdi DOĞRU şifreyle bile girsek bizi almamalı
    const lockedResponse = await request.post(loginUrl, {
      data: {
        email: testUser.email,
        password: testUser.password // Bu sefer şifre DOĞRU!
      }
    });

    // Hesap kilitli olduğu için 403 (Forbidden) dönmeli
    expect(lockedResponse.status()).toBe(403);

    const body = await lockedResponse.json();
    expect(body.message).toContain('geçici olarak kilitlendi');
  });

});