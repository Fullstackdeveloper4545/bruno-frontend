import { useEffect, useMemo, useState } from "react";
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
import { adminApi } from "@/lib/adminApi";

const stats = [
  {
    label: "Total Orders",
    value: "2,482",
    change: "+4.3%",
    trend: "up" as const,
  },
  {
    label: "Pending Orders",
    value: "86",
    change: "-2.1%",
    trend: "down" as const,
  },
  {
    label: "Orders Ready to Ship",
    value: "142",
    change: "+6.9%",
    trend: "up" as const,
  },
  {
    label: "Failed Payments",
    value: "12",
    change: "-1.4%",
    trend: "down" as const,
  },
];

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
  const [ordersPerStore, setOrdersPerStore] = useState<Array<{ store_name: string; orders: number }>>([]);
  const [revenue7, setRevenue7] = useState<Array<{ day: string; revenue: number }>>([]);
  const [revenue30, setRevenue30] = useState<Array<{ day: string; revenue: number }>>([]);
  const [orders7, setOrders7] = useState<Array<{ day: string; orders: number }>>([]);
  const [lowStockProducts, setLowStockProducts] = useState<
    Array<{ name: string; sku: string; store_name: string; stock_left: number }>
  >([]);
  const navigate = useNavigate();

  const loadDashboardSummary = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");
      const summary = await adminApi.getDashboardSummary({ threshold: 5, limit: 8 }) as {
        orders_per_store?: Array<{ store_name?: string; orders?: number }>;
        revenue_7d?: Array<{ day?: string; revenue?: number }>;
        revenue_30d?: Array<{ day?: string; revenue?: number }>;
        orders_7d?: Array<{ day?: string; orders?: number }>;
        low_stock_products?: Array<{ name?: string; sku?: string; store_name?: string; stock_left?: number }>;
      };

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
  };

  useEffect(() => {
    void loadDashboardSummary();
  }, []);

  const storeOrders = useMemo(() => {
    const total = ordersPerStore.reduce((sum, store) => sum + store.orders, 0);
    return ordersPerStore.map((store) => ({
      name: store.store_name,
      orders: store.orders,
      share: total > 0 ? Math.round((store.orders / total) * 100) : 0,
    }));
  }, [ordersPerStore]);
  const visibleLowStockProducts = lowStockProducts.slice(0, 4);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Your real-time command center for revenue, orders, and operational health across Portugal and Spain."
        actions={
          <>
            <Button variant="outline">Export Snapshot</Button>
            <Button>New Order</Button>
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
              <CardTitle className="font-display text-3xl">EUR 1,284,320</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              +12.4% vs last month
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-dashed border-border/60 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today</p>
              <p className="text-lg font-semibold">EUR 18,240</p>
            </div>
            <div className="rounded-lg border border-dashed border-border/60 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Month</p>
              <p className="text-lg font-semibold">EUR 412,300</p>
            </div>
            <div className="rounded-lg border border-dashed border-border/60 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Year</p>
              <p className="text-lg font-semibold">EUR 5,142,000</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {stats.map((stat, index) => (
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
              <p className="text-sm text-muted-foreground">No products are below the stock threshold.</p>
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
                <p className="text-xs text-muted-foreground">86 orders waiting for payment</p>
              </div>
              <Button size="sm" variant="outline">
                Review
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-4">
              <div>
                <p className="text-sm font-medium">Ready to Ship</p>
                <p className="text-xs text-muted-foreground">142 orders ready for pickup</p>
              </div>
              <Button size="sm">Print Labels</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-4">
              <div>
                <p className="text-sm font-medium">Failed Payments</p>
                <p className="text-xs text-muted-foreground">12 customers need follow-up</p>
              </div>
              <Button size="sm" variant="outline">
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
                  <p className="text-xs text-muted-foreground">4 products below 10 units</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
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
