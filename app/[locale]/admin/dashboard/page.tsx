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
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request FCM permission on dashboard load
    requestAndSaveFCMToken().catch(() => {});

    async function load() {
      const [todayStats, { orders }, products] = await Promise.all([
        getTodayStats(),
        getOrders({ pageSize: 10 }),
        getAllProducts(),
      ]);

      setStats(todayStats);
      setRecentOrders(orders);

      // Compute low stock
      const ls: LowStockItem[] = [];
      let oos = 0;
      products.forEach((p: Product) => {
        p.variants.forEach((v) => {
          if (v.quantity === 0) oos++;
          else if (v.quantity < 3) {
            ls.push({ productName: p.name.en, size: v.size, color: v.color, qty: v.quantity });
          }
        });
      });
      setLowStock(ls);
      setOutOfStockCount(oos);
      setLoading(false);
    }

    load();
  }, []);

  const pendingCount = recentOrders.filter((o) => o.status === "pending").length;

  const statusBadge = (status: Order["status"]) => {
    const map: Record<Order["status"], "pending" | "confirmed" | "shipped" | "delivered" | "failed"> = {
      pending:   "pending",
      confirmed: "confirmed",
      shipped:   "shipped",
      delivered: "delivered",
      failed:    "failed",
    };
    const labels: Record<Order["status"], string> = {
      pending: "Pending", confirmed: "Confirmed",
      shipped: "Shipped", delivered: "Delivered", failed: "Failed",
    };
    return <Badge variant={map[status]}>{labels[status]}</Badge>;
  };

  return (
    <AdminLayout locale={locale}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold text-brand-brown">Dashboard</h1>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today's Orders", value: loading ? "—" : stats?.count ?? 0, sub: "orders" },
            { label: "Today's Revenue", value: loading ? "—" : `₪${(stats?.revenue ?? 0).toLocaleString()}`, sub: "" },
            { label: "Low Stock", value: loading ? "—" : lowStock.length, sub: "variants" },
            { label: "Out of Stock", value: loading ? "—" : outOfStockCount, sub: "variants" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-xs text-brand-brown/50 font-medium">{s.label}</p>
              {loading ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-brand-brown mt-0.5">{s.value}</p>
              )}
              {s.sub && <p className="text-xs text-brand-brown/40 mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${locale}/admin/products/new`}
            className="flex items-center gap-2 bg-brand-brown text-brand-cream px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-brown-light transition-colors"
          >
            + Add Product
          </Link>
          <Link
            href={`/${locale}/admin/orders`}
            className="relative flex items-center gap-2 border-2 border-brand-brown text-brand-brown px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-brown/5 transition-colors"
          >
            View All Orders
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand-gold text-brand-brown text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href={`/${locale}/admin/inventory`}
            className="flex items-center gap-2 border-2 border-brand-brown text-brand-brown px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-brown/5 transition-colors"
          >
            Update Inventory
          </Link>
        </div>

        {/* Low stock alerts */}
        {lowStock.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <h2 className="text-sm font-bold text-brand-brown mb-3">Low Stock Alerts</h2>
            <div className="space-y-2">
              {lowStock.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-brand-brown/80">{item.productName} · {item.size} · {item.color}</span>
                  <Badge variant={item.qty === 0 ? "outOfStock" : "lowStock"}>{item.qty} left</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent orders */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-brand-brown">Recent Orders</h2>
            <Link href={`/${locale}/admin/orders`} className="text-xs text-brand-gold font-medium">View all</Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-brand-brown/40 text-center py-4">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-brand-cream last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-brand-brown">{order.customer.name}</p>
                    <p className="text-xs text-brand-brown/50">#{order.id.slice(0, 8).toUpperCase()} · ₪{order.total.toLocaleString()}</p>
                  </div>
                  {statusBadge(order.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
