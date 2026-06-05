# PWA Quick Start Guide

## ✅ PWA Features Implemented

Your OquNet application is now a full Progressive Web App with:

- 📱 **Install to Home Screen** - Works on mobile & desktop
- 🌐 **Offline Support** - Browse cached content offline
- ⚡ **Fast Loading** - Smart caching strategies
- 🔔 **Push Notifications** - Real-time alerts
- 💾 **Storage Management** - Control cache and storage
- 🔄 **Background Sync** - Sync when back online
- ⚙️ **Settings UI** - Easy configuration

## 🚀 Quick Setup

### 1. Build the App
```bash
npm run build
```

### 2. Test Locally
```bash
npm run dev
```

### 3. Install PWA (Desktop)
- **Chrome**: Click "Install" in address bar (or ⋮ → Install app)
- **Edge**: Click "Install" in address bar (or ⋮ → Install this app)
- **Firefox**: Right-click → "Install app"

### 4. Install PWA (Mobile)
- **Android Chrome**: ⋮ → "Install app"
- **iPhone Safari**: Share → "Add to Home Screen"
- **Android Firefox**: ⋮ → "Install"

## 📖 Usage Guide

### Users

#### Access Settings
1. Open the app
2. Bottom navigation → Profile icon
3. Settings page
4. Scroll to "Application" section

#### Manage Cache
1. Settings → Application section
2. View cache size
3. Click "Clear" to free space

#### Install App
1. Settings → Application section
2. Click "Install app" button
3. Confirm installation
4. App will appear on home screen

#### Use Offline
1. Turn off internet or Airplane Mode
2. App continues to work
3. Cached content is available
4. Orange banner shows offline status

#### Enable Notifications
1. Settings → Notifications
2. Toggle notifications on
3. Grant permission when prompted
4. Receive push notifications

### Developers

#### Check Installation
```javascript
import { isAppInstalled } from '../utils/pwaUtils.js';

if (isAppInstalled()) {
  console.log('Running as installed app');
} else {
  console.log('Running in browser');
}
```

#### Handle Offline
```javascript
import { onOnlineStatusChange } from '../utils/pwaUtils.js';

const unsubscribe = onOnlineStatusChange((online) => {
  if (online) {
    console.log('Back online, syncing data...');
    syncData();
  } else {
    console.log('Going offline');
  }
});

// Cleanup
unsubscribe();
```

#### Show Install Prompt
```javascript
import { isInstallPromptAvailable, promptInstall } from '../utils/pwaUtils.js';

if (isInstallPromptAvailable()) {
  const button = document.querySelector('#install-btn');
  button.style.display = 'block';
  button.addEventListener('click', async () => {
    const installed = await promptInstall();
    if (installed) {
      button.style.display = 'none';
    }
  });
}
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `public/sw.js` | Service Worker - handles caching & offline |
| `public/manifest.json` | App metadata & icons |
| `src/utils/pwaUtils.js` | PWA utility functions |
| `src/components/PWASettings.jsx` | PWA settings UI |
| `src/components/OfflineIndicator.jsx` | Offline banner |
| `index.html` | PWA meta tags & registration |

## 🔍 Testing

### Check Service Worker Status
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Service Workers"
4. You should see `/sw.js` with status "activated"

### Test Offline Mode
1. DevTools → Network tab
2. Check "Offline" checkbox
3. Refresh page
4. App should still work!
5. See cached content

### Test on Device
1. Build: `npm run build`
2. Deploy to HTTPS server (PWA requires HTTPS)
3. Visit on mobile
4. Install via browser menu
5. Launch from home screen

## 📊 Caching Strategies

| Resource | Strategy | Details |
|----------|----------|---------|
| Images | Cache-First | Fast, updates in background |
| API | Network-First | Fresh data, falls back to cache |
| JS/CSS | Cache-First | Static assets, rarely change |
| HTML | Cache-First | With background update |

## 🔒 Production Setup

### HTTPS
PWA requires HTTPS. Set up with:
- **Netlify** (automatic HTTPS)
- **Vercel** (automatic HTTPS)
- **Firebase Hosting** (automatic HTTPS)
- **Self-hosted** (use Let's Encrypt)

### Performance
Typical metrics:
- First load: 2-3 seconds
- Repeat loads: 0.5 seconds
- Offline: instant

## ✨ Features by Platform

### Android
- ✅ Install to home screen
- ✅ Works offline
- ✅ Push notifications
- ✅ Background sync
- ✅ App shortcuts

### iPhone/iPad
- ✅ Install to home screen (Web Clip)
- ✅ Works offline
- ✅ Standalone mode (iOS 16.4+)
- ⚠️ Push notifications (limited)

### Desktop
- ✅ Install to start menu / dock
- ✅ Works offline
- ✅ Push notifications
- ✅ Background sync
- ✅ Windows / macOS / Linux

## 🐛 Common Issues

### App Won't Install
**Check:**
- ✅ HTTPS enabled (or localhost)
- ✅ Service worker registered
- ✅ Manifest.json is valid
- ✅ Icons are present

### Not Working Offline
**Solutions:**
1. Check Service Workers status (DevTools)
2. Clear cache and reload
3. Check network tab for failed requests
4. Verify SW is activated

### Cache Issues
**Fix:**
1. DevTools → Application → Clear site data
2. Hard refresh (Ctrl+Shift+R)
3. Uninstall and reinstall app

## 📞 Support

For issues:
1. Check browser console for errors
2. Open DevTools → Application tab
3. Check Service Worker status
4. Review cache storage
5. Test offline mode

## 📚 Learn More

- [PWA Complete Guide](PWA_IMPLEMENTATION.md)
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Guide](https://web.dev/progressive-web-apps/)

---

**PWA is Ready!** 🎉

Your app can now be:
- 📱 Installed on any device
- 🌐 Used offline
- ⚡ Loaded fast
- 🔔 Send notifications

Enjoy your Progressive Web App! 🚀
