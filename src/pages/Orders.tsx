import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { getJson, putJson } from "@/lib/api";

type MyOrderRow = {
  id: number;
  order_number: string;
  created_at: string;
  status: string;
  total: string | number;
  subtotal: string | number;
  discount_total: string | number;
  shipping_status?: string;
  shipping_tracking_code?: string | null;
  store_name?: string | null;
  store_address?: string | null;
  item_count?: number;
};

const statusLabelMap: Record<string, string> = {
  pending: "Pending",
  awaiting_payment: "Awaiting Payment",
  payment_failed: "Payment Failed",
  paid: "Paid",
  processing: "Packaging",
  shipped: "Shipped",
  completed: "Delivered",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const shippingStatusLabelMap: Record<string, string> = {
  not_created: "Not Created",
};

const toStatusLabel = (status: string) => statusLabelMap[status] || status;
const toShippingStatusLabel = (status: string) => shippingStatusLabelMap[status] || status;
const userCancellableStatuses = new Set(["pending", "awaiting_payment", "payment_failed", "paid", "processing"]);
const blockedShippingStatuses = new Set(["shipped", "delivered", "completed", "cancelled"]);

const OrdersPage = () => {
  const { isLoggedIn, email } = useUserAuth();
  const [rows, setRows] = useState<MyOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    if (!isLoggedIn || !email) {
      setRows([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const result = await getJson<MyOrderRow[]>(`/api/orders/my?email=${encodeURIComponent(email)}`);
      setRows(Array.isArray(result) ? result : []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [email, isLoggedIn]);

  const canCancelOrder = (order: MyOrderRow) => {
    const status = String(order.status || "");
    const shippingStatus = String(order.shipping_status || "");
    return userCancellableStatuses.has(status) && !blockedShippingStatuses.has(shippingStatus);
  };

  const handleCancelOrder = async (order: MyOrderRow) => {
    if (!email) return;
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
    try {
      setCancellingOrderId(order.id);
      setError("");
      setMessage("");
      const updated = await putJson<MyOrderRow & { message?: string }>(
        `/api/orders/my/${order.id}/cancel?email=${encodeURIComponent(email)}`,
        {},
      );
      setRows((prev) =>
        prev.map((row) =>
          row.id === order.id
            ? {
                ...row,
                status: updated.status || "cancelled",
                shipping_status: updated.shipping_status || "cancelled",
              }
            : row,
        ),
      );
      setMessage(updated.message || "Order cancelled successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel order");
    } finally {
      setCancellingOrderId(null);
    }
  };

  useEffect(() => {
    void loadOrders().catch(() => undefined);
  }, [loadOrders]);

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const left = new Date(a.created_at).getTime();
        const right = new Date(b.created_at).getTime();
        return right - left;
      }),
    [rows],
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-page py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">My Orders</h1>
          <p className="mt-2 text-muted-foreground">Please sign in to view your orders.</p>
          <Link to="/account" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Go to Account
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container-page py-10">
        <div className="mb-6 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">My Orders</h1>
        </div>
        {message ? <p className="mb-4 text-sm text-success">{message}</p> : null}
        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((order) => (
              <div key={order.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()} | {order.item_count || 0} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">EUR {Number(order.total || 0).toFixed(2)}</p>
                    <StatusBadge status={order.status} label={toStatusLabel(order.status)} className="mt-1" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Store: {order.store_name || "-"}</span>
                    <span>|</span>
                    <span>Store Address: {order.store_address || "-"}</span>
                    <span>|</span>
                    <span>Shipping:</span>
                    <StatusBadge
                      status={order.shipping_status || "not_created"}
                      label={toShippingStatusLabel(order.shipping_status || "not_created")}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {order.shipping_tracking_code ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-foreground">
                        <Truck className="h-3.5 w-3.5" />
                        {order.shipping_tracking_code}
                      </span>
                    ) : null}
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    {canCancelOrder(order) ? (
                      <button
                        type="button"
                        disabled={cancellingOrderId === order.id}
                        onClick={() => void handleCancelOrder(order)}
                        className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancellingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrdersPage;
