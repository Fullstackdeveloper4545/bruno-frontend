import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { PageHeader } from "@/components/admin/PageHeader";
import { adminApi } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  status: string;
  total: string;
  store_name?: string;
};

export type OrdersViewMode = "total" | "packaging" | "shipped" | "delivered" | "cancelled";

const statusActions: Array<{ value: string; label: string }> = [
  { value: "processing", label: "packaging" },
  { value: "shipped", label: "shipped" },
  { value: "completed", label: "delivered" },
  { value: "cancelled", label: "cancelled" },
];

const statusLabelMap: Record<string, string> = {
  pending: "pending",
  awaiting_payment: "awaiting payment",
  payment_failed: "payment failed",
  paid: "paid",
  processing: "packaging",
  shipped: "shipped",
  completed: "delivered",
  delivered: "delivered",
  cancelled: "cancelled",
};

const toStatusLabel = (status: string) => statusLabelMap[status] || status;

const viewConfig: Record<
  OrdersViewMode,
  { title: string; description: string; tabLabel: string; filter: (order: Order) => boolean }
> = {
  total: {
    title: "Total Orders",
    description: "All orders across stores.",
    tabLabel: "Total Orders",
    filter: () => true,
  },
  packaging: {
    title: "Packaging Orders",
    description: "Orders currently in preparation/packaging.",
    tabLabel: "Packaging",
    filter: (order) => ["pending", "awaiting_payment", "paid", "processing"].includes(order.status),
  },
  shipped: {
    title: "Shipped Orders",
    description: "Orders already shipped.",
    tabLabel: "Shipped",
    filter: (order) => order.status === "shipped",
  },
  delivered: {
    title: "Delivered Orders",
    description: "Orders marked as delivered/completed.",
    tabLabel: "Delivered",
    filter: (order) => ["delivered", "completed"].includes(order.status),
  },
  cancelled: {
    title: "Cancelled Orders",
    description: "Orders cancelled by user/admin.",
    tabLabel: "Cancelled",
    filter: (order) => order.status === "cancelled",
  },
};

const tabs: Array<{ mode: OrdersViewMode; to: string }> = [
  { mode: "total", to: "/admin/orders/total" },
  { mode: "packaging", to: "/admin/orders/packaging" },
  { mode: "shipped", to: "/admin/orders/shipped" },
  { mode: "delivered", to: "/admin/orders/delivered" },
  { mode: "cancelled", to: "/admin/orders/cancelled" },
];

export function OrdersView({ mode }: { mode: OrdersViewMode }) {
  const [rows, setRows] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const config = viewConfig[mode];

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const orders = (await adminApi.listOrders()) as Order[];
      setRows(Array.isArray(orders) ? orders : []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => rows.filter(config.filter), [rows, config]);

  return (
    <div className="space-y-6">
      <PageHeader title={config.title} description={config.description} />
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Order Sections</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button key={tab.mode} asChild variant={mode === tab.mode ? "default" : "outline"} size="sm">
              <NavLink to={tab.to}>{viewConfig[tab.mode].tabLabel}</NavLink>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {config.tabLabel} ({filteredRows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No orders in this section.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.order_number}</TableCell>
                    <TableCell>{row.customer_name}</TableCell>
                    <TableCell>{row.store_name || "-"}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} label={toStatusLabel(row.status)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {statusActions.map((status) => (
                          <Button
                            key={status.value}
                            variant="outline"
                            size="sm"
                            className={cn(row.status === status.value && "border-primary text-primary")}
                            onClick={() =>
                              void adminApi
                                .updateOrderStatus(row.id, status.value)
                                .then(() => load())
                                .then(() =>
                                  setMessage(
                                    status.value === "completed"
                                      ? "Order completed: invoice generated and sent."
                                      : "Order status updated.",
                                  ),
                                )
                                .catch((e: unknown) =>
                                  setError(e instanceof Error ? e.message : "Failed to update order status"),
                                )
                            }
                          >
                            {status.label}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
