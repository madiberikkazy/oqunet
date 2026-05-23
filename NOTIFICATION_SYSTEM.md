# Notification System Improvements - Documentation

## Overview

The notification system has been significantly improved with real-time notifications, customizable sound alerts, and browser notifications support.

## Key Features

### 1. **Real-Time Notifications**
- Notifications are polled every 3 seconds from Firebase
- New notifications appear as toast popups at the top of the page
- Unread notification count displayed in the navigation bar badge
- Badge shows count (9+ for values greater than 9)

### 2. **Sound Notifications**
Users can select from 6 system sounds or choose silent mode:
- **Bell** - Classic bell notification sound
- **Chime** - Musical chime (3 ascending tones)
- **Ding** - Sharp single tone
- **Ping** - High-frequency alert
- **Pop** - Brief pop sound
- **Alert** - Double alert tone
- **None (Silent)** - No sound

Sounds are generated using Web Audio API for low latency and no file dependencies.

### 3. **Browser Notifications**
- Native browser push notifications (when user grants permission)
- Works even when app is not in focus
- Auto-closes after 5 seconds
- Shows notification title and body

### 4. **Notification Preferences**
Users can customize notifications in Settings:
- Enable/disable all notifications
- Enable/disable sound effects
- Select notification sound
- Enable/disable browser notifications
- Request browser notification permissions

### 5. **Navigation Badge**
- Red notification badge on the notification icon in bottom navigation
- Shows unread notification count
- Updates in real-time

### 6. **Notification Toast**
- Non-intrusive toast notification at top of page
- Shows for new unread notifications
- Can be dismissed manually
- Auto-hides after 5 seconds

## Implementation Details

### New Files Created
- `src/utils/notificationService.js` - Core notification service
- `src/contexts/NotificationContext.jsx` - Real-time notification management
- `src/components/NotificationToast.jsx` - Toast notification component

### Modified Files
- `src/main.jsx` - Added NotificationProvider
- `src/App.jsx` - Added NotificationToast component
- `src/components/BottomNav.jsx` - Added unread notification badge
- `src/pages/user/Settings.jsx` - Enhanced notification preferences
- `src/pages/user/Notification.jsx` - Updated to use NotificationContext
- `src/pages/admin/AdminNotification.jsx` - Updated to use NotificationContext

## Usage

### For Users
1. Go to Settings (`/settings`)
2. Scroll to "Notifications" section
3. Toggle "Notifications" to enable/disable all notifications
4. If enabled:
   - Toggle "Sound Effects" to enable/disable sounds
   - Select a notification sound from dropdown
   - For browser notifications:
     - If not enabled, click "Request Permission" button
     - Toggle "Browser Notifications" if permission is granted

### For Developers
#### Using NotificationContext
```javascript
import { useNotifications } from '../contexts/NotificationContext.jsx';

function MyComponent() {
  const { notifications, unreadCount, loadNotifications } = useNotifications();
  
  // notifications: array of notification objects
  // unreadCount: number of unread notifications
  // loadNotifications: function to refresh notifications
}
```

#### Sending Notifications
```javascript
import { sendNotification } from '../utils/notificationService.js';

// Send notification with sound and browser notification
await sendNotification('New Message', {
  body: 'You have a new message',
  tag: 'message-1' // Optional: groups notifications
});
```

#### Playing Sound Only
```javascript
import { playNotificationSound } from '../utils/notificationService.js';

playNotificationSound('bell'); // bell, chime, ding, ping, pop, alert, or none
```

#### Managing Preferences
```javascript
import { 
  loadNotificationPreferences, 
  saveNotificationPreferences 
} from '../utils/notificationService.js';

const prefs = loadNotificationPreferences();
// prefs = { 
//   soundEnabled: boolean, 
//   selectedSound: string, 
//   browserNotificationsEnabled: boolean,
//   notificationsEnabled: boolean 
// }

prefs.soundEnabled = false;
saveNotificationPreferences(prefs);
```

## Notification Flow

```
User receives notification from Firebase
         ↓
NotificationContext polls and detects new unread notification
         ↓
sendNotification() is called
         ↓
   ┌─────────┴──────────┐
   ↓                    ↓
Play Sound      Show Browser Notification
   ↓                    ↓
(if enabled)      (if enabled & permission granted)
   ↓
Show Toast Notification
   ↓
Update Navigation Badge
```

## Browser Support

- **Sound Notifications**: All modern browsers (uses Web Audio API)
- **Browser Notifications**: Chrome, Firefox, Safari, Edge (requires HTTPS in production)
- **Graceful Fallback**: If browser doesn't support notifications, system falls back to toast only

## Preferences Storage

All notification preferences are stored in browser's localStorage:
- Key: `notificationPreferences`
- Format: JSON
- Persists across sessions
- Can be cleared via browser DevTools

## Future Enhancements

Possible improvements:
- Service Worker integration for offline notifications
- Custom sound file uploads
- Notification scheduling
- Sound volume control
- Notification grouping/categorization
- Rich notifications with actions/buttons
- Sound testing button in Settings
- Notification history
- Do Not Disturb mode with time-based rules

## Troubleshooting

### Browser notifications not showing
1. Check if permission is granted in browser settings
2. Verify "Browser Notifications" is enabled in app settings
3. Check if browser supports notifications (HTTPS required)
4. Try requesting permission again

### Sounds not playing
1. Check if "Sound Effects" is enabled in Settings
2. Verify selected sound is not "None (Silent)"
3. Check browser volume settings
4. Check if page has user interaction (required for Web Audio API)

### Badge not showing
1. Check if unread notifications exist
2. Verify NotificationContext is properly loaded
3. Check if "Notifications" is enabled in Settings

## Performance Notes

- Notification polling interval: 3 seconds (configurable in NotificationContext)
- Toast auto-hide: 5 seconds (configurable in NotificationToast)
- Sounds are generated in real-time (minimal memory overhead)
- Browser notifications are native OS calls (minimal impact)
