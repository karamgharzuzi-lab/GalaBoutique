"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { getTodayStats, getOrders, deleteOrder } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
import type { Order, Product } from "@/lib/types";

interface LowStockItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  qty: number;
}

function DashboardInner() {
  const locale = useLocale();
  const { toast } = useToast();

  const [stats, setStats] = useState<{ count: number; revenue: number } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const [todayStats, { orders }, products] = await Promise.all([
        getTodayStats(),
        getOrders({ pageSize: 8 }),
        getAllProducts(),
      ]);

      setStats(todayStats);
      setRecentOrders(orders);

      const ls: LowStockItem[] = [];
      products.forEach((p: Product) => {
        p.variants.forEach((v) => {
          if (v.quantity > 0 && v.quantity < 3) {
            ls.push({ productId: p.id, productName: p.name.en, size: v.size, color: v.color, qty: v.quantity });
          }
        });
      });
      setLowStock(ls);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    const id = deleteId;
    // Close modal and remove from list immediately
    setDeleteId(null);
    setRecentOrders((prev) => prev.filter((o) => o.id !== id));
    setDeleting(true);
    try {
      await deleteOrder(id);
      toast("הזמנה נמחקה");
    } catch {
      // Restore the order if the server call failed
      toast("שגיאה במחיקת ההזמנה", "error");
      const [, { orders }] = await Promise.all([null, getOrders({ pageSize: 8 })]);
      setRecentOrders(orders);
    } finally {
      setDeleting(false);
    }
  }

  const pendingCount = recentOrders.filter((o) => o.status === "pending").length;

  const statusBadge = (status: Order["status"]) => {
    const labels: Record<Order["status"], string> = {
      pending: "ממתין", confirmed: "אושר",
      shipped: "נשלח", delivered: "נמסר", failed: "נכשל",
    };
    return <Badge variant={status}>{labels[status]}</Badge>;
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
      <div>
        <p className="eyebrow mb-1">סקירה</p>
        <h1 className="h-display text-3xl text-brand-brown">לוח בקרה</h1>
      </div>

      {/* 3 key stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "הזמנות היום",  value: loading ? "—" : stats?.count ?? 0,    sub: stats?.revenue ? `₪${stats.revenue.toLocaleString()}` : "" },
          { label: "ממתינות",      value: loading ? "—" : pendingCount,          sub: "לאישור" },
          { label: "מלאי נמוך",   value: loading ? "—" : lowStock.length,       sub: "וריאנטים" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-brand-cream-dark rounded-xl p-4">
            <p className="eyebrow mb-2">{s.label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="h-display text-3xl text-brand-brown leading-none">{s.value}</p>
            )}
            {s.sub && <p className="text-[11px] text-brand-brown/45 mt-1.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/admin/products/new`}
          className="inline-flex items-center bg-brand-brown text-brand-cream px-5 py-2.5 rounded-md text-xs font-semibold tracking-luxe uppercase hover:bg-brand-brown-light transition-colors tap-soft"
        >
          + מוצר חדש
        </Link>
        <Link
          href={`/${locale}/admin/orders`}
          className="relative inline-flex items-center border border-brand-brown text-brand-brown px-5 py-2.5 rounded-md text-xs font-semibold tracking-luxe uppercase hover:bg-brand-brown/5 transition-colors tap-soft"
        >
          כל ההזמנות
          {pendingCount > 0 && (
            <span className="ms-2 min-w-[18px] h-[18px] px-1 bg-brand-gold text-brand-brown text-[10px] font-bold rounded-full flex items-center justify-center tracking-normal">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>

      {/* Low stock + Recent orders side by side on desktop */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Low stock alerts */}
        <div className="bg-white border border-brand-cream-dark rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">מלאי נמוך</p>
            {lowStock.length > 0 && (
              <Link href={`/${locale}/admin/products?filter=lowStock`} className="text-[11px] tracking-luxe uppercase text-brand-gold border-b border-brand-gold/40">
                ניהול
              </Link>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : lowStock.length === 0 ? (
            <p className="text-sm text-brand-brown/40 py-4 text-center">המלאי תקין</p>
          ) : (
            <div className="space-y-1.5">
              {lowStock.slice(0, 6).map((item, i) => (
                <Link
                  href={`/${locale}/admin/products/${item.productId}`}
                  key={i}
                  className="flex items-center justify-between text-sm py-1 hover:text-brand-gold transition-colors"
                >
                  <span className="text-brand-brown/80 truncate">{item.productName} · {item.size} · {item.color}</span>
                  <Badge variant="lowStock">{item.qty} נותרו</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-brand-cream-dark rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">הזמנות אחרונות</p>
            <Link href={`/${locale}/admin/orders`} className="text-[11px] tracking-luxe uppercase text-brand-gold border-b border-brand-gold/40">
              הצג הכל
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-brand-brown/40 text-center py-4">אין הזמנות עדיין</p>
          ) : (
            <div className="space-y-1.5">
              {recentOrders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-1.5 -mx-1 px-1 rounded hover:bg-brand-cream/50 transition-colors group"
                >
                  <Link
                    href={`/${locale}/admin/orders`}
                    className="flex-1 min-w-0 text-sm"
                  >
                    <p className="font-medium text-brand-brown truncate">{order.customer.name}</p>
                    <p className="text-[11px] text-brand-brown/50">#{order.id.slice(0, 6).toUpperCase()} · ₪{order.total.toLocaleString()}</p>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusBadge(order.status)}
                    <button
                      onClick={() => setDeleteId(order.id)}
                      aria-label="מחק הזמנה"
                      className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="מחיקת הזמנה">
        <p className="text-sm text-brand-brown/80 mb-6">
          האם אתה בטוח שברצונך למחוק הזמנה זו? פעולה זו אינה הפיכה.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteId(null)}>ביטול</Button>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>מחק</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function DashboardPage() {
  const locale = useLocale();
  return (
    <AdminLayout locale={locale}>
      <DashboardInner />
    </AdminLayout>
  );
}
