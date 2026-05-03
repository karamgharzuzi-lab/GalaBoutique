"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { getOrders, updateOrderStatus } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_PROGRESSION: Record<Order["status"], Order["status"] | null> = {
  pending:   "confirmed",
  confirmed: "shipped",
  shipped:   "delivered",
  delivered: null,
  failed:    null,
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pending:   "Mark as Confirmed",
  confirmed: "Mark as Shipped",
  shipped:   "Mark as Delivered",
  delivered: "Delivered",
  failed:    "Failed",
};

function formatDate(ts: Order["createdAt"]): string {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts as unknown as string);
  return d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function OrdersInner() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { orders: o } = await getOrders({
      status: statusFilter === "all" ? undefined : statusFilter,
      pageSize: 50,
    });
    setOrders(o);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function advanceStatus(order: Order) {
    const next = STATUS_PROGRESSION[order.status];
    if (!next) return;
    setUpdating(order.id);
    await updateOrderStatus(order.id, next);
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: next } : o));
    setUpdating(null);
    toast(`Order ${order.id.slice(0,6)} → ${next}`);
  }

  function buildWhatsApp(order: Order): string {
    const phone = order.customer.phone.replace(/[^0-9]/g, "").replace(/^0/, "972");
    const msg = encodeURIComponent(
      `שלום ${order.customer.name}, הזמנתך מ-GalaBoutique #${order.id.slice(0,8).toUpperCase()} אושרה ✅ נעדכן אותך עם פרטי המשלוח בקרוב.`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  }

  function exportCSV() {
    const rows = [
      ["Date", "Order ID", "Name", "Phone", "Address", "Items", "Subtotal", "Shipping", "Total", "Status"],
      ...orders.map((o) => [
        formatDate(o.createdAt),
        o.id.slice(0, 8).toUpperCase(),
        o.customer.name,
        o.customer.phone,
        o.customer.address,
        o.items.map((i) => `${i.nameEn} (${i.size}/${i.color})×${i.qty}`).join("; "),
        o.subtotal,
        o.shippingCost,
        o.total,
        o.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${Date.now()}.csv`;
    a.click();
  }

  const statusOptions: Array<Order["status"] | "all"> = ["all", "pending", "confirmed", "shipped", "delivered", "failed"];
  const badgeVariant = (s: Order["status"]): "pending" | "confirmed" | "shipped" | "delivered" | "failed" => s as never;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-brand-brown">Orders</h1>
        <Button variant="outline" size="sm" onClick={exportCSV}>Export CSV</Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors",
              statusFilter === s
                ? "bg-brand-brown text-brand-cream"
                : "bg-white border border-brand-cream-dark text-brand-brown hover:bg-brand-brown/5"
            )}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-brand-brown/40">
          <p className="text-lg font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const nextStatus = STATUS_PROGRESSION[order.status];
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-card p-4 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-brand-brown text-sm">#{order.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-xs text-brand-brown/50">{formatDate(order.createdAt)}</p>
                  </div>
                  <Badge variant={badgeVariant(order.status)}>{order.status}</Badge>
                </div>

                {/* Customer */}
                <div className="bg-brand-cream rounded-xl p-3 text-sm space-y-1">
                  <p className="font-semibold text-brand-brown">{order.customer.name}</p>
                  <a href={`tel:${order.customer.phone}`} className="text-brand-gold font-medium">{order.customer.phone}</a>
                  <p className="text-brand-brown/70">{order.customer.address}</p>
                  {order.customer.notes && <p className="text-brand-brown/50 italic">&ldquo;{order.customer.notes}&rdquo;</p>}
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-gray-200 flex-shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="text-brand-brown/80">{item.nameEn} · {item.size} · {item.color} × {item.qty}</span>
                      </div>
                      <span className="font-semibold text-brand-brown flex-shrink-0">₪{item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-brand-cream-dark pt-2 flex justify-between text-sm">
                  <span className="text-brand-brown/60">
                    Shipping ({order.shippingRegion}) — {order.shippingCost === 0 ? "Free" : `₪${order.shippingCost}`}
                  </span>
                  <span className="font-bold text-brand-brown">₪{order.total.toLocaleString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {nextStatus && (
                    <Button
                      size="sm"
                      loading={updating === order.id}
                      onClick={() => advanceStatus(order)}
                    >
                      {STATUS_LABELS[order.status]}
                    </Button>
                  )}
                  <a
                    href={buildWhatsApp(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.11 1.52 5.84L0 24l6.337-1.496A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.032-1.382l-.36-.214-3.762.888.924-3.67-.237-.376A9.818 9.818 0 1112 21.818z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const locale = useLocale();
  return (
    <AdminLayout locale={locale}>
      <ToastProvider>
        <OrdersInner />
      </ToastProvider>
    </AdminLayout>
  );
}
