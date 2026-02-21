import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Package } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const revenue7 = [
  { day: "Mon", revenue: 12600 },
  { day: "Tue", revenue: 14850 },
  { day: "Wed", revenue: 13980 },
  { day: "Thu", revenue: 16840 },
  { day: "Fri", revenue: 19210 },
  { day: "Sat", revenue: 22450 },
  { day: "Sun", revenue: 17890 },
];

const orders7 = [
  { day: "Mon", orders: 128 },
  { day: "Tue", orders: 142 },
  { day: "Wed", orders: 131 },
  { day: "Thu", orders: 156 },
  { day: "Fri", orders: 182 },
  { day: "Sat", orders: 196 },
  { day: "Sun", orders: 160 },
];

const revenue30 = Array.from({ length: 30 }, (_, index) => ({
  day: `D${index + 1}`,
  revenue: 11200 + (index % 7) * 1200 + (index % 3) * 850,
}));

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

const storeOrders = [
  { name: "Lisbon Central", orders: 520, share: 54 },
  { name: "Porto Riverside", orders: 280, share: 29 },
  { name: "Madrid Norte", orders: 160, share: 17 },
];

const lowStock = [
  { name: "Azulejo Ceramic Vase", sku: "PT-AZ-118", stock: 6 },
  { name: "Serra Linen Throw", sku: "PT-SE-342", stock: 9 },
  { name: "Algarve Olive Oil", sku: "PT-AL-221", stock: 4 },
  { name: "Basalto Serving Tray", sku: "PT-BA-904", stock: 7 },
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
                  <AreaChart data={revenue7} margin={{ left: 0, right: 0 }}>
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
                  <AreaChart data={revenue30} margin={{ left: 0, right: 0 }}>
                    <defs>
                      <linearGradient id="revFill30" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" interval={4} />
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
              <BarChart data={orders7} margin={{ left: 0, right: 0 }}>
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
            <CardDescription>Live distribution across the three stores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {storeOrders.map((store) => (
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
            {lowStock.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">SKU {item.sku}</p>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  {item.stock} left
                </Badge>
              </div>
            ))}
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
