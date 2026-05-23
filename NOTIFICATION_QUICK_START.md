# Notification System - Quick Start Guide

## What's New

✅ **Real-Time Notifications** - Notifications appear instantly as toasts at the top of the page
✅ **Sound Alerts** - Choose from 6 different system sounds or silent mode
✅ **Browser Notifications** - Native OS notifications with user permission
✅ **Navigation Badge** - See unread notification count in bottom nav
✅ **Customizable Settings** - Full control in Settings page
✅ **Persistent Preferences** - Settings saved to browser storage

## Quick Setup

1. **Build & Run**
   ```bash
   npm run dev
   ```

2. **Access Settings**
   - Login to app
   - Go to Settings (bottom nav → Profile → Settings)
   - Scroll down to "Notifications" section

3. **Configure Notifications**
   - Toggle notifications on/off
   - Enable/disable sounds
   - Select notification sound from dropdown
   - Request browser notification permission

## How It Works

### For End Users

**Receiving Notifications:**
1. When a notification is sent, you'll see:
   - 🔔 Toast notification at the top of the page
   - 🔊 Selected sound plays (if enabled)
   - 🔘 Badge updates in nav bar with unread count
   - 📬 Browser notification (if enabled & permitted)

**Managing Notifications:**
- Check all notifications in Notifications page
- Mark as read or delete notifications
- Customize sound/browser settings anytime

### For Developers

**To Send a Notification:**
```javascript
import { sendNotification } from '../utils/notificationService.js';

await sendNotification('New Book Request', {
  body: 'Someone wants to borrow your book',
  tag: 'book-request-123'
});
```

**To Access Notification State:**
```javascript
import { useNotifications } from '../contexts/NotificationContext.jsx';

const { notifications, unreadCount, loadNotifications } = useNotifications();
```

**Notification Preferences:**
```javascript
import { 
  loadNotificationPreferences,
  saveNotificationPreferences,
  NOTIFICATION_SOUNDS 
} from '../utils/notificationService.js';

const prefs = loadNotificationPreferences();
console.log('Selected sound:', prefs.selectedSound); // 'bell', 'chime', etc.
console.log('Sound enabled:', prefs.soundEnabled);
console.log('Browser notifications:', prefs.browserNotificationsEnabled);
```

## Sound Options

| Sound | Description |
|-------|-------------|
| 🔔 Bell | Classic bell sound (2 tones) |
| 🎵 Chime | Musical chime (3 ascending tones) |
| ⏰ Ding | Sharp single bell tone |
| 📍 Ping | High-frequency short tone |
| 💥 Pop | Brief pop sound |
| ⚠️ Alert | Double alert tone |
| 🔇 None | Silent (no sound) |

## File Structure

```
src/
├── utils/
│   └── notificationService.js          # Core notification logic
├── contexts/
│   └── NotificationContext.jsx         # Real-time notification state
├── components/
│   ├── NotificationToast.jsx           # Toast notification UI
│   └── BottomNav.jsx                   # Updated with badge
├── pages/
│   ├── user/
│   │   ├── Settings.jsx                # Notification preferences
│   │   └── Notification.jsx            # Updated for real-time
│   └── admin/
│       └── AdminNotification.jsx       # Updated for real-time
├── App.jsx                              # Updated with NotificationToast
└── main.jsx                             # Updated with NotificationProvider
```

## Key Components

### NotificationService (`notificationService.js`)
- Core business logic
- Sound generation using Web Audio API
- Browser notification API wrapper
- Preferences management

### NotificationContext (`NotificationContext.jsx`)
- Real-time notification polling (3 sec intervals)
- Manages unread count
- Auto-triggers browser notifications
- Provides `useNotifications()` hook

### NotificationToast (`NotificationToast.jsx`)
- Visual toast component
- Shows newest unread notification
- Auto-hides after 5 seconds
- Global component in App

## Browser Compatibility

| Feature | Support |
|---------|---------|
| Sound Notifications | ✅ All modern browsers |
| Browser Notifications | ✅ Chrome, Firefox, Safari, Edge |
| Preferences Storage | ✅ All with localStorage |
| Web Audio API | ✅ All modern browsers |

## Performance

- **Polling Interval**: 3 seconds (fast, minimal overhead)
- **Toast Display**: 5 seconds (auto-hide)
- **Sound Generation**: Real-time (no files, instant)
- **Storage**: ~500 bytes localStorage
- **Build Size**: No additional dependencies

## Troubleshooting

**Notifications not showing?**
- Check if notifications are enabled in Settings
- Verify browser has focus (some browsers require this)
- Check browser notification permission

**Sounds not playing?**
- Sound effects must be enabled in Settings
- Selected sound cannot be "None (Silent)"
- Browser must have audio permission
- Check volume settings

**Badge not updating?**
- Refresh the page
- Check if notifications exist and are unread
- Verify NotificationContext is initialized

## Next Steps

1. Users should go to Settings and enable notifications
2. Grant browser notification permission when prompted
3. Select their preferred sound
4. Enjoy real-time notifications!

---

For detailed API documentation, see [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)
