# Belge Hızlı (Smart Document & Template Builder)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Visit Website](https://img.shields.io/badge/🌐_Visit_Website-belgehizli.com-0d6efd)](https://www.belgehizli.com/)

Belge Hızlı is a full-stack SaaS platform designed to help users create, manage, and generate legal contracts, petitions, and official documents. 

## Key Features

### Smart Template Builder
* **All-in-One Editor:** A unified workspace where formatting, logic, and form questions live side-by-side. 
* **Magic Variable Detection:** Automatically detects variables in multiple formats (e.g., `{{variable}}`, `[variable]`, `@variable`, `<<variable>>`) and converts them into dynamic form questions with a single click.
* **Slash Commands:** Type `/` to quickly insert headings, lists, dividers and signature blocks.
* **Atmosphere Themes:** 8 different visual themes (Midnight, Ink, Forest, Sunset, etc.) to personalize the writing environment.

### Dynamic Form Engine
* **Auto-UI:** Forms are automatically generated based on the variables set in the Template Builder.
* **Conditional Logic:** Document paragraphs dynamically show or hide based on specific answers provided in the form.
* **Public Sharing:** Generate a link to let clients or partners fill out the form and download the final PDF without needing an account.

### PDF Generation & Delivery
* **High-Fidelity PDF Output:** Powered by Puppeteer / Browserless.io for print-ready documents.
* **Instant Download:** Form data is injected directly into the HTML using Handlebars.js and instantly converted to PDF.

## Technology Stack

* **Frontend:** React (Vite), React Router v6, CSS Modules, Tiptap (ProseMirror), Handlebars.js, React-Helmet-Async.
* **Backend:** Node.js, Express.js, MongoDB Atlas, Mongoose, JWT.
* **Services & Hosting:** Browserless.io (PDF rendering), Vercel (Frontend), Render (Backend).

## License

This project is licensed under the **MIT License**. See the [LICENSE](https://github.com/gorkemu/belgehizli/blob/main/LICENSE) file for details.