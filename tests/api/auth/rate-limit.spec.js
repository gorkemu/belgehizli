import { test, expect } from '@playwright/test';

test.describe('Auth API - Brute Force Koruması (Rate Limiting)', () => {

  test('Giriş (login) rotasında arka arkaya 10 hatalı denemeden sonra IP engellenmeli (429 Too Many Requests)', async ({ request }) => {
    
    // Her test koşusunda rastgele sahte bir IP adresi üret.
    // Böylece önceki testlerin 15 dakikalık cezası bu testi etkilemez.
    const fakeIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    // 1. Aşama: Sınıra kadar (10 kez) bilerek hatalı şifreyle giriş dene
    for (let i = 1; i <= 10; i++) {
      const response = await request.post('/api/auth/login', {
        headers: {
          'X-Forwarded-For': fakeIp // Sunucuya sahte IP'mizi bildiriyoruz
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
        'X-Forwarded-For': fakeIp // Aynı sahte IP'den 11. isteği atıyoruz ki yakalansın
      },
      data: {
        email: 'son.deneme@hacker.com',
        password: 'yanlissifre'
      }
    });

    // Artık 401 değil, 429 (Too Many Requests) hatası almalıyız!
    expect(blockedResponse.status()).toBe(429);

    const responseBody = await blockedResponse.json();
    expect(responseBody.message).toContain('Çok fazla başarısız deneme');
    expect(responseBody.success).toBe(false);
  });

});