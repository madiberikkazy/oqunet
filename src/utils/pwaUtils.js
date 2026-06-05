/**
 * PWA Utilities
 * Helper functions for PWA features like install prompts, offline detection, cache management
 */

// Check if app is PWA capable
export function isPWACapable() {
  return 'serviceWorker' in navigator && 'caches' in window;
}

// Check if app is installed
export function isAppInstalled() {
  // Check if running as standalone (installed PWA)
  if (window.navigator.standalone === true) {
    return true; // iOS
  }

  // Check if running with display-mode: standalone (Android/Desktop)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  return false;
}

// Check if offline
export function isOffline() {
  return !navigator.onLine;
}

// Listen for online/offline changes
export function onOnlineStatusChange(callback) {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));

  return () => {
    window.removeEventListener('online', () => callback(true));
    window.removeEventListener('offline', () => callback(false));
  };
}

// Get the deferred install prompt
export function getDeferredInstallPrompt() {
  return window.deferredInstallPrompt;
}

// Trigger install prompt
export async function promptInstall() {
  const deferredPrompt = window.deferredInstallPrompt;
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('User install choice:', outcome);

  window.deferredInstallPrompt = null;
  return outcome === 'accepted';
}

// Check if install prompt is available
export function isInstallPromptAvailable() {
  return !!window.deferredInstallPrompt;
}

// Clear all cache
export async function clearAllCache() {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('All caches cleared');
    return true;
  } catch (err) {
    console.error('Failed to clear cache:', err);
    return false;
  }
}

// Get cache size
export async function getCacheSize() {
  if (!('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (err) {
    console.error('Failed to get cache size:', err);
    return 0;
  }
}

// Format bytes to human readable
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Request persistent storage
export async function requestPersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) {
    return false;
  }

  try {
    const persistent = await navigator.storage.persist();
    console.log('Persistent storage:', persistent ? 'granted' : 'denied');
    return persistent;
  } catch (err) {
    console.error('Failed to request persistent storage:', err);
    return false;
  }
}

// Check if persistent storage is available
export async function isPersistentStorageAvailable() {
  if (!navigator.storage || !navigator.storage.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (err) {
    console.error('Failed to check persistent storage:', err);
    return false;
  }
}

// Get storage estimate
export async function getStorageEstimate() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    return await navigator.storage.estimate();
  } catch (err) {
    console.error('Failed to get storage estimate:', err);
    return null;
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(vapidPublicKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('Push subscription successful:', subscription);
    return subscription;
  } catch (err) {
    console.error('Failed to subscribe to push notifications:', err);
    return null;
  }
}

// Check if push notifications are supported
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Convert VAPID key from base64
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Register for background sync
export async function registerBackgroundSync(tag) {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('Background sync registered for tag:', tag);
    return true;
  } catch (err) {
    console.error('Failed to register background sync:', err);
    return false;
  }
}

// Communicate with service worker
export function sendMessageToServiceWorker(message) {
  if (!('controller' in navigator.serviceWorker)) {
    return Promise.reject(new Error('No active service worker'));
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
  });
}

// Check update availability
export async function checkForServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return registration.waiting !== null;
  } catch (err) {
    console.error('Failed to check for updates:', err);
    return false;
  }
}

// Skip waiting and reload
export async function installServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload once the new service worker activates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to install service worker update:', err);
    return false;
  }
}

// Get PWA info
export async function getPWAInfo() {
  const info = {
    isInstalled: isAppInstalled(),
    isOnline: !isOffline(),
    isPWACapable: isPWACapable(),
    isInstallPromptAvailable: isInstallPromptAvailable(),
    isPushSupported: isPushNotificationSupported(),
    persistentStorageAvailable: await isPersistentStorageAvailable(),
    cacheSize: formatBytes(await getCacheSize()),
    storageEstimate: await getStorageEstimate(),
  };

  return info;
}

console.log('[PWA] PWA utilities loaded');
