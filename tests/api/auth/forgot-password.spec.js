// tests/api/auth/forgot-password.spec.js
import { test, expect } from '@playwright/test';

test.describe('Auth API - Şifremi Unuttum (Forgot Password) Güvenliği', () => {
  const forgotPasswordUrl = '/api/auth/forgot-password';

  test('Sistemde KAYITLI OLMAYAN bir e-posta girildiğinde bile 200 dönmeli (Enumeration Koruması)', async ({ request }) => {
    const response = await request.post(forgotPasswordUrl, {
      data: { email: 'asla.varolmayan.bir.email@hacker.com' }
    });

    // 404 (Not Found) dönmemeli! Güvenlik için 200 dönmeli.
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.message).toContain('gönderildi');
  });

  test('Sistemde KAYITLI BİR e-posta girildiğinde başarılı yanıt dönmeli', async ({ request }) => {
    // 1. Önce geçici bir kullanıcı oluşturalım
    const testUser = {
      fullName: 'Sifre Sifirlama Test',
      email: `reset_${Date.now()}@test.com`,
      password: 'SuperGucluSifre123!'
    };
    await request.post('/api/auth/register', { data: testUser });

    // 2. Şifremi unuttum isteği atalım
    const response = await request.post(forgotPasswordUrl, {
      data: { email: testUser.email }
    });

    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.message).toContain('gönderildi');
  });
});