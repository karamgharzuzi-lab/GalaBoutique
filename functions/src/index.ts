import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

const db  = admin.firestore();
const fcm = admin.messaging();

interface OrderItem {
  productId: string;
  nameEn:    string;
  nameHe:    string;
  size:      string;
  color:     string;
  qty:       number;
}

interface OrderData {
  customer: { name: string; phone: string };
  items:    OrderItem[];
  total:    number;
  status:   string;
}

/**
 * Triggered when a new order document is created in /orders/{orderId}.
 * Reads all FCM tokens from /fcm_tokens (saved by lib/fcm.ts on the
 * admin device) and sends a push notification to every token.
 */
export const onNewOrder = onDocumentCreated(
  { document: "orders/{orderId}", region: "me-west1" },
  async (event) => {
    const orderId = event.params.orderId;
    const data    = event.data?.data() as OrderData | undefined;
    if (!data) return;

    const { customer, items, total } = data;
    const itemCount = items.reduce((s, i) => s + i.qty, 0);

    // ── Read all saved admin FCM tokens ─────────────────────────────
    // Client saves tokens at /fcm_tokens/{token} (lib/fcm.ts)
    const tokenSnap = await db.collection("fcm_tokens").get();
    const tokens: string[] = tokenSnap.docs
      .map((d) => d.data().token as string | undefined)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) {
      console.log("No FCM tokens found — skipping notification");
      return;
    }

    console.log(`Sending notification to ${tokens.length} token(s) for order ${orderId}`);

    // ── Build and send multicast message ────────────────────────────
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: "🛍️ הזמנה חדשה — GalaBoutique",
        body:  `${customer.name} הזמין ${itemCount} פריט${itemCount > 1 ? "ים" : ""} — סה״כ ₪${total.toLocaleString("he-IL")}`,
      },
      data: {
        orderId,
        screen: "orders",
      },
      webpush: {
        fcmOptions: { link: "/en/admin/orders" },
        notification: {
          icon:  "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag:   "gala-order",
          renotify: true,
        },
      },
    };

    const response = await fcm.sendEachForMulticast(message);
    console.log(`FCM result: ${response.successCount} ok, ${response.failureCount} failed`);

    // ── Remove stale / invalid tokens ───────────────────────────────
    const staleDeletes: Promise<admin.firestore.WriteResult>[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        if (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        ) {
          console.log(`Removing stale token: ${tokens[i].slice(0, 20)}…`);
          staleDeletes.push(db.collection("fcm_tokens").doc(tokens[i]).delete());
        }
      }
    });
    if (staleDeletes.length) await Promise.all(staleDeletes);
  }
);
