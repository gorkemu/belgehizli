// backend/pdf-generator/pdfGenerator.js
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const BROWSERLESS_API_URL = `https://chrome.browserless.io/pdf?token=${BROWSERLESS_API_KEY}`;

async function generatePdf(htmlContent, options = {}) {
    if (!BROWSERLESS_API_KEY) {
        console.error("Hata: BROWSERLESS_API_KEY ortam değişkeni tanımlanmamış!");
        throw new Error("PDF oluşturma servisi yapılandırılamadı.");
    }
    console.log("Sending request to Browserless API...");

    try {
        const response = await axios.post(
            BROWSERLESS_API_URL,
            {
                html: htmlContent,
                options: { 
                    format: 'A4',
                    printBackground: true,
                    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
                    
                    timeout: 60000, 
                    ...options 
                }
            },
            {
                responseType: 'arraybuffer',
                timeout: 70000 
            }
        );

        console.log("Received response from Browserless API. Status:", response.status);
        return response.data;

    } catch (error) {
        console.error("Error calling Browserless API:", error.response?.data?.toString() || error.message);
        throw new Error(`PDF oluşturulurken harici serviste hata oluştu: ${error.message}`);
    }
}
module.exports = { generatePdf };