// frontend/src/features/TemplateBuilder/utils/helpers.js

const generateVarName = (text) => text.toString()
  .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
  .replace(/I/g, 'i').replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
  .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
  .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

const getTriggerSymbols = (t) => {
  if (t === '[') return { s: '[', e: ']' };
  if (t === '{') return { s: '{', e: '}' };
  if (t === '{{') return { s: '{{', e: '}}' };
  if (t === '<<') return { s: '<<', e: '>>' };
  if (t === '@') return { s: '@', e: '' };
  return { s: t, e: '' };
};

const getRegexForTrigger = (trigger) => {
  if (trigger === '{{') return /\{\{\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}\}/g;
  if (trigger === '[') return /\[\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\]/g;
  if (trigger === '{') return /\{(?!\s*\{)\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*\}(?!\s*\})/g;
  if (trigger === '<<') return /(?:<<|&lt;&lt;)\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*(?:>>|&gt;&gt;)/g;
  if (trigger === '@') return /@([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)/g;
  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)`, 'g');
};

const cleanHtmlContent = (html) => html || '';

/**
 * Çeviri fonksiyonu ve tetikleyici sembolünü kullanarak imza bloğu oluşturur.
 * @param {string} type - 'left' veya 'right'
 * @param {function} t - i18n çeviri fonksiyonu
 * @param {string} triggerSymbol - değişken tetikleyicisi
 * @returns {string} HTML içeriği
 */
const insertSignatureBlock = (type, t, triggerSymbol = '{{') => {
  const sym = getTriggerSymbols(triggerSymbol);
  const partyPlaceholder = t('templateBuilder.helpers.signatureParty', { trigger: triggerSymbol });

  let html = '';
  if (type === 'left') {
    html = `<p style="text-align: left"><strong>${partyPlaceholder}</strong></p><p style="text-align: left"><br></p><p style="text-align: left">${t('templateBuilder.helpers.signature')}</p><p></p>`;
  } else if (type === 'right') {
    html = `<p style="text-align: right"><strong>${partyPlaceholder}</strong></p><p style="text-align: right"><br></p><p style="text-align: right">${t('templateBuilder.helpers.signature')}</p><p></p>`;
  }
  return html;
};

const convertToHandlebars = (html, trigger) => {
  let processedHtml = html || '';
  processedHtml = processedHtml.replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');

  const condRegex = /(?:<p>)?\s*(?:<strong[^>]*>)?\[EĞER:\s*([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)\s*=\s*([^\]]+)\](?:<\/strong>)?\s*(?:<\/p>)?([\s\S]*?)(?:<p>)?\s*(?:<strong[^>]*>)?\[ŞART SONU\](?:<\/strong>)?\s*(?:<\/p>)?/g;
  processedHtml = processedHtml.replace(condRegex, '{{#if (eq $1 "$2")}}$3{{/if}}');

  if (trigger && trigger !== '{{') {
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = processedHtml;
    const regex = getRegexForTrigger(trigger);
    const walk = (node) => {
      if (node.nodeType === 3) node.nodeValue = node.nodeValue.replace(regex, '{{$1}}');
      else if (node.nodeType === 1) { for (let child of node.childNodes) walk(child); }
    };
    walk(tempDiv);
    processedHtml = tempDiv.innerHTML;
  }
  return processedHtml;
};

export { generateVarName, getTriggerSymbols, getRegexForTrigger, cleanHtmlContent, insertSignatureBlock, convertToHandlebars };