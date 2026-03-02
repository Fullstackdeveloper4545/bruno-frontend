import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { toast } from "@/components/ui/sonner";
import { adminApi } from "@/lib/adminApi";

type DashboardKpis = {
  total_revenue: number;
  today_revenue: number;
  month_revenue: number;
  year_revenue: number;
  total_orders: number;
  pending_orders: number;
  ready_to_ship_orders: number;
  failed_payments: number;
  revenue_vs_last_month_pct: number;
  total_orders_vs_prev_7d_pct: number;
  pending_orders_vs_prev_7d_pct: number;
  ready_to_ship_vs_prev_7d_pct: number;
  failed_payments_vs_prev_7d_pct: number;
};

const fallbackKpis: DashboardKpis = {
  total_revenue: 1284320,
  today_revenue: 18240,
  month_revenue: 412300,
  year_revenue: 5142000,
  total_orders: 2482,
  pending_orders: 86,
  ready_to_ship_orders: 142,
  failed_payments: 12,
  revenue_vs_last_month_pct: 12.4,
  total_orders_vs_prev_7d_pct: 4.3,
  pending_orders_vs_prev_7d_pct: -2.1,
  ready_to_ship_vs_prev_7d_pct: 6.9,
  failed_payments_vs_prev_7d_pct: -1.4,
};

const DASHBOARD_REFRESH_INTERVAL_MS = 20000;

const formatCurrency = (value: number) =>
  `EUR ${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const formatInteger = (value: number) => Number(value || 0).toLocaleString("en-US");

const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(1)}%`;

const alerts = [
  {
    title: "Stock integration inactive",
    description: "Manual stock adjustments are enabled for Porto store.",
    tone: "warning",
  },
  {
    title: "Payment gateway latency",
    description: "MB Way responses are above 4s average.",
    tone: "warning",
  },
  {
    title: "CTT webhook retrying",
    description: "Last retry scheduled at 11:45 AM.",
    tone: "info",
  },
];

const revenueConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
};

const ordersConfig = {
  orders: {
    label: "Orders",
    color: "hsl(var(--accent))",
  },
};

