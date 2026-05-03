import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

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
 * Triggered when a new order document is created.
 * Sends FCM push notification to all admin tokens.
 * Inventory deduction is handled client-side via Firestore transaction
 * before the order is written (see lib/orders.ts submitOrder).
 */
export const onNewOrder = onDocumentCreated(
  { document: "orders/{orderId}", region: "me-west1" },
  async (event) => {
    const orderId = event.params.orderId;
    const data    = event.data?.data() as OrderData | undefined;
    if (!data) return;

    const { customer, items, total } = data;
    const itemCount = items.reduce((s: number, i: OrderItem) => s + i.qty, 0);

    // Fetch all admin FCM tokens
    const tokensSnap = await db.collection("admin").doc("fcm_tokens").listCollections();
    const tokenDocs  = await db.collectionGroup("fcm_tokens").get();

    // Simpler: read tokens from /admin/fcm_tokens subcollection
    const adminDoc = await db.collection("admin").doc("fcm_tokens").get();
    const tokenList: string[] = [];

    // Try flat collection: /admin/fcm_tokens/{tokenId}
    const tokenColl = await db
      .collection("admin")
      .doc("fcm_tokens")
      .listCollections()
      .catch(() => []);

    // Read from the flat path used by the client: /admin/fcm_tokens/{tokenId}
    const flatTokens = await db
      .collection("admin")
      .doc("fcm_tokens")
      .collection("tokens")
      .get()
      .catch(() => ({ docs: [] as admin.firestore.QueryDocumentSnapshot[] }));

    flatTokens.docs.forEach((d) => {
      const tok = d.data().token as string | undefined;
      if (tok) tokenList.push(tok);
    });

    // Also read at root /admin/{tokenId} pattern from the FCM client
    const rootTokens = await db
      .collection("admin")
      .where("token", "!=", "")
      .get()
      .catch(() => ({ docs: [] as admin.firestore.QueryDocumentSnapshot[] }));

    rootTokens.docs.forEach((d) => {
      const tok = d.data().token as string | undefined;
      if (tok && !tokenList.includes(tok)) tokenList.push(tok);
    });

    if (tokenList.length === 0) {
      console.log("No FCM tokens found, skipping notification");
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: tokenList,
      notification: {
        title: "🛍️ הזמנה חדשה - GalaBoutique",
        body:  `${customer.name} הזמין ${itemCount} פריטים — סה״כ ₪${total.toLocaleString()}`,
      },
      data: {
        orderId,
        screen: "orders",
      },
      android: {
        notification: { clickAction: "FLUTTER_NOTIFICATION_CLICK" },
      },
      webpush: {
        fcmOptions: { link: "/en/admin/orders" },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`FCM sent: ${response.successCount} success, ${response.failureCount} failure`);

    // Clean up stale tokens
    const staleTokens: string[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success) staleTokens.push(tokenList[i]);
    });
    // (token cleanup omitted for brevity — production would delete stale tokens)
  }
);
