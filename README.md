# 🎨 Element Modifier Pro

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/fdifpejgoddobdcpglbpepmdmbpombgd)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**🌐 Languages / Idiomas / שפות:**
[![English](https://img.shields.io/badge/English-blue)](#-element-modifier-pro)
[![Português](https://img.shields.io/badge/Português-green)](#-português)
[![Español](https://img.shields.io/badge/Español-red)](#-español)
[![עברית](https://img.shields.io/badge/עברית-purple)](#-עברית)

---

A Chrome extension to modify HTML element attributes, styles, and properties on any website. Rules sync across devices via your Google account.

## ✨ Features

- **Modify CSS styles** — colors, fonts, display, dimensions, and more
- **Modify HTML attributes** — `data-*`, `aria-*`, `href`, `src`, etc.
- **Add/Remove CSS classes** — manipulate class lists on any element
- **URL filtering** — apply rules only to specific websites
- **Cloud sync** — rules sync via Google account (`chrome.storage.sync`)
- **Import/Export** — share rule sets as JSON files
- **Multi-language UI** — auto-detected from your browser settings

## 🌐 Supported Languages

| Language | Code | Direction |
|---|---|---|
| 🇺🇸 English | `en` | LTR |
| 🇧🇷 Português (Brasil) | `pt_BR` | LTR |
| 🇪🇸 Español | `es` | LTR |
| 🇮🇱 עברית (Hebrew) | `he` | RTL ✓ |

## 📦 Installation

### Chrome Web Store

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/fdifpejgoddobdcpglbpepmdmbpombgd)** — recommended for most users.

### From Source (Developer Mode)

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the extension folder
6. Done — the extension icon will appear in your toolbar 🎉

## 🚀 Quick Start

### Creating a Rule

1. Click the extension icon in the toolbar
2. Click **+ New Rule**
3. Fill in the fields:
   - **Name** — rule identifier (e.g., "Hide ads")
   - **CSS Selector** — target elements (e.g., `.ad-banner`, `#sidebar`)
   - **URL Pattern** — where to apply (e.g., `*.google.com` or `*` for all sites)
4. Add modifications (styles, attributes, or classes)
5. Click **Save Rule**

### Examples

**Hide elements:**
```
Selector:  .advertisement, .ad-banner, [data-ad]
Style:     display → none
```

**Increase font size:**
```
Selector:  article p, .content
Style:     font-size → 18px
Style:     line-height → 1.8
```

**Disable autocomplete:**
```
Selector:  input[type="text"], input[type="password"]
Attribute: autocomplete → off
```

**Make element full width:**
```
Selector:  #main
Style:     width → 100%
Style:     max-width → 100%
```

## 📝 CSS Selectors Reference

| Selector | Description |
|---|---|
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
|---|---|
| `*` | All websites |
| `*.google.com` | google.com and subdomains |
| `github.com` | Only github.com |
| `*youtube*` | URLs containing "youtube" |

## ⚙️ Settings

**Debug Mode** — enable to see logs in the browser console (`F12` → Console).

**Export/Import:**
- **Export** saves all rules to a JSON file
- **Import** merges rules from a JSON file into your existing set

## 📁 Project Structure

```
element-modifier-pro/
├── manifest.json            # Extension manifest (V3)
├── background.js            # Service Worker
├── content.js               # Script injected into pages
├── popup/
│   ├── popup.html           # Extension popup UI
│   ├── popup.css            # Popup styles
│   └── popup.js             # Popup logic
├── _locales/
│   ├── en/messages.json     # English
│   ├── pt_BR/messages.json  # Portuguese (Brazil)
│   ├── es/messages.json     # Spanish
│   └── he/messages.json     # Hebrew (RTL)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🛡️ Privacy & Security

- **No data collection** — everything stays local in your browser
- **No external servers** — rules sync only via Google's infrastructure
- **No tracking** — browsing activity is never monitored
- **Open source** — code is fully auditable
- **Minimal permissions** — only requests what's strictly necessary

## 📊 Storage Limits

Chrome sync storage has a **100 KB** limit. Each rule uses approximately 500 bytes, allowing ~200 rules.

## 🐛 Troubleshooting

**Rule doesn't work?**
1. Check if the rule is enabled ✓
2. Test the selector with the **Test** button
3. Verify the URL pattern matches the current site
4. Reload the page (`F5`)

**Extension doesn't load on some sites?**
- Chrome internal pages (`chrome://`) are not supported
- Some corporate-managed pages may block extensions

**Changes don't appear?**
1. Click **↻ Reapply** in the popup
2. Or reload the page (`Ctrl+R` / `Cmd+R`)

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[MIT](https://opensource.org/licenses/MIT) — free to use, modify, and distribute.

---

## 🇧🇷 Português

Uma extensão Chrome para modificar atributos, estilos e propriedades de elementos HTML em qualquer site. Suas configurações são sincronizadas entre dispositivos via conta Google.

### Instalação

**[Instalar pela Chrome Web Store](https://chromewebstore.google.com/detail/fdifpejgoddobdcpglbpepmdmbpombgd)** — recomendado para a maioria dos usuários.

<details>
<summary>Instalação manual (modo desenvolvedor)</summary>

1. Baixe ou clone este repositório
2. Acesse `chrome://extensions/`
3. Ative o **Modo do desenvolvedor**
4. Clique em **Carregar sem compactação**
5. Selecione a pasta da extensão

</details>

### Idiomas Suportados

A extensão detecta automaticamente o idioma do navegador: inglês, português (Brasil), espanhol e hebraico (com suporte RTL).

---

## 🇪🇸 Español

Una extensión de Chrome para modificar atributos, estilos y propiedades de elementos HTML en cualquier sitio web. Tu configuración se sincroniza entre dispositivos a través de tu cuenta de Google.

### Instalación

**[Instalar desde Chrome Web Store](https://chromewebstore.google.com/detail/fdifpejgoddobdcpglbpepmdmbpombgd)** — recomendado para la mayoría de los usuarios.

<details>
<summary>Instalación manual (modo desarrollador)</summary>

1. Descarga o clona este repositorio
2. Ve a `chrome://extensions/`
3. Activa el **Modo de desarrollador**
4. Haz clic en **Cargar descomprimida**
5. Selecciona la carpeta de la extensión

</details>

### Idiomas Soportados

La extensión detecta automáticamente el idioma del navegador: inglés, portugués (Brasil), español y hebreo (con soporte RTL).

---

## 🇮🇱 עברית

תוסף Chrome לשינוי תכונות, סגנונות ומאפיינים של אלמנטי HTML בכל אתר. ההגדרות שלך מסונכרנות בין מכשירים דרך חשבון Google שלך.

### התקנה

**[התקנה מחנות האינטרנט של Chrome](https://chromewebstore.google.com/detail/fdifpejgoddobdcpglbpepmdmbpombgd)** — מומלץ לרוב המשתמשים.

<details>
<summary>התקנה ידנית (מצב מפתח)</summary>

1. הורד או שכפל את המאגר הזה
2. עבור אל `chrome://extensions/`
3. הפעל את **מצב מפתח**
4. לחץ על **טען תוסף לא ארוז**
5. בחר את תיקיית התוסף

</details>

### שפות נתמכות

התוסף מזהה אוטומטית את שפת הדפדפן: אנגלית, פורטוגזית (ברזיל), ספרדית ועברית (עם תמיכה ב-RTL).

---

<div align="center">

Made with ❤️ for web productivity

</div>
