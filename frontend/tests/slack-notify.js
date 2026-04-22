// slack-notify.js
const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

async function sendSlackMessage(status) {
  const messagePayload = {
    text: `🎭 *Playwright Test Bildirimi*\nLokal bilgisayarda çalıştırılan testlerin durumu: *${status}* 🚀`,
    attachments: [
      {
        color: status === 'BAŞARILI' ? '#2eb886' : '#a30200',
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Tüm e2e test senaryoları tamamlandı. Detaylar için terminali kontrol edin."
            }
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messagePayload)
    });

    if (response.ok) {
      console.log('✅ Slack mesajı başarıyla gönderildi!');
    } else {
      console.error('❌ Slack mesajı gönderilemedi:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Slack webhook hatası:', error);
  }
}

// Komut satırından parametre alarak çalıştırabilmek için:
// Örnek kullanım: node slack-notify.js BAŞARILI
const statusArg = process.argv[2] || 'BİLİNMİYOR';
sendSlackMessage(statusArg);