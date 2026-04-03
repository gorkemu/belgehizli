const sanitizeHtml = require('sanitize-html');

const sanitizeHtmlForPdf = (dirtyHtml) => {
  if (!dirtyHtml) return '';

  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'b', 'i', 'strong', 
      'em', 'u', 'a', 'ul', 'ol', 'li', 'span', 'div', 'hr', 
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code', 'style'
    ],
    allowedAttributes: {
      '*': ['href', 'target', 'class', 'style', 'src', 'alt', 'rel']
    },
  });
};

module.exports = { sanitizeHtmlForPdf };