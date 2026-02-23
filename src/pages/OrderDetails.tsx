import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Truck, Package } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { getJson, putJson, resolveApiFileUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type OrderItem = {
  id: number;
  product_name: string;
  sku?: string | null;
  quantity: number;
  unit_price: string | number;
  line_total: string | number;
};

type OrderPayment = {
  id: number;
  provider?: string;
  method?: string;
  status?: string;
  amount?: string | number;
  created_at?: string;
};

type Shipment = {
  status?: string;
  tracking_code?: string | null;
  label_url?: string | null;
};

type TrackingStep = {
  key: string;
  label: string;
  state: "done" | "current" | "pending" | "cancelled" | string;
  reached_at?: string | null;
};

type TrackingEvent = {
  id: number;
  status: string;
  label: string;
  location?: string | null;
  description?: string | null;
  occurred_at?: string | null;
};

type TrackingProgress = {
  order_id: number;
  order_number?: string | null;
  provider?: string;
  status: string;
  tracking_code?: string | null;
  label_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  steps: TrackingStep[];
  events: TrackingEvent[];
};

type OrderInvoice = {
  id: number;
  invoice_number: string;
  synced?: boolean;
  created_at?: string;
};

type OrderDetails = {
  id: number;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_region?: string | null;
  status: string;
  subtotal: string | number;
  discount_total: string | number;
  total: string | number;
  payment_status?: string;
  shipping_status?: string;
  shipping_tracking_code?: string | null;
  shipping_label_url?: string | null;
  store_name?: string | null;
  store_address?: string | null;
  items: OrderItem[];
  payments: OrderPayment[];
  shipment?: Shipment | null;
  invoice?: OrderInvoice | null;
  tracking_progress?: TrackingProgress | null;
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
const toDateTime = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
};

const OrderDetailsPage = () => {
  const { id } = useParams();
  const { isLoggedIn, email } = useUserAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!isLoggedIn || !email || !id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const result = await getJson<OrderDetails>(`/api/orders/my/${id}?email=${encodeURIComponent(email)}`);
      setOrder(result);
    } catch (e) {
      setOrder(null);
      setError(e instanceof Error ? e.message : "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [email, id, isLoggedIn]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const shippingTracking = useMemo(
    () => order?.shipment?.tracking_code || order?.shipping_tracking_code || null,
    [order],
  );
  const shippingLabelUrl = useMemo(
    () => order?.shipment?.label_url || order?.shipping_label_url || null,
    [order],
  );
  const trackingProgress = order?.tracking_progress || null;
  const trackingSteps = trackingProgress?.steps || [];
  const trackingEvents = trackingProgress?.events || [];
  const invoiceDownloadUrl = useMemo(() => {
    if (!order?.id || !email) return "";
    return resolveApiFileUrl(`/api/orders/my/${order.id}/invoice?email=${encodeURIComponent(email)}`);
  }, [email, order?.id]);
  const canCancelOrder = useMemo(() => {
    if (!order) return false;
    const status = String(order.status || "");
    const shippingStatus = String(order.shipping_status || "");
    return userCancellableStatuses.has(status) && !blockedShippingStatuses.has(shippingStatus);
  }, [order]);

  const handleCancelOrder = async () => {
    if (!order || !email) return;
    if (!window.confirm(`Cancel order ${order.order_number}?`)) return;
    try {
      setCancelling(true);
      setError("");
      setMessage("");
      const updated = await putJson<Partial<OrderDetails> & { message?: string }>(
        `/api/orders/my/${order.id}/cancel?email=${encodeURIComponent(email)}`,
        {},
      );
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: updated.status || "cancelled",
              shipping_status: updated.shipping_status || "cancelled",
            }
          : prev,
      );
      setMessage(updated.message || "Order cancelled successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceDownloadUrl) return;
    try {
      setDownloadingInvoice(true);
      setError("");
      setMessage("");

      const response = await fetch(invoiceDownloadUrl);
      if (!response.ok) {
        let messageText = "Failed to download invoice";
        try {
          const data = (await response.json()) as { message?: string };
          if (data?.message) messageText = data.message;
        } catch {
          // ignore non-json error payload
        }
        throw new Error(messageText);
      }

      const blob = await response.blob();
      const header = response.headers.get("content-disposition") || "";
      const match = /filename=([^;]+)/i.exec(header);
      const fallbackName = order?.invoice?.invoice_number ? `${order.invoice.invoice_number}.pdf` : `invoice-${order?.id || "order"}.pdf`;
      const filename = (match?.[1] || fallbackName).replace(/['"]/g, "").trim();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage("Invoice downloaded successfully.");
      await loadOrder();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download invoice");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-page py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Order Details</h1>
          <p className="mt-2 text-muted-foreground">Please sign in to view order details.</p>
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
        <Link to="/orders" className="mb-6 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        {message ? <p className="mb-4 text-sm text-success">{message}</p> : null}
        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading order details...</p>
        ) : !order ? (
          <p className="text-sm text-muted-foreground">Order not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Order Number</p>
                  <h1 className="text-2xl font-semibold text-foreground">{order.order_number}</h1>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <StatusBadge status={order.status} label={toStatusLabel(order.status)} className="mt-1" />
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground">Payment: </span>
                    <StatusBadge status={order.payment_status || "pending"} />
                  </div>
                  {canCancelOrder ? (
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => void handleCancelOrder()}
                      className="mt-2 inline-flex rounded-full border border-destructive/30 px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelling ? "Cancelling..." : "Cancel Order"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-2">Shipping & Tracking</h2>
                <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                <p className="text-xs text-muted-foreground mt-1">Region: {order.shipping_region || "-"}</p>
                <p className="text-xs text-muted-foreground mt-1">Store: {order.store_name || "-"}</p>
                <p className="text-xs text-muted-foreground mt-1">Store Address: {order.store_address || "-"}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Shipping Status:</span>
                    <StatusBadge
                      status={order.shipping_status || "not_created"}
                      label={toShippingStatusLabel(order.shipping_status || "not_created")}
                    />
                  </div>
                  {shippingTracking ? (
                    <p className="text-xs text-foreground inline-flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      Tracking: {shippingTracking}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Tracking will appear after shipment is created.</p>
                  )}
                  {shippingLabelUrl ? (
                    <a className="text-xs text-primary underline" href={shippingLabelUrl} target="_blank" rel="noreferrer">
                      Open Label
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-2">Price Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">EUR {Number(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-foreground">-EUR {Number(order.discount_total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">EUR {Number(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.invoice
                      ? `Invoice #${order.invoice.invoice_number} | ${toDateTime(order.invoice.created_at) || "-"}`
                      : "Invoice not generated yet. Click below to generate and download."}
                  </p>
                  {invoiceDownloadUrl ? (
                    <button
                      type="button"
                      disabled={downloadingInvoice}
                      onClick={() => void handleDownloadInvoice()}
                      className="mt-2 inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingInvoice
                        ? "Preparing Invoice..."
                        : order.invoice
                          ? "Download Invoice"
                          : "Generate & Download Invoice"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Shipment Progress</h2>
              {trackingSteps.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tracking timeline will appear once shipment updates are available.</p>
              ) : (
                <div className="space-y-3">
                  {trackingSteps.map((step, index) => {
                    const dotClass =
                      step.state === "done"
                        ? "bg-emerald-500"
                        : step.state === "current"
                          ? "bg-blue-500 ring-4 ring-blue-500/20"
                          : step.state === "cancelled"
                            ? "bg-rose-500 ring-4 ring-rose-500/20"
                            : "bg-slate-300";

                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div className="relative flex w-5 justify-center">
                          <span className={cn("mt-1 h-2.5 w-2.5 rounded-full", dotClass)} />
                          {index < trackingSteps.length - 1 ? <span className="absolute top-4 h-8 w-px bg-border" /> : null}
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{step.label}</p>
                            <StatusBadge status={step.state} label={step.state} className="text-[10px]" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {toDateTime(step.reached_at) || (step.state === "pending" ? "Pending" : "Awaiting update")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {trackingEvents.length > 0 ? (
                <div className="mt-4 border-t border-border pt-3">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tracking History</h3>
                  <div className="space-y-2">
                    {trackingEvents.map((event) => (
                      <div key={event.id} className="rounded-lg border border-border/70 bg-background/60 p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={event.status} label={event.label} className="text-[10px]" />
                            {event.location ? <span className="text-xs text-muted-foreground">{event.location}</span> : null}
                          </div>
                          <span className="text-xs text-muted-foreground">{toDateTime(event.occurred_at) || "-"}</span>
                        </div>
                        {event.description ? <p className="mt-1 text-xs text-muted-foreground">{event.description}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <Package className="h-4 w-4" />
                Order Items
              </h2>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/70 bg-background/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item.sku || "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x EUR {Number(item.unit_price || 0).toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-foreground">EUR {Number(item.line_total || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrderDetailsPage;
