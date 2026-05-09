// tests/api/auth/forgot-password.spec.js
import { test, expect } from '@playwright/test';

test.describe('Auth API - Şifremi Unuttum (Forgot Password) Güvenliği', () => {
  const forgotPasswordUrl = '/api/auth/forgot-password';

  test('Sistemde KAYITLI OLMAYAN bir e-posta girildiğinde bile 200 dönmeli (Enumeration Koruması)', async ({ request }) => {
    const response = await request.post(forgotPasswordUrl, {
      data: { email: 'asla.varolmayan.bir.email@hacker.com' }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    // Dil bağımsız: messageKey varlığı yeterli
    expect(body).toHaveProperty('messageKey');
    expect(body.messageKey).toMatch(/resetLinkSent|link/i);
    expect(body).toHaveProperty('message');
  });

  test('Sistemde KAYITLI BİR e-posta girildiğinde başarılı yanıt dönmeli', async ({ request }) => {
    const testUser = {
      fullName: 'Sifre Sifirlama Test',
      email: `reset_${Date.now()}@test.com`,
      password: 'SuperGucluSifre123!'
    };
    await request.post('/api/auth/register', { data: testUser });

    const response = await request.post(forgotPasswordUrl, {
      data: { email: testUser.email }
    });

    expect(response.status()).toBe(200);
    
    const body = await response.json();
    // Dil bağımsız: messageKey kontrolü
    expect(body).toHaveProperty('messageKey');
    expect(body.messageKey).toMatch(/resetLinkSent|link/i);
    expect(body).toHaveProperty('message');
  });
});