import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "./types";

function toProduct(snap: QueryDocumentSnapshot): Product {
  return { id: snap.id, ...(snap.data() as Omit<Product, "id">) };
}

export async function getProducts(opts: {
  category?: string;
  isBestSeller?: boolean;
  isSpecialOffer?: boolean;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot | null;
} = {}): Promise<{ products: Product[]; lastDoc: QueryDocumentSnapshot | null }> {
  const constraints: Parameters<typeof query>[1][] = [orderBy("createdAt", "desc")];
  if (opts.category && opts.category !== "all") constraints.push(where("category", "==", opts.category));
  if (opts.isBestSeller) constraints.push(where("isBestSeller", "==", true));
  if (opts.isSpecialOffer) constraints.push(where("isSpecialOffer", "==", true));
  if (opts.cursor) constraints.push(startAfter(opts.cursor));
  constraints.push(limit(opts.pageSize ?? 12));

  const q = query(collection(db, "products"), ...constraints);
  const snap = await getDocs(q);
  const products = snap.docs.map(toProduct);
  const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  return { products, lastDoc };
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Product, "id">) };
}

export async function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "products"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Omit<Product, "id">>): Promise<void> {
  await updateDoc(doc(db, "products", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

export async function getAllProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
  return snap.docs.map(toProduct);
}
