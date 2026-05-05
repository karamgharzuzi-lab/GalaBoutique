"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import Badge from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getTodayStats, getOrders } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
import { requestAndSaveFCMToken } from "@/lib/fcm";
import type { Order, Product } from "@/lib/types";

interface LowStockItem {
  productId: string;
  productName: string;
  size: string;
  color: string;
  qty: number;
}

export default function DashboardPage() {
  const locale = useLocale();

  const [stats, setStats] = useState<{ count: number; revenue: number } | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestAndSaveFCMToken().catch(() => {});

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

  const pendingCount = recentOrders.filter((o) => o.status === "pending").length;

  const statusBadge = (status: Order["status"]) => {
    const labels: Record<Order["status"], string> = {
      pending: "Pending", confirmed: "Confirmed",
      shipped: "Shipped", delivered: "Delivered", failed: "Failed",
    };
    return <Badge variant={status}>{labels[status]}</Badge>;
  };

  return (
    <AdminLayout locale={locale}>
      <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
        <div>
          <p className="eyebrow mb-1">Overview</p>
          <h1 className="h-display text-3xl text-brand-brown">Dashboard</h1>
        </div>

        {/* 3 key stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Today's Orders",  value: loading ? "—" : stats?.count ?? 0,                                      sub: stats?.revenue ? `₪${stats.revenue.toLocaleString()}` : "" },
            { label: "Pending",         value: loading ? "—" : pendingCount,                                            sub: "to confirm" },
            { label: "Low Stock",       value: loading ? "—" : lowStock.length,                                         sub: "variants" },
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
            + New Product
          </Link>
          <Link
            href={`/${locale}/admin/orders`}
            className="relative inline-flex items-center border border-brand-brown text-brand-brown px-5 py-2.5 rounded-md text-xs font-semibold tracking-luxe uppercase hover:bg-brand-brown/5 transition-colors tap-soft"
          >
            All Orders
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
              <p className="eyebrow">Low Stock</p>
              {lowStock.length > 0 && (
                <Link href={`/${locale}/admin/products?filter=lowStock`} className="text-[11px] tracking-luxe uppercase text-brand-gold border-b border-brand-gold/40">
                  Manage
                </Link>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-brand-brown/40 py-4 text-center">All stocked up</p>
            ) : (
              <div className="space-y-1.5">
                {lowStock.slice(0, 6).map((item, i) => (
                  <Link
                    href={`/${locale}/admin/products/${item.productId}`}
                    key={i}
                    className="flex items-center justify-between text-sm py-1 hover:text-brand-gold transition-colors"
                  >
                    <span className="text-brand-brown/80 truncate">{item.productName} · {item.size} · {item.color}</span>
                    <Badge variant="lowStock">{item.qty} left</Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="bg-white border border-brand-cream-dark rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="eyebrow">Recent Orders</p>
              <Link href={`/${locale}/admin/orders`} className="text-[11px] tracking-luxe uppercase text-brand-gold border-b border-brand-gold/40">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-brand-brown/40 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-1.5">
                {recentOrders.slice(0, 6).map((order) => (
                  <Link
                    href={`/${locale}/admin/orders`}
                    key={order.id}
                    className="flex items-center justify-between py-1.5 text-sm hover:bg-brand-cream/50 -mx-1 px-1 rounded transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-brand-brown truncate">{order.customer.name}</p>
                      <p className="text-[11px] text-brand-brown/50">#{order.id.slice(0, 6).toUpperCase()} · ₪{order.total.toLocaleString()}</p>
                    </div>
                    {statusBadge(order.status)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
