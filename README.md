# ChipVerse PWA 🚀

> **Progressive Web App** — installable, offline-capable, lightning fast.
> Hosted on GitHub Pages · Backend on Render

[![Deploy to GitHub Pages](https://github.com/devanshdj72/chipverse-pwa/actions/workflows/deploy.yml/badge.svg)](https://github.com/devanshdj72/chipverse-pwa/actions/workflows/deploy.yml)

---

## 🌐 Live
**[https://devanshdj72.github.io/chipverse-pwa](https://devanshdj72.github.io/chipverse-pwa)**

---

## ✨ PWA Features
- 📲 **Installable** — add to home screen on any device (iOS, Android, Desktop)
- ⚡ **Cached** — app shell & assets cached for instant loads
- 📶 **Offline fallback** — shows last cached content when offline
- 🔔 **Push notifications** — ready for future notifications
- 🔄 **Auto-updates** — service worker checks for updates every 60s

---

## 🛠️ Tech Stack
- **React 19 + Vite 7 + TypeScript**
- **Tailwind CSS v4**
- **framer-motion** animations
- **wouter** routing
- **Service Worker** (custom, in `/public/sw.js`)
- **Web App Manifest** (`/public/manifest.json`)

---

## 🚀 Deploy (automatic)
Every push to `main` triggers GitHub Actions → builds → deploys to GitHub Pages.

### Setup once:
1. Go to repo **Settings → Pages → Source → GitHub Actions**
2. Add secret: **Settings → Secrets → `VITE_API_URL`** = your Render backend URL

---

## 💻 Local Dev
```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → ./dist
```

---

## 📁 Repo Structure
```
chipverse-pwa/
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker
│   └── icons/               # App icons (192, 512)
├── src/
│   ├── main.tsx             # Entry + SW registration
│   ├── App.tsx              # Router
│   ├── components/          # UI components
│   ├── pages/               # Route pages
│   └── lib/                 # Utils, hooks, data
├── .github/workflows/
│   └── deploy.yml           # Auto-deploy to GitHub Pages
└── vite.config.ts
```

---

## 🔗 Related
- **Main repo (fullstack):** [github.com/devanshdj72/chipverse](https://github.com/devanshdj72/chipverse)
- **Backend:** Hosted on Render
