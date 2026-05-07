import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";

admin.initializeApp();

const db  = admin.firestore();
const fcm = admin.messaging();

const TWILIO_SID   = defineSecret("TWILIO_SID");
const TWILIO_TOKEN = defineSecret("TWILIO_TOKEN");
const TWILIO_FROM  = defineSecret("TWILIO_FROM");
const ADMIN_PHONE  = defineSecret("ADMIN_PHONE");

interface OrderItem {
  nameEn: string;
  qty:    number;
  size:   string;
  color:  string;
}

interface OrderData {
  customer: { name: string; phone: string };
  items:    OrderItem[];
  total:    number;
  status:   string;
}

// ---------------------------------------------------------------------------
// Twilio helper — works for both SMS and WhatsApp.
// If TWILIO_FROM starts with "whatsapp:" the TO is also prefixed automatically.
// ---------------------------------------------------------------------------
async function sendTwilio(
  sid: string, token: string,
  from: string, to: string,
  body: string,
): Promise<void> {
  const isWhatsApp = from.startsWith("whatsapp:");
  const toFinal    = isWhatsApp && !to.startsWith("whatsapp:") ? `whatsapp:${to}` : to;

  const url  = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: toFinal, Body: body }).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio ${res.status}: ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Cloud Function: fires on every new order document
// ---------------------------------------------------------------------------
export const onNewOrder = onDocumentCreated(
  {
    document: "orders/{orderId}",
    region:   "me-west1",
    secrets:  [TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM, ADMIN_PHONE],
  },
  async (event) => {
    const orderId = event.params.orderId;
    const data    = event.data?.data() as OrderData | undefined;
    if (!data) return;

    const { customer, items, total } = data;
    const itemCount = items.reduce((s, i) => s + i.qty, 0);

    const shortId   = orderId.slice(0, 8).toUpperCase();
    const totalFmt  = total.toLocaleString("he-IL");
    const msgBody   =
      `🛍️ הזמנה חדשה — GalaBoutique\n` +
      `לקוח: ${customer.name}\n` +
      `טלפון: ${customer.phone}\n` +
      `${itemCount} פריט${itemCount !== 1 ? "ים" : ""} · ₪${totalFmt}\n` +
      `#${shortId}`;

    // ── WhatsApp / SMS via Twilio ────────────────────────────────────────
    const sid   = TWILIO_SID.value();
    const token = TWILIO_TOKEN.value();
    const from  = TWILIO_FROM.value();
    const to    = ADMIN_PHONE.value();

    if (sid && token && from && to) {
      try {
        await sendTwilio(sid, token, from, to, msgBody);
        console.log(`Twilio message sent to ${to}`);
      } catch (err) {
        console.error("Twilio error:", err);
      }
    } else {
      console.log("Twilio secrets not configured — skipping WhatsApp/SMS");
    }

    // ── FCM push (kept as secondary channel) ────────────────────────────
    const tokenSnap = await db.collection("fcm_tokens").get();
    const fcmTokens: string[] = tokenSnap.docs
      .map((d) => d.data().token as string | undefined)
      .filter((t): t is string => !!t);

    if (fcmTokens.length === 0) {
      console.log("No FCM tokens — skipping push");
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title: "🛍️ הזמנה חדשה — GalaBoutique",
        body:  `${customer.name} · ${itemCount} פריט${itemCount !== 1 ? "ים" : ""} · ₪${totalFmt}`,
      },
      data: { orderId, screen: "orders" },
      webpush: {
        fcmOptions: { link: "/he/admin/orders" },
        notification: {
          icon:      "/icons/icon-192.png",
          badge:     "/icons/icon-192.png",
          tag:       "gala-order",
          renotify:  true,
        },
      },
    };

    const response = await fcm.sendEachForMulticast(message);
    console.log(`FCM: ${response.successCount} ok, ${response.failureCount} failed`);

    // Clean up stale tokens
    const stale: Promise<admin.firestore.WriteResult>[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          stale.push(db.collection("fcm_tokens").doc(fcmTokens[i]).delete());
        }
      }
    });
    if (stale.length) await Promise.all(stale);
  },
);
