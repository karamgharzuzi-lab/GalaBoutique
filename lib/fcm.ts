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

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) return undefined;
  try {
    // Reuse existing registration if available; otherwise register fresh.
    const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    const reg = existing ?? await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { updateViaCache: "none" },
    );
    // Wait for the SW to become active before handing it to Firebase.
    if (reg.installing) {
      await new Promise<void>((resolve) => {
        reg.installing!.addEventListener("statechange", function fn(e) {
          if ((e.target as ServiceWorker).state === "activated") {
            (e.target as ServiceWorker).removeEventListener("statechange", fn);
            resolve();
          }
        });
      });
    }
    return reg;
  } catch (err) {
    console.error("SW registration error:", err);
    return undefined;
  }
}

export async function requestAndSaveFCMToken(): Promise<string | null> {
  try {
    const m = getMessagingInstance();
    if (!m) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const swReg = await getOrRegisterSW();

    const token = await getToken(m, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
    });

    if (token) {
      await setDoc(doc(db, "fcm_tokens", token), {
        token,
        updatedAt: serverTimestamp(),
      });
    }

    return token ?? null;
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