const Dashboard = () => {
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [isExportingSnapshot, setIsExportingSnapshot] = useState(false);
  const [kpis, setKpis] = useState<DashboardKpis>(fallbackKpis);
  const [ordersPerStore, setOrdersPerStore] = useState<Array<{ store_name: string; orders: number }>>([]);
  const [revenue7, setRevenue7] = useState<Array<{ day: string; revenue: number }>>([]);
  const [revenue30, setRevenue30] = useState<Array<{ day: string; revenue: number }>>([]);
  const [orders7, setOrders7] = useState<Array<{ day: string; orders: number }>>([]);
  const [lowStockProducts, setLowStockProducts] = useState<
    Array<{ name: string; sku: string; store_name: string; stock_left: number }>
  >([]);
  const navigate = useNavigate();

  const loadDashboardSummary = useCallback(async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");
      const summary = await adminApi.getDashboardSummary({ threshold: 10, limit: 200 }) as {
        kpis?: Partial<DashboardKpis>;
        orders_per_store?: Array<{ store_name?: string; orders?: number }>;
        revenue_7d?: Array<{ day?: string; revenue?: number }>;
        revenue_30d?: Array<{ day?: string; revenue?: number }>;
        orders_7d?: Array<{ day?: string; orders?: number }>;
        low_stock_products?: Array<{ name?: string; sku?: string; store_name?: string; stock_left?: number }>;
      };

      const incomingKpis = summary.kpis;
      if (incomingKpis) {
        const nextKpis: DashboardKpis = {
          total_revenue: Number(incomingKpis.total_revenue || 0),
          today_revenue: Number(incomingKpis.today_revenue || 0),
          month_revenue: Number(incomingKpis.month_revenue || 0),
          year_revenue: Number(incomingKpis.year_revenue || 0),
          total_orders: Number(incomingKpis.total_orders || 0),
          pending_orders: Number(incomingKpis.pending_orders || 0),
          ready_to_ship_orders: Number(incomingKpis.ready_to_ship_orders || 0),
          failed_payments: Number(incomingKpis.failed_payments || 0),
          revenue_vs_last_month_pct: Number(incomingKpis.revenue_vs_last_month_pct || 0),
          total_orders_vs_prev_7d_pct: Number(incomingKpis.total_orders_vs_prev_7d_pct || 0),
          pending_orders_vs_prev_7d_pct: Number(incomingKpis.pending_orders_vs_prev_7d_pct || 0),
          ready_to_ship_vs_prev_7d_pct: Number(incomingKpis.ready_to_ship_vs_prev_7d_pct || 0),
          failed_payments_vs_prev_7d_pct: Number(incomingKpis.failed_payments_vs_prev_7d_pct || 0),
        };
        setKpis(nextKpis);
      }

      setOrdersPerStore(
        (summary.orders_per_store || []).map((item) => ({
          store_name: item.store_name || "Unassigned",
          orders: Number(item.orders || 0),
        })),
      );
      setLowStockProducts(
        (summary.low_stock_products || []).map((item) => ({
          name: item.name || "Unnamed Product",
          sku: item.sku || "-",
          store_name: item.store_name || "Unknown Store",
          stock_left: Number(item.stock_left || 0),
        })),
      );
      setOrders7(
        (summary.orders_7d || []).map((item) => ({
          day: item.day || "-",
          orders: Number(item.orders || 0),
        })),
      );
      setRevenue7(
        (summary.revenue_7d || []).map((item) => ({
          day: item.day || "-",
          revenue: Number(item.revenue || 0),
        })),
      );
      setRevenue30(
        (summary.revenue_30d || []).map((item) => ({
          day: item.day || "-",
          revenue: Number(item.revenue || 0),
        })),
      );
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Failed to load dashboard summary");
      setOrdersPerStore([]);
      setLowStockProducts([]);
      setOrders7([]);
      setRevenue7([]);
      setRevenue30([]);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardSummary();
    const intervalId = window.setInterval(() => {
      void loadDashboardSummary();
    }, DASHBOARD_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadDashboardSummary]);

  const storeOrders = useMemo(() => {
    const total = ordersPerStore.reduce((sum, store) => sum + store.orders, 0);
    return ordersPerStore.map((store) => ({
      name: store.store_name,
      orders: store.orders,
      share: total > 0 ? Math.round((store.orders / total) * 100) : 0,
    }));
  }, [ordersPerStore]);
  const statsCards = useMemo(
    () => [
      {
        label: "Total Orders",
        value: formatInteger(kpis.total_orders),
        change: formatPercent(kpis.total_orders_vs_prev_7d_pct),
        trend: kpis.total_orders_vs_prev_7d_pct >= 0 ? ("up" as const) : ("down" as const),
      },
      {
        label: "Pending Orders",
        value: formatInteger(kpis.pending_orders),
        change: formatPercent(kpis.pending_orders_vs_prev_7d_pct),
        trend: kpis.pending_orders_vs_prev_7d_pct >= 0 ? ("up" as const) : ("down" as const),
      },
      {
        label: "Orders Ready to Ship",
        value: formatInteger(kpis.ready_to_ship_orders),
        change: formatPercent(kpis.ready_to_ship_vs_prev_7d_pct),
        trend: kpis.ready_to_ship_vs_prev_7d_pct >= 0 ? ("up" as const) : ("down" as const),
      },
      {
        label: "Failed Payments",
        value: formatInteger(kpis.failed_payments),
        change: formatPercent(kpis.failed_payments_vs_prev_7d_pct),
        trend: kpis.failed_payments_vs_prev_7d_pct >= 0 ? ("up" as const) : ("down" as const),
      },
    ],
    [kpis],
  );
  const visibleLowStockProducts = lowStockProducts.slice(0, 4);
  const lowStockBelowTenCount = lowStockProducts.length;

  const handleExportSnapshot = () => {
    try {
      setIsExportingSnapshot(true);
      const exportedAt = new Date();
      const snapshot = {
        exported_at: exportedAt.toISOString(),
        source: "admin_dashboard",
        kpis,
        kpi_cards: statsCards,
        alerts,
        charts: {
          revenue_7d: revenue7,
          revenue_30d: revenue30,
          orders_7d: orders7,
        },
        orders_per_store: storeOrders,
        low_stock_products: lowStockProducts,
      };

      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const fileStamp = exportedAt.toISOString().replace(/[:.]/g, "-");
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `dashboard-snapshot-${fileStamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success("Snapshot exported", {
        description: "Dashboard snapshot has been downloaded successfully.",
      });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Could not export dashboard snapshot.",
      });
    } finally {
      setIsExportingSnapshot(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Your real-time command center for revenue, orders, and operational health across Portugal and Spain."
        actions={
          <>
            <Button variant="outline" onClick={handleExportSnapshot} disabled={isExportingSnapshot}>
              {isExportingSnapshot ? "Exporting..." : "Export Snapshot"}
            </Button>
          </>
        }
      />
      {dashboardError ? (
        <Alert className="bg-background/70">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Dashboard Data Error</AlertTitle>
          <AlertDescription>{dashboardError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border-border/60 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="font-display text-3xl">{formatCurrency(kpis.total_revenue)}</CardTitle>
            </div>
            <Badge
              variant="secondary"
              className={
                kpis.revenue_vs_last_month_pct >= 0
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }
            >
              {`${formatPercent(kpis.revenue_vs_last_month_pct)} vs last month`}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-dashed border-border/60 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today</p>
              <p className="text-lg font-semibold">{formatCurrency(kpis.today_revenue)}</p>
            </div>
            <div className="rounded-lg border border-dashed border-border/60 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Month</p>
              <p className="text-lg font-semibold">{formatCurrency(kpis.month_revenue)}</p>
            </div>
            <div className="rounded-lg border border-dashed border-border/60 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Year</p>
              <p className="text-lg font-semibold">{formatCurrency(kpis.year_revenue)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {statsCards.map((stat, index) => (
            <Card
              key={stat.label}
              className="border-border/60 bg-card/90 transition-all animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <span className={stat.trend === "up" ? "text-emerald-600" : "text-rose-600"}>
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                </span>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/90">
          <Tabs defaultValue="7d" className="space-y-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-xl">Revenue Trend</CardTitle>
                <CardDescription>Last 7 / 30 days performance</CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="7d">7 days</TabsTrigger>
                <TabsTrigger value="30d">30 days</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="7d">
                <ChartContainer config={revenueConfig} className="h-[240px] w-full">
                  <AreaChart
                    data={
                      revenue7.length > 0
                        ? revenue7
                        : [
                            { day: "Mon", revenue: 0 },
                            { day: "Tue", revenue: 0 },
                            { day: "Wed", revenue: 0 },
                            { day: "Thu", revenue: 0 },
                            { day: "Fri", revenue: 0 },
                            { day: "Sat", revenue: 0 },
                            { day: "Sun", revenue: 0 },
                          ]
                    }
                    margin={{ left: 0, right: 0 }}
                  >
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      fill="url(#revFill)"
                    />
                  </AreaChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="30d">
                <ChartContainer config={revenueConfig} className="h-[240px] w-full">
                  <AreaChart data={revenue30.length > 0 ? revenue30 : [{ day: "D1", revenue: 0 }]} margin={{ left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id="revFill30" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" interval={Math.max(Math.floor(revenue30.length / 8), 1)} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      fill="url(#revFill30)"
                    />
                  </AreaChart>
                </ChartContainer>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">Orders Flow</CardTitle>
            <CardDescription>Last 7 days order volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ordersConfig} className="h-[240px] w-full">
              <BarChart data={orders7.length > 0 ? orders7 : [{ day: "Mon", orders: 0 }, { day: "Tue", orders: 0 }, { day: "Wed", orders: 0 }, { day: "Thu", orders: 0 }, { day: "Fri", orders: 0 }, { day: "Sat", orders: 0 }, { day: "Sun", orders: 0 }]} margin={{ left: 0, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">Orders Per Store</CardTitle>
            <CardDescription>Live distribution based on assigned order routing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardLoading ? (
              <p className="text-sm text-muted-foreground">Loading live store distribution...</p>
            ) : storeOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No routed orders available yet.</p>
            ) : storeOrders.map((store) => (
              <div key={store.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{store.name}</span>
                  <span className="text-muted-foreground">{store.orders} orders</span>
                </div>
                <Progress value={store.share} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">Low Stock Products</CardTitle>
            <CardDescription>Prioritize replenishment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardLoading ? (
              <p className="text-sm text-muted-foreground">Loading low stock products...</p>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products are below 10 units.</p>
            ) : visibleLowStockProducts.map((item) => (
              <div
                key={`${item.sku}-${item.store_name}-${item.name}`}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">SKU {item.sku}</p>
                  <p className="text-xs text-muted-foreground">Store: {item.store_name}</p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {item.stock_left} left
                </Badge>
              </div>
            ))}
            {!dashboardLoading && lowStockProducts.length > 4 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/low-stock")}
              >
                View All
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">System Alerts</CardTitle>
            <CardDescription>Integration status and live incidents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.title} className="bg-background/70">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">Operational Focus</CardTitle>
            <CardDescription>Quick actions for the team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-4">
              <div>
                <p className="text-sm font-medium">Pending Orders Review</p>
                <p className="text-xs text-muted-foreground">{kpis.pending_orders} orders waiting for payment</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-[136px] justify-center"
                onClick={() => navigate("/admin/orders/packaging")}
              >
                Review
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-4">
              <div>
                <p className="text-sm font-medium">Ready to Ship</p>
                <p className="text-xs text-muted-foreground">{kpis.ready_to_ship_orders} orders ready for pickup</p>
              </div>
              <Button size="sm" variant="outline" className="w-[136px] justify-center" onClick={() => navigate("/admin/shipping")}>
                Print Labels
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-4">
              <div>
                <p className="text-sm font-medium">Failed Payments</p>
                <p className="text-xs text-muted-foreground">{kpis.failed_payments} customers need follow-up</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-[136px] justify-center"
                onClick={() => navigate("/admin/payments")}
              >
                Send Reminder
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Package className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">{lowStockBelowTenCount} products below 10 units</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-[136px] justify-center"
                onClick={() => navigate("/admin/low-stock")}
              >
                Reorder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
