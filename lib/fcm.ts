"use client";

import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import app, { db } from "./firebase";

let messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === "undefined") return null;
  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch {
      return null;
    }
  }
  return messaging;
}

export async function requestAndSaveFCMToken(): Promise<string | null> {
  try {
    const m = getMessagingInstance();
    if (!m) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const token = await getToken(m, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      ),
    });

    if (token) {
      // /fcm_tokens/{token} — 2 segments = valid document path.
      // Cloud Function reads this same collection via Admin SDK.
      await setDoc(doc(db, "fcm_tokens", token), {
        token,
        createdAt: serverTimestamp(),
      });
    }

    return token;
  } catch (err) {
    console.error("FCM token error:", err);
    return null;
  }
}

export function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string } }) => void
) {
  const m = getMessagingInstance();
  if (!m) return () => {};
  return onMessage(m, callback);
}
