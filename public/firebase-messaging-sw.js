// Firebase Messaging Service Worker — handles background FCM messages

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Config is injected at runtime via a self.__FIREBASE_CONFIG global
// or hardcoded here for the SW context (env vars are not available in SW scope)
firebase.initializeApp({
  apiKey:            self.__FIREBASE_CONFIG?.apiKey            || "",
  authDomain:        self.__FIREBASE_CONFIG?.authDomain        || "",
  projectId:         self.__FIREBASE_CONFIG?.projectId         || "galaboutique-2e3f2",
  storageBucket:     self.__FIREBASE_CONFIG?.storageBucket     || "",
  messagingSenderId: self.__FIREBASE_CONFIG?.messagingSenderId || "",
  appId:             self.__FIREBASE_CONFIG?.appId             || "",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "GalaBoutique", {
    body:    body || "New order received",
    icon:    "/icons/icon-192.png",
    badge:   "/icons/icon-192.png",
    tag:     "gala-order",
    data:    payload.data || {},
    actions: [{ action: "open", title: "View Orders" }],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const url = `/en/admin/orders${orderId ? `?highlight=${orderId}` : ""}`;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
