const DOMPurify = require('isomorphic-dompurify');

const sanitizeHtmlForPdf = (dirtyHtml) => {
  if (!dirtyHtml) return '';

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'b', 'i', 'strong', 
      'em', 'u', 'a', 'ul', 'ol', 'li', 'span', 'div', 'hr', 
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'style'
    ],
    ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'src', 'alt', 'rel'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'link'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  });
};

module.exports = { sanitizeHtmlForPdf };