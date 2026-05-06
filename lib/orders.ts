import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  serverTimestamp,
  runTransaction,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, OrderItem, ShippingRegion } from "./types";

function toOrder(snap: QueryDocumentSnapshot): Order {
  return { id: snap.id, ...(snap.data() as Omit<Order, "id">) };
}

export interface SubmitOrderPayload {
  customer: { name: string; phone: string; address: string; notes: string };
  items: OrderItem[];
  shippingRegion: ShippingRegion;
  shippingCost: number;
  subtotal: number;
  total: number;
  locale: "en" | "he";
}

export async function submitOrder(
  payload: SubmitOrderPayload
): Promise<{ orderId: string; error?: string }> {
  try {
    const orderId = await runTransaction(db, async (tx) => {
      // Verify and deduct inventory for each item
      for (const item of payload.items) {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await tx.get(productRef);
        if (!productSnap.exists()) {
          throw new Error(`STOCK_ERROR:${item.nameEn}:${item.size}`);
        }

        const data = productSnap.data();
        const variants: Array<{
          size: string; color: string; quantity: number;
          price: number; salePrice?: number; colorHex: string;
        }> = data.variants || [];

        const idx = variants.findIndex(
          (v) => v.size === item.size && v.color === item.color
        );
        if (idx === -1 || variants[idx].quantity < item.qty) {
          throw new Error(`STOCK_ERROR:${item.nameEn}:${item.size}`);
        }
        variants[idx] = { ...variants[idx], quantity: variants[idx].quantity - item.qty };
        tx.update(productRef, { variants });
      }

      // Write order
      const orderRef = doc(collection(db, "orders"));
      tx.set(orderRef, {
        ...payload,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      return orderRef.id;
    });

    return { orderId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.startsWith("STOCK_ERROR:")) {
      const [, name, size] = msg.split(":");
      return { orderId: "", error: `STOCK_ERROR:${name}:${size}` };
    }
    return { orderId: "", error: msg };
  }
}

export async function getOrders(opts: {
  status?: Order["status"];
  pageSize?: number;
  cursor?: QueryDocumentSnapshot | null;
} = {}): Promise<{ orders: Order[]; lastDoc: QueryDocumentSnapshot | null }> {
  const constraints: Parameters<typeof query>[1][] = [orderBy("createdAt", "desc")];
  if (opts.status) constraints.push(where("status", "==", opts.status));
  if (opts.cursor) constraints.push(startAfter(opts.cursor));
  constraints.push(limit(opts.pageSize ?? 20));

  const q = query(collection(db, "orders"), ...constraints);
  const snap = await getDocs(q);
  const orders = snap.docs.map(toOrder);
  return { orders, lastDoc: snap.docs[snap.docs.length - 1] ?? null };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Order, "id">) };
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<void> {
  await updateDoc(doc(db, "orders", id), { status });
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, "orders", id));
}

export async function getTodayStats(): Promise<{ count: number; revenue: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, "orders"),
    where("createdAt", ">=", startOfDay),
    where("status", "!=", "failed")
  );
  const snap = await getDocs(q);
  const orders = snap.docs.map((d) => d.data() as Omit<Order, "id">);
  const count = orders.length;
  const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  return { count, revenue };
}
