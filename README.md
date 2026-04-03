# Belge Hızlı (Contract-Generator)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live-Demo-success)](https://www.belgehizli.com/)

Belge Hızlı is a modern, full-stack web application designed to help users generate legal contracts, petitions, and official documents in PDF format within seconds using dynamic templates. The platform operates on a Public Service model—offering high-quality legal tools for free, supported by voluntary user contributions.

![App Preview](./docs/images/app-preview.png)

## Key Features

* **Dynamic Template System:** Add or update contract types directly via MongoDB without any code changes.
* **Advanced Form Generation:**
    * **Auto-UI:** Forms are automatically generated based on template field definitions.
    * **Auto-Save (No Data Loss):** Form progress is instantly saved to `localStorage`, ensuring users never lose their data due to accidental reloads or connection drops.
    * **Repeatable Blocks:** Supports multiple instances of field groups (e.g., adding multiple tenants/landlords).
    * **Conditional Logic:** Fields dynamically show or hide based on previous user selections.
* **Interactive WYSIWYG Preview & Editing:**
    * **2-Step Wizard Flow:** Users first fill out the structured form, then enter a locked-down "Review & Edit" mode with rewarding UX transitions.
    * **Smart Highlighting:** User-entered data is dynamically highlighted in the preview, making it easy to spot and adjust language suffixes or grammar.
    * **Manual Overrides:** The preview document acts as a live text editor (`contentEditable`), allowing users to add, delete, or rewrite paragraphs directly on the document before downloading.
    * **Smart Mobile Navigation:** Features an `IntersectionObserver`-powered floating action button (FAB) that guides mobile users to the preview section seamlessly.
* **Free-to-Use Model:** All document generation services are completely free for the public.
* **Voluntary Support (Shopier):** A sleek Buy Me a Coffee modal appears after successful downloads, integrated with Shopier for voluntary contributions.
* **High-Fidelity PDF Output:** Powered by Browserless.io / Puppeteer for professional, print-ready documents. Manually edited HTML is sanitized and perfectly rendered.
* **Dual Delivery:** Instant browser download combined with automated email delivery.
* **Robust Admin Dashboard (React Admin):**
    * **Analytics:** Real-time tracking of daily and total transaction volumes.
    * **Transaction Management:** Full visibility into every document generation attempt, status, and HTML snapshots.
    * **Manual Invoice Tracking:** Interface to manage and record manual invoices for voluntary supporters.

## Technology Stack

* **Frontend:** React (Vite), React Router, CSS Modules, Axios, Handlebars.js, react-helmet-async.
* **Backend:** Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, Bcrypt, Nodemailer.
* **Admin Panel:** React Admin, Material UI (MUI).
* **Services & Hosting:** Browserless.io (PDF rendering), Shopier (Support gateway), Fly.io / Render (Hosting), SMTP Service.

## Adding New Templates

Templates are stored directly in MongoDB. You can add them via the database GUI or a seed script.

### Template Structure

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Display name of the template |
| `description` | String | Short description shown to users |
| `price` | Number | Set to `0` for free templates |
| `slug` | String | URL-friendly unique identifier (e.g., `konut-kira-sozlesmesi`) |
| `content` | String | HTML/Handlebars template with dynamic placeholders |
| `fields` | Array | Form field definitions |

### Field Types & Examples

#### 1. Basic Fields & Selects
```json
{
    "name": "artis_tipi",
    "label": "Yıllık Kira Artış Yöntemi",
    "fieldType": "select",
    "options": ["TÜFE", "Belirtilen Oran"],
    "required": true
}
```

#### 2. Conditional Field 
```json
{
    "name": "depozito_tutari",
    "label": "Alınan Depozito Tutarı (TL)",
    "fieldType": "number",
    "condition": { "field": "depozito_alindi", "value": "Evet" }
}
```

