// Firebase Messaging Service Worker
// Service workers have no access to process.env, so the Firebase config
// must be hardcoded here. These are all NEXT_PUBLIC_* values — already
// present in the browser bundle — so hardcoding is safe.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyAcQ8nmTcdtrZRj4XDR8d4M92vnSWJLfPg",
  authDomain:        "galaboutique-2e3f2.firebaseapp.com",
  projectId:         "galaboutique-2e3f2",
  storageBucket:     "galaboutique-2e3f2.firebasestorage.app",
  messagingSenderId: "266330075362",
  appId:             "1:266330075362:web:fa057b2c05e73986c0aebb",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "GalaBoutique", {
    body:    body  || "New order received",
    icon:    "/icons/icon-192.png",
    badge:   "/icons/icon-192.png",
    tag:     "gala-order",
    renotify: true,
    data:    payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const url = "/en/admin/orders" + (orderId ? "?highlight=" + orderId : "");
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
