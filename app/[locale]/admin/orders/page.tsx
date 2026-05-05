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
  pending:   "אשר הזמנה",
  confirmed: "סמן כנשלח",
  shipped:   "סמן כנמסר",
  delivered: "נמסר",
  failed:    "נכשל",
};

const STATUS_HE: Record<Order["status"], string> = {
  pending:   "ממתין",
  confirmed: "אושר",
  shipped:   "נשלח",
  delivered: "נמסר",
  failed:    "נכשל",
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-1">מכירות</p>
          <h1 className="h-display text-3xl text-brand-brown">הזמנות</h1>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>ייצוא CSV</Button>
      </div>

      {/* Status filter — pill-style under tab bar */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 mb-5 border-b border-brand-cream-dark">
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors relative",
              statusFilter === s ? "text-brand-brown" : "text-brand-brown/45 hover:text-brand-brown/80"
            )}
          >
            {s === "all" ? "הכל" : STATUS_HE[s as Order["status"]]}
            {statusFilter === s && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-brand-gold rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="h-display text-2xl text-brand-brown/50">אין הזמנות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const nextStatus = STATUS_PROGRESSION[order.status];
            const expanded = expandedId === order.id;
            return (
              <div key={order.id} className="bg-white border border-brand-cream-dark rounded-xl overflow-hidden">
                {/* Compact row — always visible */}
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-start hover:bg-brand-cream/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-brand-brown text-sm">{order.customer.name}</span>
                      <Badge variant={order.status}>{STATUS_HE[order.status]}</Badge>
                    </div>
                    <p className="text-[11px] text-brand-brown/50">
                      #{order.id.slice(0,6).toUpperCase()} · {formatDate(order.createdAt)} · {order.items.length} פריטים
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="h-display text-lg text-brand-brown leading-none">₪{order.total.toLocaleString()}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                       className={cn("text-brand-brown/40 transition-transform flex-shrink-0", expanded && "rotate-180")}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-brand-cream-dark p-4 space-y-3 bg-brand-cream/20">
                    {/* Customer */}
                    <div className="text-sm space-y-0.5">
                      <a href={`tel:${order.customer.phone}`} className="text-brand-gold font-medium block">
                        {order.customer.phone}
                      </a>
                      <p className="text-brand-brown/70">{order.customer.address}</p>
                      {order.customer.notes && <p className="text-brand-brown/50 italic">&ldquo;{order.customer.notes}&rdquo;</p>}
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full ring-1 ring-brand-brown/15 flex-shrink-0"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span className="text-brand-brown/80 truncate">{item.nameEn} · {item.size} · {item.color} × {item.qty}</span>
                          </div>
                          <span className="font-medium text-brand-brown flex-shrink-0">₪{item.subtotal.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping line */}
                    <div className="hairline" />
                    <div className="flex justify-between text-xs text-brand-brown/60">
                      <span>משלוח ({order.shippingRegion === "north" ? "צפון" : order.shippingRegion === "center" ? "מרכז" : "דרום"})</span>
                      <span>{order.shippingCost === 0 ? "חינם" : `₪${order.shippingCost}`}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap pt-2">
                      {nextStatus && (
                        <Button
                          size="sm"
                          loading={updating === order.id}
                          onClick={(e) => { e.stopPropagation(); advanceStatus(order); }}
                        >
                          {STATUS_LABELS[order.status]}
                        </Button>
                      )}
                      <a
                        href={buildWhatsApp(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 h-9 px-4 bg-green-600 text-white rounded-md text-[11px] font-semibold tracking-luxe uppercase hover:bg-green-700 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.554 4.11 1.52 5.84L0 24l6.337-1.496A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.032-1.382l-.36-.214-3.762.888.924-3.67-.237-.376A9.818 9.818 0 1112 21.818z" />
                        </svg>
                        וואטסאפ
                      </a>
                    </div>
                  </div>
                )}
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
