# Belge Hızlı (Smart Contract & Template Generator)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Visit Website](https://img.shields.io/badge/🌐_Visit_Website-belgehizli.com-0d6efd)](https://www.belgehizli.com/)

Belge Hızlı is a full-stack SaaS platform designed to help users create, manage, and generate legal contracts, petitions, and official documents. It features an Authentication system, a Template Builder for creating dynamic forms, and a Focus Editor for direct document drafting. 

## Key Features

### Editors 
* **Template Builder (Smart Form Mode):** * Create dynamic templates visually. 
  * **Magic Variable Detection:** Automatically detects variables in multiple formats (e.g., `{{variable}}`, `[variable]`, `@variable`, `$$variable`) using Regex and converts them into dynamic form questions on the fly.
  * **Slash Commands:** Type `/` to quickly insert headings, lists, dividers, and conditional blocks.
* **Focus Editor (Authoring Mode):** A distraction-free, minimalist writing environment for drafting static documents or articles from scratch.

### Dynamic Form Engine
* **Auto-UI:** Forms are automatically generated based on the variables set in the Template Builder.
* **Debounced Reactivity:** Live preview generation with optimized React state management (debouncing) to prevent rendering lags.
* **Conditional Logic & Repeatable Blocks:** Fields dynamically show/hide based on previous answers, and users can add multiple instances of a block (e.g., multiple tenants).

### PDF Generation & Delivery
* **High-Fidelity PDF Output:** Powered by Browserless.io / Puppeteer for professional, print-ready documents.
* **Dual Delivery:** Instant browser download combined with automated email delivery.

## Technology Stack

* **Frontend:** React (Vite), React Router v6, CSS Modules, Tiptap (ProseMirror), Handlebars.js, React-Helmet-Async, Playwright.
* **Backend:** Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, Bcrypt, Nodemailer.
* **Services & Hosting:** Browserless.io (PDF rendering), Vercel (Frontend), Render (Backend).

## Template Architecture

Templates and their dynamic fields are structured in MongoDB. The Template Builder generates this structure automatically, but it can also be seeded manually.

### Field Structure Example

```json
{
    "name": "artis_tipi",
    "label": "Yıllık Kira Artış Yöntemi",
    "fieldType": "select",
    "options": ["TÜFE", "Belirtilen Oran"],
    "required": true
}
```

#### Conditional Field Example
```json
{
    "name": "depozito_tutari",
    "label": "Alınan Depozito Tutarı (TL)",
    "fieldType": "number",
    "condition": { "field": "depozito_alindi", "value": "Evet" }
}
```

### Handlebars Integration

The system uses Handlebars logic inside the document strings to inject data and handle conditions visually:

```handlebars
{{#if (eq depozito_alindi 'Evet')}}
<p>Kiracı(lar)dan toplam {{depozito_tutari}} TL depozito alınmıştır.</p>
{{else}}
<p>Kiracı(lar)dan depozito alınmamıştır.</p>
{{/if}}
```

## License

This project is licensed under the **MIT License**. See the [LICENSE](https://github.com/gorkemu/belgehizli/blob/main/LICENSE) file for details.