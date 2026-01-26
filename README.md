# 🎨 Element Modifier Pro

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**🌐 Languages / Idiomas / שפות:**

[![English](https://img.shields.io/badge/English-blue)](#-element-modifier-pro)
[![Português](https://img.shields.io/badge/Português-green)](#-português)
[![Español](https://img.shields.io/badge/Español-red)](#-español)
[![עברית](https://img.shields.io/badge/עברית-purple)](#-עברית)

---

A Chrome extension to modify HTML element attributes, styles, and properties on any website. Your settings sync across devices via your Google account.

## ✨ Features

- **Modify CSS Styles** — Change colors, fonts, display, width, etc.
- **Modify HTML Attributes** — Change data-*, aria-*, href, src, etc.
- **Add/Remove Classes** — Manipulate CSS classes on elements
- **URL Filtering** — Apply rules only to specific websites
- **Cloud Sync** — Rules sync via Google account (chrome.storage.sync)
- **Import/Export** — Share your rules as JSON files
- **Multi-language** — UI available in 4 languages (auto-detected)

## 🌐 Supported Languages

| Language | Code | Direction |
|----------|------|-----------|
| 🇺🇸 English | `en` | LTR |
| 🇧🇷 Português (Brasil) | `pt_BR` | LTR |
| 🇪🇸 Español | `es` | LTR |
| 🇮🇱 עברית (Hebrew) | `he` | RTL ✓ |

The extension automatically detects your browser language.

## 📦 Installation

### From Source (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **"Developer mode"** (top right corner)
4. Click **"Load unpacked"**
5. Select the extension folder
6. The extension icon will appear in your toolbar! 🎉

### From Chrome Web Store

*Coming soon*

## 🚀 Quick Start

### Creating a Rule

1. Click the extension icon in the toolbar
2. Click **"+ New Rule"**
3. Fill in the fields:
   - **Name**: Rule identifier (e.g., "Hide ads")
   - **CSS Selector**: Elements to modify (e.g., `.ad-banner`, `#sidebar`)
   - **URL Pattern**: Sites where to apply (e.g., `*.google.com` or `*` for all)
4. Add modifications (styles, attributes, or classes)
5. Click **"Save Rule"**

### Examples

#### Hide elements
```
Selector: .advertisement, .ad-banner, [data-ad]
Style: display → none
```

#### Increase font size
```
Selector: article p, .content
Style: font-size → 18px
Style: line-height → 1.8
```

#### Disable autocomplete
```
Selector: input[type="text"], input[type="password"]
Attribute: autocomplete → off
```

#### Make element full width
```
Selector: #main
Style: width → 100%
Style: max-width → 100%
```

## 📝 CSS Selectors Reference

| Selector | Description |
|----------|-------------|
| `#id` | Element by ID |
| `.class` | Elements by class |
| `tag` | Elements by tag name |
| `[attr]` | Elements with attribute |
| `[attr="value"]` | Attribute with specific value |
| `.parent .child` | Descendant |
| `.parent > .child` | Direct child |
| `element:not(.class)` | Negation |

## 🔧 URL Patterns

| Pattern | Matches |
|---------|---------|
| `*` | All websites |
| `*.google.com` | google.com and subdomains |
| `github.com` | Only github.com |
| `*youtube*` | URLs containing "youtube" |

## ⚙️ Settings

### Debug Mode
Enable to see logs in the browser console (F12 > Console).

### Export/Import
- **Export**: Saves all rules to a JSON file
- **Import**: Adds rules from a JSON file to existing ones

## 📁 Project Structure

```
element-modifier-pro/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service Worker
├── content.js             # Script injected into pages
├── popup/
│   ├── popup.html         # User interface
│   ├── popup.css          # Styles
│   └── popup.js           # UI logic
├── _locales/
│   ├── en/messages.json   # English
│   ├── pt_BR/messages.json # Portuguese (Brazil)
│   ├── es/messages.json   # Spanish
│   └── he/messages.json   # Hebrew (RTL)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🛡️ Privacy & Security

- ✅ **No data collection** — Everything stays local in your browser
- ✅ **No external servers** — Rules sync via Google's infrastructure only
- ✅ **No tracking** — We don't track your browsing
- ✅ **Open source** — Code is fully auditable
- ✅ **Minimal permissions** — Only uses what's necessary

## 📊 Storage Limits

Chrome sync storage has a **100KB** limit. Each rule uses approximately 500 bytes.
This allows storing **~200 rules**.

## 🐛 Troubleshooting

### Rule doesn't work
1. Check if the rule is **enabled** ✓
2. Test the selector with the **"Test"** button
3. Verify the **URL pattern**
4. Reload the page (F5)

### Extension doesn't load on some sites
- Doesn't work on `chrome://` or internal Chrome pages
- Some pages may block extensions (corporate policies)

### Changes don't appear
1. Click **"↻ Reapply"** in the popup
2. Or reload the page

## 📄 License

MIT License — Feel free to use, modify, and distribute.

---

## 🇧🇷 Português

### Sobre

Uma extensão Chrome para modificar atributos, estilos e propriedades de elementos HTML em qualquer site. Suas configurações são sincronizadas entre dispositivos via sua conta Google.

### Instalação

1. Baixe ou clone este repositório
2. Acesse `chrome://extensions/`
3. Ative o **"Modo do desenvolvedor"**
4. Clique em **"Carregar sem compactação"**
5. Selecione a pasta da extensão

### Idiomas Suportados

A extensão detecta automaticamente o idioma do navegador e suporta:
- 🇺🇸 Inglês
- 🇧🇷 Português (Brasil)
- 🇪🇸 Espanhol
- 🇮🇱 Hebraico (com suporte RTL)

---

## 🇪🇸 Español

### Acerca de

Una extensión de Chrome para modificar atributos, estilos y propiedades de elementos HTML en cualquier sitio web. Tu configuración se sincroniza entre dispositivos a través de tu cuenta de Google.

### Instalación

1. Descarga o clona este repositorio
2. Ve a `chrome://extensions/`
3. Activa el **"Modo de desarrollador"**
4. Haz clic en **"Cargar descomprimida"**
5. Selecciona la carpeta de la extensión

### Idiomas Soportados

La extensión detecta automáticamente el idioma del navegador y soporta:
- 🇺🇸 Inglés
- 🇧🇷 Portugués (Brasil)
- 🇪🇸 Español
- 🇮🇱 Hebreo (con soporte RTL)

---

## 🇮🇱 עברית

### אודות

תוסף Chrome לשינוי תכונות, סגנונות ומאפיינים של אלמנטי HTML בכל אתר. ההגדרות שלך מסונכרנות בין מכשירים דרך חשבון Google שלך.

### התקנה

1. הורד או שכפל את המאגר הזה
2. עבור אל `chrome://extensions/`
3. הפעל את **"מצב מפתח"**
4. לחץ על **"טען תוסף לא ארוז"**
5. בחר את תיקיית התוסף

### שפות נתמכות

התוסף מזהה אוטומטית את שפת הדפדפן ותומך ב:
- 🇺🇸 אנגלית
- 🇧🇷 פורטוגזית (ברזיל)
- 🇪🇸 ספרדית
- 🇮🇱 עברית (עם תמיכה ב-RTL)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Made with ❤️ for web productivity
