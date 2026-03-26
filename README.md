# Belge Hızlı (Contract-Generator)

Belge Hızlı is a modern, full-stack web application designed to help users generate legal contracts, petitions, and official documents in PDF format within seconds using dynamic templates. The platform operates on a Public Service model—offering high-quality legal tools for free, supported by voluntary user contributions.

## Key Features

* **Dynamic Template System:** Add or update contract types directly via MongoDB without any code changes.
* **Advanced Form Generation:**
    * **Auto-UI:** Forms are automatically generated based on template field definitions.
    * **Repeatable Blocks:** Supports multiple instances of field groups (e.g., adding multiple tenants/landlords).
    * **Conditional Logic:** Fields dynamically show or hide based on previous user selections.
* **Interactive WYSIWYG Preview & Editing:**
    * **2-Step Wizard Flow:** Users first fill out the structured form, then enter a locked-down "Review & Edit" mode.
    * **Smart Highlighting:** User-entered data is dynamically highlighted in the preview, making it easy to spot and adjust language suffixes or grammar.
    * **Manual Overrides:** The preview document acts as a live text editor (`contentEditable`), allowing users to add, delete, or rewrite paragraphs directly on the document before downloading.
    * **Smart Mobile Navigation:** Features an `IntersectionObserver`-powered floating action button (FAB) that guides mobile users to the preview section seamlessly.
* **Free-to-Use Model:** All document generation services are completely free for the public.
* **Voluntary Support (Shopier):** A sleek Buy Me a Coffee modal appears after successful downloads, integrated with Shopier for voluntary contributions.
* **Legal Compliance & Logging:**
    * Mandatory consent for Terms of Service and Privacy Policy before generation.
    * **Consent Logs:** Records user IP, User-Agent, timestamp, and document version for legal audit trails.
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

## Live Links

* **Platform:** https://www.belgehizli.com/

## Adding New Templates

Manage templates directly in the MongoDB templates collection. Key fields: name, description, price (set to 0 for free), content (HTML/Handlebars), and fields.

* **Field Object:** name, label, fieldType ("text", "textarea", "number", "date", "select", "radio", "email", "checkbox", "repeatable"), required, placeholder, options, condition: {field, value}.
* **Note:** For automated email delivery, ensure the template includes a belge_email field (type: email).

## Scripts & Setup

* **Backend:** npm start (production), npm run dev (development)
* **Frontend:** npm run dev (development), npm run build (build for production)
* **Admin:** npm start

## License

This project is licensed under the **MIT License**. See the [LICENSE](https://github.com/gorkemu/belgehizli/blob/main/LICENSE) file for details.