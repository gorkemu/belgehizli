import { test, expect } from '@playwright/test';

// Testler sırayla çalışacak.
test.describe.serial('Auth API - MFA (Çok Faktörlü Doğrulama) Güvenliği', () => {
  const registerUrl = '/api/auth/register';
  const loginUrl = '/api/auth/login';
  const verifyMfaUrl = '/api/auth/verify-mfa';

  // Diğer testlerle çakışmamak için bu dosyaya özel sahte IP
  const fakeIp = `192.168.10.${Math.floor(Math.random() * 255)}`;

  const testUser = {
    fullName: 'MFA Test User',
    email: `mfa_${Date.now()}@test.com`,
    password: 'SuperGucluSifre123!'
  };

  let tempMfaToken = '';

  test.beforeAll(async ({ request }) => {
    await request.post(registerUrl, { 
      headers: { 'X-Forwarded-For': fakeIp },
      data: testUser 
    });
  });

  test('Doğru şifreyle giriş yapıldığında doğrudan giriş YAPILAMAMALI, MFA kodu talep edilmeli', async ({ request }) => {
    const response = await request.post(loginUrl, {
      headers: { 'X-Forwarded-For': fakeIp },
      data: { email: testUser.email, password: testUser.password }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.token).toBeUndefined();
    expect(body.requiresMfa).toBe(true);
    expect(body.tempToken).toBeDefined();

    tempMfaToken = body.tempToken; 
  });

  test('Yanlış MFA kodu girildiğinde 400 (Bad Request) dönmeli', async ({ request }) => {
    const response = await request.post(verifyMfaUrl, {
      headers: { 'X-Forwarded-For': fakeIp },
      data: { 
        tempToken: tempMfaToken, 
        otp: '000000' 
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toContain('Geçersiz veya süresi dolmuş kod');
  });
});