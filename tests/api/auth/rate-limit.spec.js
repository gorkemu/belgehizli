// tests/api/auth/brute-force.spec.js
import { test, expect } from '@playwright/test';

test.describe('Auth API - Brute Force Koruması (Rate Limiting)', () => {

  test('Giriş (login) rotasında arka arkaya 10 hatalı denemeden sonra IP engellenmeli (429 Too Many Requests)', async ({ request }) => {
    
    const fakeIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    // 1. Aşama: Sınıra kadar (10 kez) bilerek hatalı şifreyle giriş dene
    for (let i = 1; i <= 10; i++) {
      const response = await request.post('/api/auth/login', {
        headers: {
          'X-Forwarded-For': fakeIp
        },
        data: {
          email: `bot${i}@hacker.com`,
          password: 'yanlissifre'
        }
      });
      expect(response.status()).toBe(401); 
    }

    // 2. Aşama: Bardağı taşıran son damla (11. İstek)
    const blockedResponse = await request.post('/api/auth/login', {
      headers: {
        'X-Forwarded-For': fakeIp
      },
      data: {
        email: 'son.deneme@hacker.com',
        password: 'yanlissifre'
      }
    });

    expect(blockedResponse.status()).toBe(429);

    const responseBody = await blockedResponse.json();
    // Dil bağımsız kontroller
    expect(responseBody).toHaveProperty('messageKey');
    expect(responseBody.messageKey).toMatch(/tooManyFailedAttempts|rate/i);
    expect(responseBody).toHaveProperty('success', false);
    expect(responseBody).toHaveProperty('message');
  });
});