#### 3. Repeatable Blocks
```json
{
    "name": "kiracilar",
    "label": "Kiracı Bilgileri",
    "fieldType": "repeatable",
    "minInstances": 1,
    "subfields": [
        { "name": "ad_soyad", "label": "Adı Soyadı", "fieldType": "text", "required": true }
    ]
}
```

> **Note:** In your `content`, use `{{#each kiracilar}}` to loop through these blocks:

```handlebars
{{#each kiracilar}}
<div>
    <p>Adı Soyadı: {{this.ad_soyad}}</p>
    <p>T.C. Kimlik No: {{this.tc_no}}</p>
</div>
{{/each}}
```

### Handlebars Helpers in Content

| Helper | Usage |
| :--- | :--- |
| `{{formatDate date}}` | Formats a date object |
| `{{#if (eq a 'b')}}` | Conditional equality check |
| `{{#each array}}` | Loops through repeatable blocks |

**Example with conditional logic:**
```handlebars
{{#if (eq depozito_alindi 'Evet')}}
<p>Kiracı(lar)dan toplam {{depozito_tutari}} TL depozito alınmıştır.</p>
{{else}}
<p>Kiracı(lar)dan depozito alınmamıştır.</p>
{{/if}}
```

### Mandatory Field Requirement

Every template **MUST** include a `belge_email` field for automated email delivery:
```json
{
    "name": "belge_email",
    "label": "E-posta (Belgenin Gönderileceği)",
    "fieldType": "email",
    "required": true
}
```

### Complete JSON Example

<details>
<summary><b>Click here to view a full template JSON (Konut Kira Sözleşmesi)</b></summary>

```json
{
    "name": "Konut Kira Sözleşmesi",
    "description": "Standart konut kiralama işlemleri için gerekli bilgileri içeren sözleşme.",
    "price": 15,
    "slug": "konut-kira-sozlesmesi",
    "content": "<div style='font-family: Inter, sans-serif; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;'>\n<h2>KONUT KİRA SÖZLEŞMESİ</h2>\n\n<p><strong>1. TARAFLAR</strong></p>\n<p><strong>A. KİRAYA VEREN(LER):</strong></p>\n{{#each kiralayanlar}}\n<div style='margin-bottom: 10px;'>\n  <p>Adı Soyadı: {{this.ad_soyad}}</p>\n  <p>T.C. Kimlik No: {{this.tc_no}}</p>\n  <p>Adresi: {{this.adres}}</p>\n</div>\n{{/each}}\n\n<p><strong>B. KİRACI(LAR):</strong></p>\n{{#each kiracilar}}\n<div style='margin-bottom: 10px;'>\n  <p>Adı Soyadı: {{this.ad_soyad}}</p>\n  <p>T.C. Kimlik No: {{this.tc_no}}</p>\n  <p>Adresi: {{this.adres}}</p>\n</div>\n{{/each}}\n\n<p>Kiralanan Adresi: {{kiralanan_adres}}</p>\n\n<p><strong>3. KİRA ARTIŞI</strong></p>\n{{#if (eq artis_tipi 'TÜFE')}}\n<p>Kira bedeli her yıl TÜFE oranında artırılacaktır.</p>\n{{else}}\n<p>Kira bedeli her yıl %{{artis_orani}} oranında artırılacaktır.</p>\n{{/if}}\n</div>",
    "fields": [
        {
            "name": "kiralayanlar",
            "label": "Kiraya Veren Bilgileri",
            "blockTitle": "Kiraya Veren",
            "fieldType": "repeatable",
            "minInstances": 1,
            "subfields": [
                { "name": "ad_soyad", "label": "Adı Soyadı", "fieldType": "text", "required": true }
            ]
        },
        {
            "name": "belge_email",
            "label": "E-posta (Belgenin Gönderileceği)",
            "fieldType": "email",
            "required": true
        }
    ]
}
```
</details> ```

## License

This project is licensed under the **MIT License**. See the [LICENSE](https://github.com/gorkemu/belgehizli/blob/main/LICENSE) file for details.